import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  ref_type: string | null
  ref_id: string | null
  read_at: string | null
  created_at: string
}

export function useNotifications(opts: { unreadOnly?: boolean; limit?: number } = {}) {
  const profileId = useAuthStore((s) => s.profile?.id)
  return useQuery<AppNotification[]>({
    queryKey: ['notifications', profileId, opts.unreadOnly, opts.limit],
    queryFn: async () => {
      if (!profileId) return []
      let q = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(opts.limit ?? 50)
      if (opts.unreadOnly) q = q.is('read_at', null)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as AppNotification[]
    },
    enabled: !!profileId,
    refetchInterval: 60_000,
  })
}

export function useUnreadCount() {
  const profileId = useAuthStore((s) => s.profile?.id)
  const qc = useQueryClient()

  // Realtime subscription: invalidate the count whenever a notification for
  // this user is inserted/updated. Fallback polling still runs at 60s for
  // robustness when the websocket drops.
  useEffect(() => {
    if (!profileId) return
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_profile_id=eq.${profileId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['unread_count', profileId] })
          qc.invalidateQueries({ queryKey: ['notifications', profileId] })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profileId, qc])

  return useQuery<number>({
    queryKey: ['unread_count', profileId],
    queryFn: async () => {
      if (!profileId) return 0
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_profile_id', profileId)
        .is('read_at', null)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!profileId,
    refetchInterval: 60_000,
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .is('read_at', null)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread_count'] })
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  const profileId = useAuthStore((s) => s.profile?.id)
  return useMutation({
    mutationFn: async () => {
      if (!profileId) return
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_profile_id', profileId)
        .is('read_at', null)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread_count'] })
    },
  })
}
