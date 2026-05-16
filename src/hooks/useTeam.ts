import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Team, Student } from '@/types/database'

export interface TeamWithMembers extends Team {
  team_members: Array<{
    student_id: string
    students: Pick<Student, 'id' | 'nama' | 'foto_url'> | null
  }>
}

export interface TeamMemberRow {
  team_id: string
  teams: TeamWithMembers | null
}

export interface ParentStudentRow {
  student_id: string
  students: (Student & {
    team_members: Array<{ team_id: string; teams: Team | null }>
  }) | null
}

export function useCoachTeams() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery<TeamWithMembers[]>({
    queryKey: ['teams', 'coach', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('teams')
        .select('*, team_members(student_id, students(id, nama, foto_url))')
        .eq('coach_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as TeamWithMembers[]
    },
    enabled: !!userId,
  })
}

export function useStudentTeam() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery<TeamWithMembers | null>({
    queryKey: ['team', 'student', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id, teams(*, team_members(student_id, students(id, nama, foto_url)))')
        .eq('student_id', userId)
        .single()
      if (error) return null
      const raw = data as TeamMemberRow | null
      return raw?.teams ?? null
    },
    enabled: !!userId,
  })
}

export function useParentStudents() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery<Array<ParentStudentRow['students']>>({
    queryKey: ['parent_students', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('parent_students')
        .select('student_id, students(*, team_members(team_id, teams(*)))')
        .eq('parent_id', userId)
      if (error) throw error
      return ((data ?? []) as ParentStudentRow[]).map((r) => r.students).filter(Boolean)
    },
    enabled: !!userId,
  })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async ({ teamId, updates }: {
      teamId: string
      updates: { nama_tim?: string; judul_penelitian?: string }
    }) => {
      const { error } = await supabase.from('teams').update(updates).eq('id', teamId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', 'coach', userId] })
    },
  })
}
