import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Team, Student } from '@/types/database'

/** Student profile fields we need everywhere. */
export interface StudentBrief {
  id: string
  profile_id: string
  grade: string | null
  major: string | null
  profiles: { full_name: string; photo_url: string | null } | null
}

export interface TeamWithMembers extends Team {
  team_members: Array<{ student_id: string; students: StudentBrief | null }>
}

/* ─── Coach ─────────────────────────────────────────────── */

export function useCoachTeams() {
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))

  return useQuery<TeamWithMembers[]>({
    queryKey: ['teams', 'coach', coachId],
    queryFn: async () => {
      if (!coachId) return []
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(
            student_id,
            students(id, profile_id, grade, major, profiles(full_name, photo_url))
          )
        `)
        .eq('coach_id', coachId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as TeamWithMembers[]
    },
    enabled: !!coachId,
  })
}

/* ─── Student ───────────────────────────────────────────── */

export function useStudentTeam() {
  const studentId = useAuthStore((s) => (s.profile?.role === 'student' ? s.roleId : null))

  return useQuery<TeamWithMembers | null>({
    queryKey: ['team', 'student', studentId],
    queryFn: async () => {
      if (!studentId) return null
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams(
            *,
            team_members(
              student_id,
              students(id, profile_id, grade, major, profiles(full_name, photo_url))
            )
          )
        `)
        .eq('student_id', studentId)
        .is('teams.deleted_at', null)
        .maybeSingle()
      if (error) return null
      const teams = (data as { teams: TeamWithMembers | null } | null)?.teams
      return teams ?? null
    },
    enabled: !!studentId,
  })
}

/* ─── Parent ────────────────────────────────────────────── */

export interface ParentChild extends Student {
  profiles: { full_name: string; photo_url: string | null } | null
  team_members: Array<{ team_id: string; teams: Team | null }>
}

export function useParentStudents() {
  const parentId = useAuthStore((s) => (s.profile?.role === 'parent' ? s.roleId : null))

  return useQuery<ParentChild[]>({
    queryKey: ['parent_students', parentId],
    queryFn: async () => {
      if (!parentId) return []
      const { data, error } = await supabase
        .from('parent_students')
        .select(`
          student_id,
          students(
            *,
            profiles(full_name, photo_url),
            team_members(team_id, teams(*))
          )
        `)
        .eq('parent_id', parentId)
      if (error) throw error
      type Row = { students: ParentChild | null }
      return ((data ?? []) as unknown as Row[])
        .map((r) => r.students)
        .filter((s): s is ParentChild => s !== null && (s as Student).deleted_at === null)
    },
    enabled: !!parentId,
  })
}

/* ─── Mutations ─────────────────────────────────────────── */

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ teamId, updates }: { teamId: string; updates: { research_title?: string | null } }) => {
      const { error } = await supabase.from('teams').update(updates).eq('id', teamId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  })
}
