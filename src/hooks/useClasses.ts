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

  return useMutation({
    mutationFn: async ({
      classData,
      teamIds,
    }: {
      classData: Omit<ClassInsert, 'coach_id'>
      teamIds: string[]
    }) => {
      if (!coachId) throw new Error('Akun pembimbing belum lengkap')
      const { data, error } = await supabase
        .from('classes')
        .insert({ ...classData, coach_id: coachId })
        .select()
        .single()
      if (error) throw error
      const cls = data as Class
      if (teamIds.length > 0) {
        const { error: ctErr } = await supabase
          .from('class_teams')
          .insert(teamIds.map((team_id) => ({ class_id: cls.id, team_id })))
        if (ctErr) throw ctErr
      }
      return cls
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}
