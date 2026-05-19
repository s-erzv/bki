import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database, SessionMedia, Session, SessionStudentReport } from '@/types/database'

type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']
type SessionStudentReportInsert = Database['public']['Tables']['session_student_reports']['Insert']

export interface SessionWithDetails extends Session {
  teams: {
    id: string
    team_code: string
    research_title: string | null
    drive_links: Array<{ folder_url: string; folder_name: string | null; link_type: string }>
  } | null
  session_student_reports: SessionStudentReport[]
  session_docs: Array<{ id: string; photo_url: string; sort_order: number }>
}

export interface SessionFormData {
  class_id: string | null
  team_id: string
  session_date: string // ISO timestamptz
  duration_mins: number
  media: SessionMedia
  location: string | null
  topic: string
  achievement: string | null
  homework: string | null
  evaluation: string | null
  studentReports: Omit<SessionStudentReportInsert, 'session_id'>[]
  photoUrls: string[]
}

/* ─── Queries ───────────────────────────────────────────── */

export function useCoachSessions() {
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))

  return useQuery<SessionWithDetails[]>({
    queryKey: ['sessions', 'coach', coachId],
    queryFn: async () => {
      if (!coachId) return []
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          teams(id, team_code, research_title, drive_links(folder_url, folder_name, link_type)),
          session_student_reports(*),
          session_docs(id, photo_url, sort_order)
        `)
        .eq('coach_id', coachId)
        .is('deleted_at', null)
        .order('session_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as SessionWithDetails[]
    },
    enabled: !!coachId,
  })
}

export function useStudentSessions(teamId: string | null | undefined) {
  return useQuery<SessionWithDetails[]>({
    queryKey: ['sessions', 'student', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          teams(id, team_code, research_title, drive_links(folder_url, folder_name, link_type)),
          session_student_reports(*),
          session_docs(id, photo_url, sort_order)
        `)
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .order('session_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as SessionWithDetails[]
    },
    enabled: !!teamId,
  })
}

/* ─── Mutations ─────────────────────────────────────────── */

/** Single session detail — used by SessionReportForm edit mode. */
export function useSessionDetail(sessionId: string | null | undefined) {
  return useQuery<SessionWithDetails | null>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          teams(id, team_code, research_title, drive_links(folder_url, folder_name, link_type)),
          session_student_reports(*),
          session_docs(id, photo_url, sort_order)
        `)
        .eq('id', sessionId)
        .is('deleted_at', null)
        .maybeSingle()
      if (error) throw error
      return (data as unknown as SessionWithDetails | null) ?? null
    },
    enabled: !!sessionId,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))

  return useMutation({
    mutationFn: async (form: SessionFormData) => {
      if (!coachId) throw new Error('Akun pembimbing belum lengkap')
      const payload: SessionInsert = {
        class_id: form.class_id,
        team_id: form.team_id,
        coach_id: coachId,
        session_date: form.session_date,
        duration_mins: form.duration_mins,
        media: form.media,
        location: form.location,
        topic: form.topic,
        achievement: form.achievement,
        homework: form.homework,
        evaluation: form.evaluation,
      }
      const { data, error } = await supabase
        .from('sessions')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      const created = data as Session

      if (form.studentReports.length > 0) {
        const { error: rErr } = await supabase
          .from('session_student_reports')
          .insert(form.studentReports.map((r) => ({ ...r, session_id: created.id })))
        if (rErr) throw rErr
      }

      if (form.photoUrls.length > 0) {
        const { error: dErr } = await supabase
          .from('session_docs')
          .insert(form.photoUrls.map((url, i) => ({
            session_id: created.id, photo_url: url, sort_order: i,
          })))
        if (dErr) throw dErr
      }

      return created
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

/**
 * Update a session + replace its student_reports and session_docs.
 * Replace-all is simpler than diffing; counts are small (≤6 students, ≤4 photos).
 */
export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      sessionId, form,
    }: {
      sessionId: string
      form: SessionFormData
    }) => {
      const updates: SessionUpdate = {
        class_id: form.class_id,
        team_id: form.team_id,
        session_date: form.session_date,
        duration_mins: form.duration_mins,
        media: form.media,
        location: form.location,
        topic: form.topic,
        achievement: form.achievement,
        homework: form.homework,
        evaluation: form.evaluation,
      }
      const { error } = await supabase.from('sessions').update(updates).eq('id', sessionId)
      if (error) throw error

      // Replace student_reports
      const { error: delRErr } = await supabase
        .from('session_student_reports').delete().eq('session_id', sessionId)
      if (delRErr) throw delRErr
      if (form.studentReports.length > 0) {
        const { error: insRErr } = await supabase
          .from('session_student_reports')
          .insert(form.studentReports.map((r) => ({ ...r, session_id: sessionId })))
        if (insRErr) throw insRErr
      }

      // Replace session_docs (photoUrls are public URLs after upload)
      const { error: delDErr } = await supabase
        .from('session_docs').delete().eq('session_id', sessionId)
      if (delDErr) throw delDErr
      if (form.photoUrls.length > 0) {
        const { error: insDErr } = await supabase
          .from('session_docs')
          .insert(form.photoUrls.map((url, i) => ({
            session_id: sessionId, photo_url: url, sort_order: i,
          })))
        if (insDErr) throw insDErr
      }

      return { id: sessionId }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

/** Soft-delete: sets deleted_at, all queries filter `deleted_at IS NULL`. */
export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
