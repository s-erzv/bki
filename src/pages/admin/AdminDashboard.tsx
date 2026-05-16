import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, FileText, Bell } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { WaStatus } from '@/types/database'

const STATUS_VARIANT: Record<WaStatus, 'success' | 'danger' | 'warning'> = {
  sent: 'success',
  failed: 'danger',
  pending: 'warning',
}

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const [coaches, students, teams, sessions, waNotifs] = await Promise.all([
        supabase.from('coaches').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('teams').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('sessions').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('wa_notifications').select('*').order('created_at', { ascending: false }).limit(20),
      ])
      return {
        coachCount: coaches.count ?? 0,
        studentCount: students.count ?? 0,
        teamCount: teams.count ?? 0,
        sessionCount: sessions.count ?? 0,
        waNotifs: waNotifs.data ?? [],
      }
    },
  })

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, display_name, created_at')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data ?? []
    },
  })

  const STAT_CARDS = [
    { label: 'Pembimbing', value: stats?.coachCount ?? 0, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Murid Aktif', value: stats?.studentCount ?? 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Tim', value: stats?.teamCount ?? 0, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Sesi', value: stats?.sessionCount ?? 0, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const ROLE_LABELS: Record<string, string> = {
    coach: 'Pembimbing', student: 'Murid', parent: 'Orang Tua', admin: 'Admin'
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12 mb-1" /> : <p className="text-2xl font-bold">{s.value}</p>}
                  <p className="text-xs text-text-secondary">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* User table */}
          <Card>
            <CardHeader><CardTitle>Pengguna Terbaru</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary">Nama</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary">Bergabung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-50">
                        <td className="px-5 py-3 font-medium text-text-primary">{p.display_name ?? '—'}</td>
                        <td className="px-5 py-3">
                          <Badge variant="secondary">{ROLE_LABELS[p.role] ?? p.role}</Badge>
                        </td>
                        <td className="px-5 py-3 text-text-tertiary">{formatDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* WA notification log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Log Notifikasi WA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (stats?.waNotifs ?? []).length === 0 ? (
                <p className="text-sm text-text-tertiary">Belum ada notifikasi</p>
              ) : (
                (stats?.waNotifs ?? []).map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface-50">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-text-secondary">{n.recipient_hp}</p>
                      <p className="text-xs text-text-tertiary truncate">{n.message.slice(0, 60)}...</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[n.status]}>{n.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
