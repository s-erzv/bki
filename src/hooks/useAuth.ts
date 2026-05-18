import { useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Profile, UserRole } from '@/types/database'

/* ── Listener ───────────────────────────────────────────── */

/**
 * Auth bootstrap. Relies SOLELY on `onAuthStateChange`, which fires
 * `INITIAL_SESSION` synchronously on subscribe with the persisted session.
 *
 * Why this shape:
 *  - Supabase's auth callback runs while holding `navigator.locks`. Awaiting
 *    DB queries inside the callback (the old code) deadlocks because the
 *    DB call needs the same lock to read the JWT. See:
 *    https://supabase.com/docs/reference/javascript/auth-onauthstatechange
 *  - We therefore set session synchronously, then kick off hydration via
 *    `queueMicrotask` so it runs AFTER the callback returns and the lock
 *    is released.
 *  - A watchdog timer guarantees the spinner clears even if `INITIAL_SESSION`
 *    never fires (e.g. stale lock from a crashed tab).
 */
export function useAuthListener() {
  const {
    setSession, setProfile, setRoleId, setOnboarded,
    setLoading, setSessionRestored, clear,
  } = useAuthStore()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSessionRestored(true)
      setLoading(false)
      return
    }

    let mounted = true

    async function hydrate(userId: string, providerToken?: string | null) {
      try {
        const profile = await fetchProfile(userId)
        if (!mounted) return
        setProfile(profile)
        if (!profile) {
          setRoleId(null)
          setOnboarded(false)
        } else {
          const roleId = await fetchRoleRowId(profile.role, profile.id)
          if (!mounted) return
          setRoleId(roleId)
          setOnboarded(Boolean(roleId) || profile.role === 'admin')
          if (providerToken) {
            await saveOauthToken(profile.id, providerToken)
          }
        }
      } catch (err) {
        console.error('[auth] hydrate error', err)
      } finally {
        if (mounted) {
          setSessionRestored(true)
          setLoading(false)
        }
      }
    }

    // Safety net: if no auth event has fired in 10s, unblock the UI so the
    // user can at least navigate to /login instead of staring at a spinner.
    const watchdog = window.setTimeout(() => {
      if (!mounted) return
      if (!useAuthStore.getState().sessionRestored) {
        console.warn('[auth] watchdog: no INITIAL_SESSION after 10s, unblocking UI')
        setSessionRestored(true)
        setLoading(false)
      }
    }, 10_000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      setSession(session)

      // IMPORTANT: never `await` Supabase calls directly inside this callback —
      // it holds the auth lock. Defer with queueMicrotask so the lock releases first.
      if (event === 'INITIAL_SESSION') {
        if (session) {
          queueMicrotask(() => { void hydrate(session.user.id) })
        } else {
          setProfile(null)
          setRoleId(null)
          setOnboarded(false)
          setSessionRestored(true)
          setLoading(false)
        }
      } else if (event === 'SIGNED_IN' && session) {
        queueMicrotask(() => { void hydrate(session.user.id, session.provider_token) })
      } else if (event === 'SIGNED_OUT') {
        clear()
      } else if (event === 'USER_UPDATED' && session) {
        queueMicrotask(() => { void hydrate(session.user.id) })
      }
      // TOKEN_REFRESHED: profile already loaded, nothing to do.
    })

    return () => {
      mounted = false
      window.clearTimeout(watchdog)
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/* ── Queries ────────────────────────────────────────────── */

async function fetchProfile(authUserId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) {
    console.error('[auth] fetchProfile', error)
    return null
  }
  return (data as Profile | null) ?? null
}

async function fetchRoleRowId(role: UserRole, profileId: string): Promise<string | null> {
  const table = role === 'coach' ? 'coaches' : role === 'student' ? 'students' : role === 'parent' ? 'parents' : null
  if (!table) return null
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (error) {
    console.error(`[auth] fetchRoleRowId(${table})`, error)
    return null
  }
  return (data as { id: string } | null)?.id ?? null
}

async function saveOauthToken(profileId: string, accessToken: string) {
  await supabase.from('oauth_tokens').upsert(
    { profile_id: profileId, provider: 'google', scope_level: 'basic', access_token: accessToken },
    { onConflict: 'profile_id' },
  )
}

/* ── Sign in / up / out ─────────────────────────────────── */

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

export function useSignUpWithGoogle() {
  return async (role: UserRole = 'student') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'email profile',
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
        data: { role },
      } as never, // 'data' lives under options but supabase-js types omit it; this is safe.
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role, full_name: fullName },
      },
    })
    if (error) throw error
  }
}

export function useSignOut() {
  const { clear } = useAuthStore()
  return async () => {
    await supabase.auth.signOut()
    clear()
  }
}

/* ── Routing helpers ────────────────────────────────────── */

export function dashboardPath(role: UserRole | null | undefined): string {
  switch (role) {
    case 'coach':   return '/coach'
    case 'student': return '/student'
    case 'parent':  return '/parent'
    case 'admin':   return '/admin'
    default:        return '/'
  }
}

export function onboardingPath(role: UserRole | null | undefined): string | null {
  switch (role) {
    case 'coach':   return '/onboarding/coach'
    case 'student': return '/onboarding/student'
    case 'parent':  return '/onboarding/parent'
    default:        return null
  }
}

/** @deprecated kept for backward compat; use {@link dashboardPath}. */
export const useRoleRedirectPath = dashboardPath
