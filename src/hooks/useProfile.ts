import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Coach, CoachSkill, Database, Parent, Profile, Student } from '@/types/database'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/* ─── Profile ───────────────────────────────────────────── */

export function useProfile() {
  const profileId = useAuthStore((s) => s.profile?.id)
  return useQuery<Profile | null>({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      if (!profileId) return null
      const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId).maybeSingle()
      if (error) throw error
      return (data as Profile | null) ?? null
    },
    enabled: !!profileId,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const profileId = useAuthStore((s) => s.profile?.id)
  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!profileId) throw new Error('Profil belum lengkap')
      const { error } = await supabase.from('profiles').update(updates).eq('id', profileId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

/* ─── Role-specific ─────────────────────────────────────── */

export interface CoachWithSkills extends Coach {
  coach_skills: CoachSkill[]
}

export function useCoachProfile() {
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))
  return useQuery<CoachWithSkills | null>({
    queryKey: ['coach', coachId],
    queryFn: async () => {
      if (!coachId) return null
      const { data, error } = await supabase
        .from('coaches')
        .select('*, coach_skills(*)')
        .eq('id', coachId)
        .maybeSingle()
      if (error) throw error
      return (data as unknown as CoachWithSkills | null) ?? null
    },
    enabled: !!coachId,
  })
}

export function useStudentProfile() {
  const studentId = useAuthStore((s) => (s.profile?.role === 'student' ? s.roleId : null))
  return useQuery<Student | null>({
    queryKey: ['student', studentId],
    queryFn: async () => {
      if (!studentId) return null
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .maybeSingle()
      if (error) throw error
      return (data as Student | null) ?? null
    },
    enabled: !!studentId,
  })
}

export function useParentProfile() {
  const parentId = useAuthStore((s) => (s.profile?.role === 'parent' ? s.roleId : null))
  return useQuery<Parent | null>({
    queryKey: ['parent', parentId],
    queryFn: async () => {
      if (!parentId) return null
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .eq('id', parentId)
        .maybeSingle()
      if (error) throw error
      return (data as Parent | null) ?? null
    },
    enabled: !!parentId,
  })
}
