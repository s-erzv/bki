import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database, Class } from '@/types/database'

type ClassInsert = Database['public']['Tables']['classes']['Insert']
type ClassUpdate = Database['public']['Tables']['classes']['Update']

export interface ClassWithTeams extends Class {
  class_teams: Array<{
    team_id: string
    teams: { id: string; team_code: string; research_title: string | null } | null
  }>
}

/* ─── Coach ─────────────────────────────────────────────── */

export function useCoachClasses() {
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))

  return useQuery<ClassWithTeams[]>({
    queryKey: ['classes', 'coach', coachId],
    queryFn: async () => {
      if (!coachId) return []
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_teams(team_id, teams(id, team_code, research_title))
        `)
        .eq('coach_id', coachId)
        .order('scheduled_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as ClassWithTeams[]
    },
    enabled: !!coachId,
  })
}

/* ─── Student ───────────────────────────────────────────── */

export function useStudentClasses(teamId: string | null | undefined) {
  return useQuery<Class[]>({
    queryKey: ['classes', 'student', teamId],
    queryFn: async () => {
      if (!teamId) return []
      const { data: ct, error: ctErr } = await supabase
        .from('class_teams')
        .select('class_id')
        .eq('team_id', teamId)
      if (ctErr) throw ctErr
      const ids = (ct as Array<{ class_id: string }> | null ?? []).map((r) => r.class_id)
      if (ids.length === 0) return []
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .in('id', ids)
        .order('scheduled_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Class[]
    },
    enabled: !!teamId,
  })
}

/* ─── Mutations ─────────────────────────────────────────── */

export function useCreateClass() {
  const qc = useQueryClient()
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))

  return useMutation<{ cls: Class; gmeetWarning?: string }, Error, {
    classData: Omit<ClassInsert, 'coach_id'>
    teamIds: string[]
  }>({
    mutationFn: async ({ classData, teamIds }) => {
      if (!coachId) throw new Error('Akun pembimbing belum lengkap')
      const { data, error } = await supabase
        .from('classes')
        .insert({ ...classData, coach_id: coachId })
        .select()
        .single()
      if (error) throw error
      let cls = data as Class

      // Insert team links first — class_teams powers the Calendar event title.
      if (teamIds.length > 0) {
        const { error: ctErr } = await supabase
          .from('class_teams')
          .insert(teamIds.map((team_id) => ({ class_id: cls.id, team_id })))
        if (ctErr) throw ctErr
      }

      // For online classes, auto-create the Meet link + Calendar event ONLY IF NOT PROVIDED.
      // We DON'T fail the whole mutation if this errors — class still got
      // inserted, just the Meet link is missing. Surface as warning.
      let gmeetWarning: string | undefined
      if (cls.media === 'online' && !cls.gmeet_link) {
        const { data: resp, error: fnErr } = await supabase.functions.invoke('create-gmeet', {
          body: { classId: cls.id },
        })
        if (fnErr) {
          gmeetWarning = await readFnError(fnErr) ?? fnErr.message
        } else if (resp?.error) {
          gmeetWarning = resp.error
        } else if (resp?.gmeet_link) {
          // Refresh local row with the Meet link
          cls = { ...cls, gmeet_link: resp.gmeet_link, gcal_event_id: resp.gcal_event_id }
        }
      }

      return { cls, gmeetWarning }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

export function useUpdateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      classId, updates, teamIds,
    }: {
      classId: string
      updates: ClassUpdate
      teamIds?: string[]   // if provided, replace class_teams
    }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', classId)
        .select()
        .single()
      if (error) throw error

      // Replace-all strategy for class_teams when teamIds passed.
      if (teamIds) {
        const { error: delErr } = await supabase.from('class_teams').delete().eq('class_id', classId)
        if (delErr) throw delErr
        if (teamIds.length > 0) {
          const { error: insErr } = await supabase
            .from('class_teams')
            .insert(teamIds.map((team_id) => ({ class_id: classId, team_id })))
          if (insErr) throw insErr
        }
      }
      return data as Class
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

export function useDeleteClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (classId: string) => {
      // class_teams + sessions reference classes; clean up first since there's
      // no ON DELETE CASCADE on these FKs.
      const { error: ctErr } = await supabase.from('class_teams').delete().eq('class_id', classId)
      if (ctErr) throw ctErr
      // Unlink sessions (class_id is nullable on sessions, just clear it).
      await supabase.from('sessions').update({ class_id: null }).eq('class_id', classId)
      const { error } = await supabase.from('classes').delete().eq('id', classId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

async function readFnError(err: unknown): Promise<string | null> {
  const ctx = (err as { context?: { response?: Response } })?.context
  if (!ctx?.response) return null
  try {
    const body = await ctx.response.clone().json()
    return body?.error ?? null
  } catch {
    return null
  }
}
