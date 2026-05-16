import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database, Class } from '@/types/database'

type ClassInsert = Database['public']['Tables']['classes']['Insert']

export interface ClassWithTeams extends Class {
  class_teams: Array<{
    team_id: string
    teams: { id: string; team_code: string; nama_tim: string | null } | null
  }>
}

export function useCoachClasses() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery<ClassWithTeams[]>({
    queryKey: ['classes', 'coach', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', userId)
        .is('deleted_at', null)

      const teamIds = ((teams ?? []) as Array<{ id: string }>).map((t) => t.id)
      if (teamIds.length === 0) return []

      const { data: classTeams } = await supabase
        .from('class_teams')
        .select('class_id')
        .in('team_id', teamIds)

      const classIds = [...new Set(((classTeams ?? []) as Array<{ class_id: string }>).map((ct) => ct.class_id))]
      if (classIds.length === 0) return []

      const { data, error } = await supabase
        .from('classes')
        .select('*, class_teams(team_id, teams(id, team_code, nama_tim))')
        .in('id', classIds)
        .is('deleted_at', null)
        .order('date', { ascending: false })
      if (error) throw error
      return (data ?? []) as ClassWithTeams[]
    },
    enabled: !!userId,
  })
}

export function useStudentClasses(teamId: string | null | undefined) {
  return useQuery<Class[]>({
    queryKey: ['classes', 'student', teamId],
    queryFn: async () => {
      if (!teamId) return []

      const { data: classTeams } = await supabase
        .from('class_teams')
        .select('class_id')
        .eq('team_id', teamId)

      const classIds = ((classTeams ?? []) as Array<{ class_id: string }>).map((ct) => ct.class_id)
      if (classIds.length === 0) return []

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds)
        .is('deleted_at', null)
        .order('date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Class[]
    },
    enabled: !!teamId,
  })
}

export function useCreateClass() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async ({
      classData,
      teamIds,
    }: {
      classData: Omit<ClassInsert, 'created_by'>
      teamIds: string[]
    }) => {
      const { data, error } = await supabase
        .from('classes')
        .insert({ ...classData, created_by: userId })
        .select()
        .single()
      if (error) throw error

      const cls = data as Class
      if (teamIds.length > 0) {
        const { error: ctError } = await supabase
          .from('class_teams')
          .insert(teamIds.map((team_id) => ({ class_id: cls.id, team_id })))
        if (ctError) throw ctError
      }
      return cls
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}
