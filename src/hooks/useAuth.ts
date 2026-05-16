import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/database'

export function useAuthListener() {
  const { setSession, setProfile, setLoading, clear } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id, setProfile)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session) {
          await fetchProfile(session.user.id, setProfile)
          // Save OAuth tokens after Google login
          if (event === 'SIGNED_IN' && session.provider_token) {
            await saveOauthToken(session.user.id, session.provider_token)
          }
        } else {
          clear()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setSession, setProfile, setLoading, clear])
}

async function fetchProfile(
  userId: string,
  setProfile: (p: import('@/types/database').Profile | null) => void
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .single()
  if (!error && data) setProfile(data)
}

async function saveOauthToken(userId: string, accessToken: string) {
  await supabase.from('oauth_tokens').upsert({
    user_id: userId,
    scope_level: 'basic',
    access_token: accessToken,
  }, { onConflict: 'user_id' })
}

/* ── Sign In (existing users) ─────────────────────────── */

export function useSignInWithGoogle() {
  return async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'email profile',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }
}

export function useSignInWithEmail() {
  return async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
}

/* ── Sign Up (new users) ──────────────────────────────── */

export function useSignUpWithGoogle() {
  return async (role: UserRole = 'student') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'email profile',
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { role },  // passed to raw_user_meta_data via trigger
      },
    })
    if (error) throw error
  }
}

export function useSignUpWithEmail() {
  return async (email: string, password: string, role: UserRole = 'student', fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },  // stored in raw_user_meta_data
      },
    })
    if (error) throw error
  }
}

/* ── Sign Out ─────────────────────────────────────────── */

export function useSignOut() {
  const { clear } = useAuthStore()
  return async () => {
    await supabase.auth.signOut()
    clear()
  }
}

/* ── Helpers ──────────────────────────────────────────── */

export function useRoleRedirectPath(role: UserRole | undefined | null): string {
  switch (role) {
    case 'coach':   return '/coach'
    case 'student': return '/student'
    case 'parent':  return '/parent'
    case 'admin':   return '/admin'
    default:        return '/'
  }
}
