import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, ClipboardList, CalendarPlus, FileBarChart2,
  Inbox, Sparkles, ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  useNotifications, useMarkAsRead, useMarkAllAsRead,
  type AppNotification,
} from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'unread'

const TYPE_META: Record<string, { icon: LucideIcon; tint: string }> = {
  task_new:         { icon: ClipboardList,   tint: 'bg-accent-amber/15 text-accent-amber' },
  class_scheduled:  { icon: CalendarPlus,    tint: 'bg-primary-100 text-primary-700' },
  session_report:   { icon: FileBarChart2,   tint: 'bg-accent-teal/15 text-accent-teal' },
  default:          { icon: Sparkles,        tint: 'bg-surface-100 text-text-secondary' },
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: notifications = [], isLoading } = useNotifications({
    unreadOnly: filter === 'unread',
  })
  const markAsRead    = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const handleClick = (n: AppNotification) => {
    if (!n.read_at) markAsRead.mutate(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <DashboardLayout
      title="Notifikasi"
      subtitle={unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
      actions={
        unreadCount > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tandai semua dibaca</span>
            <span className="sm:hidden">Semua</span>
          </Button>
        ) : null
      }
    >
      <div className="max-w-2xl mx-auto">
        {/* Filter tabs — full-width on mobile */}
        <div className="inline-flex w-full sm:w-auto items-center gap-1 rounded-xl border border-surface-200 bg-white p-1 shadow-soft mb-5">
          {(['all', 'unread'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 sm:flex-none px-4 h-9 rounded-lg text-xs font-bold transition-all',
                filter === f
                  ? 'bg-primary-950 text-white shadow-soft'
                  : 'text-text-secondary hover:bg-surface-50 hover:text-text-primary',
              )}
            >
              {f === 'all' ? 'Semua' : 'Belum dibaca'}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 text-[10px] tabular-nums">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <ul className="divide-y divide-surface-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-start gap-3 p-4">
                    <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={filter === 'unread' ? CheckCheck : Inbox}
                title={filter === 'unread' ? 'Semua udah dibaca' : 'Belum ada notifikasi'}
                description={filter === 'unread' ? 'Notifikasi baru akan muncul di sini.' : 'Notifikasi terkait tugas, kelas, dan laporan bakal masuk ke sini.'}
                size="lg"
              />
            ) : (
              <ul className="divide-y divide-surface-100">
                {notifications.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.default
                  const Icon = meta.icon
                  const unread = !n.read_at
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => handleClick(n)}
                        className={cn(
                          'w-full flex items-start gap-3 p-4 text-left transition-colors',
                          'hover:bg-surface-50 active:bg-surface-100',
                          unread && 'bg-primary-50/30',
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          'relative h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          meta.tint,
                        )}>
                          <Icon className="h-4 w-4" />
                          {unread && (
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent-red ring-2 ring-white" />
                          )}
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm leading-snug',
                            unread ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary',
                          )}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                          <p className="text-[10px] text-text-tertiary mt-1.5 uppercase tracking-wider font-mono">
                            {relativeTime(n.created_at)}
                          </p>
                        </div>

                        {n.link && (
                          <ChevronRight className="h-4 w-4 text-text-tertiary flex-shrink-0 mt-1" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {notifications.length > 0 && notifications.length >= 50 && (
          <p className="text-center text-xs text-text-tertiary italic mt-4">
            Menampilkan 50 terbaru. Notifikasi lama bisa di-arsip nanti.
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} mnt lalu`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} jam lalu`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} hari lalu`
  const week = Math.floor(day / 7)
  if (week < 4) return `${week} mgg lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

void Bell // kept for future inline use
