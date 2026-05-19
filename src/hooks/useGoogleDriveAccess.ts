import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useGoogleDriveAccess() {
  const profileId = useAuthStore((s) => s.profile?.id)

  const { data: token } = useQuery({
    queryKey: ['oauth_token', profileId],
    queryFn: async () => {
      if (!profileId) return null
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('scope_level')
        .eq('profile_id', profileId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!profileId,
  })

  const hasAccess = token?.scope_level === 'drive_calendar'

  const connect = async () => {
    // Flag the upcoming sign-in so saveOauthToken() in useAuth.ts records
    // scope_level='drive_calendar' instead of 'basic'. Cleared after read.
    localStorage.setItem('bki:requested-scope', 'drive_calendar')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: [
          'email',
          'profile',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/calendar.events',
        ].join(' '),
        redirectTo: `${window.location.origin}/auth/callback`,
        // offline + consent → ensures Google returns a refresh_token even on
        // subsequent connects. Without these, only the first connect ever
        // includes a refresh_token.
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      localStorage.removeItem('bki:requested-scope')
      throw error
    }
  }

  return { hasAccess, connect }
}
