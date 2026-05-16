import { Users, BookOpen, CheckSquare, FileText, Plus, CalendarPlus, PenLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GoogleConnectBanner } from '@/components/shared/GoogleConnectBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskCard } from '@/components/shared/TaskCard'
import { useCoachTeams } from '@/hooks/useTeam'
import { useCoachTasks } from '@/hooks/useTasks'
import { useCoachClasses } from '@/hooks/useClasses'
import { useCoachSessions } from '@/hooks/useSessions'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'

export function CoachDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const { data: teams = [], isLoading: teamsLoading } = useCoachTeams()
  const { data: tasks = [], isLoading: tasksLoading } = useCoachTasks()
  const { data: classes = [], isLoading: classesLoading } = useCoachClasses()
  const { data: sessions = [] } = useCoachSessions()

  const totalStudents = teams.reduce((sum, t) => sum + (t.team_members?.length ?? 0), 0)
  const pendingTasks = tasks.filter((t) => !t.is_completed && !t.deleted_at)
  const upcomingClasses = classes
    .filter((c) => new Date(`${c.date}T${c.time}`) > new Date())
    .slice(0, 3)
  const recentTasks = pendingTasks.slice(0, 5)

  const loading = teamsLoading || tasksLoading || classesLoading

  return (
    <DashboardLayout title="Dashboard">
      <GoogleConnectBanner />

      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Selamat datang, {profile?.display_name?.split(' ')[0] ?? 'Pembimbing'} 👋
          </h2>
          <p className="text-text-secondary text-sm mt-1">Berikut ringkasan aktivitas kamu hari ini.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Murid', value: totalStudents, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: 'Kelas Mendatang', value: upcomingClasses.length, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Tugas Aktif', value: pendingTasks.length, icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Total Sesi', value: sessions.length, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                  )}
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming classes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Kelas Mendatang</h3>
              <button onClick={() => navigate('/coach/classes')} className="text-sm text-primary-600 hover:underline">Lihat semua</button>
            </div>
            {classesLoading ? (
              <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : upcomingClasses.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-text-tertiary text-sm">Belum ada kelas mendatang</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((cls) => (
                  <Card key={cls.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{cls.topic ?? 'Pertemuan'}</p>
                        <p className="text-sm text-text-secondary">{formatDate(cls.date)} • {cls.time.slice(0, 5)} WIB</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/coach/report?classId=${cls.id}`)}>
                        <PenLine className="h-4 w-4" />
                        Isi Laporan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-text-primary">Aksi Cepat</h3>
            <div className="space-y-2">
              <Button className="w-full justify-start gap-3" onClick={() => navigate('/coach/classes')}>
                <CalendarPlus className="h-4 w-4" />Buat Kelas
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/coach/tasks')}>
                <Plus className="h-4 w-4" />Beri Tugas
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" onClick={() => navigate('/coach/report')}>
                <PenLine className="h-4 w-4" />Isi Laporan
              </Button>
            </div>

            {/* Teams summary */}
            <Card>
              <CardHeader><CardTitle>Tim Saya</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {teamsLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : teams.length === 0 ? (
                  <p className="text-sm text-text-tertiary">Belum ada tim</p>
                ) : (
                  teams.slice(0, 4).map((team) => (
                    <div key={team.id} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{team.team_code}</p>
                        <p className="text-xs text-text-tertiary">{team.team_members?.length ?? 0} murid</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Tugas Aktif</h3>
            <button onClick={() => navigate('/coach/tasks')} className="text-sm text-primary-600 hover:underline">Lihat semua</button>
          </div>
          {tasksLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : recentTasks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-text-tertiary text-sm">Tidak ada tugas aktif</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
