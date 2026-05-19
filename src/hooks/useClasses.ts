import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database, Class } from '@/types/database'

type ClassInsert = Database['public']['Tables']['classes']['Insert']

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
      const cls = data as Class

      // Insert team links first — class_teams powers the Calendar event title.
      if (teamIds.length > 0) {
        const { error: ctErr } = await supabase
          .from('class_teams')
          .insert(teamIds.map((team_id) => ({ class_id: cls.id, team_id })))
        if (ctErr) throw ctErr
      }

      // For online classes, auto-create the Meet link + Calendar event.
      // We DON'T fail the whole mutation if this errors — class still got
      // inserted, just the Meet link is missing. Surface as warning.
      let gmeetWarning: string | undefined
      if (cls.media === 'online') {
        const { data: resp, error: fnErr } = await supabase.functions.invoke('create-gmeet', {
          body: { classId: cls.id },
        })
        if (fnErr) {
          gmeetWarning = await readFnError(fnErr) ?? fnErr.message
        } else if (resp?.error) {
          gmeetWarning = resp.error
        } else if (resp?.gmeet_link) {
          // Refresh local row with the Meet link
          (cls as Class).gmeet_link = resp.gmeet_link
          ;(cls as Class).gcal_event_id = resp.gcal_event_id
        }
      }

      return { cls, gmeetWarning }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
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
