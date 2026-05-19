import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useGoogleDriveAccess } from './useGoogleDriveAccess'

export interface GoogleCalendarEvent {
  id:          string
  summary:     string
  description: string | null
  location:    string | null
  start:       string  // ISO date (all-day) or dateTime
  end:         string | null
  hangoutLink: string | null
  htmlLink:    string | null
  isAllDay:    boolean
}

/**
 * Fetch the current coach's Google Calendar events for a date range.
 * Returns [] when coach hasn't connected Drive/Calendar yet (no banner shown).
 *
 * Defaults: -30 days to +90 days if range not passed.
 */
export function useGoogleCalendarEvents(opts: { timeMin?: string; timeMax?: string } = {}) {
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))
  const { hasAccess } = useGoogleDriveAccess()

  const { timeMin, timeMax } = opts

  return useQuery<GoogleCalendarEvent[]>({
    queryKey: ['gcal_events', coachId, timeMin, timeMax],
    queryFn: async () => {
      if (!coachId) return []
      const { data, error } = await supabase.functions.invoke('list-calendar-events', {
        body: { coachId, timeMin, timeMax },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return (data?.events ?? []) as GoogleCalendarEvent[]
    },
    enabled: !!coachId && hasAccess,
    staleTime: 60_000,  // 1 min — calendar rarely changes within a minute
  })
}
