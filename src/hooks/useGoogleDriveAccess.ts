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
        .limit(1)
      
      if (error || !data || data.length === 0) return null
      return data[0]
    },
    enabled: !!profileId,
  })

  const hasAccess = token?.scope_level === 'drive_calendar'

  const connect = async () => {
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
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) throw error
  }

  return { hasAccess, connect }
}
