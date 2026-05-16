import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useCoachProfile() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['coach', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('coaches')
        .select('*, coach_skills(*)')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useStudentProfile() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['student', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useParentProfile() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: ['parent', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
