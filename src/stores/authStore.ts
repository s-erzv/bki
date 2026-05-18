import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/database'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  /** PK of the role-specific row (coaches.id / students.id / parents.id) if onboarding complete. */
  roleId: string | null
  /** True when user has profile + role row. False if onboarding still needed. */
  onboarded: boolean
  loading: boolean
  sessionRestored: boolean

  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setRoleId: (roleId: string | null) => void
  setOnboarded: (v: boolean) => void
  setLoading: (loading: boolean) => void
  setSessionRestored: (restored: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  roleId: null,
  onboarded: false,
  loading: true,
  sessionRestored: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setRoleId: (roleId) => set({ roleId }),
  setOnboarded: (v) => set({ onboarded: v }),
  setLoading: (loading) => set({ loading }),
  setSessionRestored: (restored) => set({ sessionRestored: restored }),
  clear: () =>
    set({
      session: null,
      user: null,
      profile: null,
      roleId: null,
      onboarded: false,
      loading: false,
      sessionRestored: true,
    }),
}))

/** Helper: pull the metadata role from the auth user if profile not yet loaded. */
export function metadataRole(user: User | null): UserRole | null {
  const r = user?.user_metadata?.role
  if (r === 'coach' || r === 'student' || r === 'parent' || r === 'admin') return r
  return null
}
