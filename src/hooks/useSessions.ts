import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database, SessionMedia, Session, SessionStudentReport } from '@/types/database'

type SessionStudentReportInsert = Database['public']['Tables']['session_student_reports']['Insert']

export interface SessionWithDetails extends Session {
  teams: { team_code: string; nama_tim: string | null } | null
  session_student_reports: SessionStudentReport[]
  session_docs: Array<{ id: string; storage_path: string }>
}

export interface SessionFormData {
  class_id: string | null
  team_id: string
  date: string
  duration_minutes: number
  media: SessionMedia
  location: string
  topic: string
  achievement: string
  homework: string
  evaluation: string
  studentReports: Omit<SessionStudentReportInsert, 'session_id'>[]
  photoPaths: string[]
}

export function useCoachSessions() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery<SessionWithDetails[]>({
    queryKey: ['sessions', 'coach', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', userId)
        .is('deleted_at', null)

      const teamIds = ((teams ?? []) as Array<{ id: string }>).map((t) => t.id)
      if (teamIds.length === 0) return []

      const { data, error } = await supabase
        .from('sessions')
        .select('*, teams(team_code, nama_tim), session_student_reports(*), session_docs(*)')
        .in('team_id', teamIds)
        .is('deleted_at', null)
        .order('date', { ascending: false })
      if (error) throw error
      return (data ?? []) as SessionWithDetails[]
    },
    enabled: !!userId,
  })
}

export function useStudentSessions(teamId: string | null | undefined) {
  return useQuery<Session[]>({
    queryKey: ['sessions', 'student', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const { data, error } = await supabase
        .from('sessions')
        .select('*, session_student_reports(*), session_docs(*)')
        .eq('team_id', teamId)
        .is('deleted_at', null)
        .order('date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Session[]
    },
    enabled: !!teamId,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (formData: SessionFormData) => {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          class_id: formData.class_id,
          team_id: formData.team_id,
          date: formData.date,
          duration_minutes: formData.duration_minutes,
          media: formData.media,
          location: formData.location,
          topic: formData.topic,
          achievement: formData.achievement,
          homework: formData.homework,
          evaluation: formData.evaluation,
        })
        .select()
        .single()
      if (sessionError) throw sessionError

      const newSession = session as Session

      if (formData.studentReports.length > 0) {
        const { error: reportsError } = await supabase
          .from('session_student_reports')
          .insert(formData.studentReports.map((r) => ({ ...r, session_id: newSession.id })))
        if (reportsError) throw reportsError
      }

      if (formData.photoPaths.length > 0) {
        const { error: docsError } = await supabase
          .from('session_docs')
          .insert(formData.photoPaths.map((p) => ({ session_id: newSession.id, storage_path: p })))
        if (docsError) throw docsError
      }

      return newSession
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
