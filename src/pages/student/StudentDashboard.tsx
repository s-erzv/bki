import { useNavigate } from 'react-router-dom'
import { Calendar, ExternalLink } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { TaskCard } from '@/components/shared/TaskCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentTeam } from '@/hooks/useTeam'
import { useStudentTasks } from '@/hooks/useTasks'
import { useStudentClasses } from '@/hooks/useClasses'
import { useAuthStore } from '@/stores/authStore'
import { useStudentProfile } from '@/hooks/useProfile'
import { formatDate } from '@/lib/utils'

export function StudentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: studentProfile } = useStudentProfile()
  const { data: team } = useStudentTeam()
  const { data: tasks = [], isLoading: tasksLoading } = useStudentTasks(
    (team as { id?: string } | null)?.id,
    user?.id
  )
  const { data: classes = [] } = useStudentClasses((team as { id?: string } | null)?.id)

  const completedTasks = tasks.filter((t) => t.is_completed).length
  const totalTasks = tasks.length
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const now = new Date()
  const nextClass = classes
    .filter((c) => new Date(`${c.date}T${c.time}`) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  const pendingTasks = tasks.filter((t) => !t.is_completed).slice(0, 5)

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Profile card */}
        <Card>
          <CardContent className="p-6 flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              {studentProfile?.foto_url ? (
                <img src={studentProfile.foto_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">
                  {studentProfile?.nama?.charAt(0)?.toUpperCase() ?? 'M'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-text-primary">{studentProfile?.nama ?? 'Murid'}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {(team as { team_code?: string } | null)?.team_code && (
                  <span className="text-sm text-text-secondary font-mono bg-surface-100 px-2 py-0.5 rounded">
                    {(team as { team_code?: string }).team_code}
                  </span>
                )}
                {(team as { judul_penelitian?: string | null } | null)?.judul_penelitian && (
                  <span className="text-sm text-text-secondary italic truncate">
                    {(team as { judul_penelitian?: string | null }).judul_penelitian}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <ProgressBar value={progressPct} label={`Tugas selesai: ${completedTasks}/${totalTasks}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Next class */}
          <Card>
            <CardHeader><CardTitle>Kelas Berikutnya</CardTitle></CardHeader>
            <CardContent>
              {!nextClass ? (
                <p className="text-sm text-text-tertiary">Belum ada jadwal kelas</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-text-primary">{nextClass.topic ?? 'Pertemuan'}</p>
                  <p className="text-sm text-text-secondary">{formatDate(nextClass.date)} • {nextClass.time.slice(0, 5)} WIB</p>
                  {nextClass.media === 'online' && nextClass.gmeet_link && (
                    <Button size="sm" asChild className="mt-2">
                      <a href={nextClass.gmeet_link} target="_blank" rel="noopener noreferrer">
                        Masuk Kelas
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardHeader><CardTitle>Tautan Cepat</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/student/calendar')}>
                <Calendar className="h-4 w-4" />Kalender Jadwal
              </Button>
              {/* Drive link would come from drive_links table */}
              <Button variant="outline" className="w-full justify-start" disabled>
                <ExternalLink className="h-4 w-4" />Google Drive Tim
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pending tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Tugas Belum Selesai</h3>
            <button onClick={() => navigate('/student/tasks')} className="text-sm text-primary-600 hover:underline">Lihat semua</button>
          </div>
          {tasksLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : pendingTasks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-text-tertiary text-sm">Semua tugas sudah selesai! 🎉</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => <TaskCard key={task.id} task={task} canComplete />)}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
