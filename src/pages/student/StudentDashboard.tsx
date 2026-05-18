import { useNavigate } from 'react-router-dom'
import {
  Calendar, FolderOpen, ListChecks, ArrowRight, CheckCircle2,
  Users, Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProfileHeroCard } from '@/components/shared/ProfileHeroCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressRing } from '@/components/ui/progress-ring'
import { useStudentTeam, useUpdateTeam } from '@/hooks/useTeam'
import { useStudentTasks, useToggleTask } from '@/hooks/useTasks'
import { useStudentClasses } from '@/hooks/useClasses'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatWIB } from '@/lib/utils'

export function StudentDashboard() {
  const navigate = useNavigate()
  const { profile, roleId: studentId } = useAuthStore()

  const { data: team, isLoading: teamLoading } = useStudentTeam()
  const teamId = team?.id ?? null
  const { data: tasks = [], isLoading: tasksLoading } = useStudentTasks(teamId, studentId ?? null)
  const { data: classes = [] } = useStudentClasses(teamId)
  const toggleTask = useToggleTask()
  const updateTeam = useUpdateTeam()

  const completedTasks = tasks.filter((t) => t.is_completed).length
  const totalTasks = tasks.length
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const now = Date.now()
  const upcomingClasses = classes
    .filter((c) => new Date(c.scheduled_at).getTime() > now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const nextClass = upcomingClasses[0]
  const pendingTasks = tasks.filter((t) => !t.is_completed).slice(0, 5)

  const handleTitleUpdate = async (title: string) => {
    if (!teamId) return
    await updateTeam.mutateAsync({ teamId, updates: { research_title: title || null } })
  }

  return (
    <DashboardLayout title="Dashboard" subtitle={`Halo, ${profile?.full_name?.split(' ')[0] ?? 'Murid'} 👋`}>
      <div className="space-y-6">
        {/* ── Profile hero (editable research title) ───── */}
        <ProfileHeroCard
          fullName={profile?.full_name ?? 'Murid'}
          photoUrl={profile?.photo_url}
          teamCode={team?.team_code}
          researchTitle={team?.research_title}
          subtitle="Murid"
          accent="student"
          onResearchTitleChange={teamId ? handleTitleUpdate : undefined}
        />

        {/* ── Main split: tasks + progress ring ────────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Tasks list (2 cols) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Tugas</CardTitle>
                <p className="text-xs text-text-tertiary mt-0.5">Centang setelah selesai mengerjakan.</p>
              </div>
              <button onClick={() => navigate('/student/tasks')} className="text-xs font-semibold text-primary-600 hover:underline">
                Lihat semua →
              </button>
            </CardHeader>
            <CardContent className="pt-0">
              {tasksLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : pendingTasks.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title={totalTasks === 0 ? 'Belum ada tugas' : 'Semua tugas selesai!'}
                  description={totalTasks === 0 ? 'Pembimbing akan kasih tugas via dashboard.' : 'Kerja bagus 🎉 Lihat kelas berikutnya di bawah.'}
                  size="sm"
                />
              ) : (
                <ul className="divide-y divide-surface-100">
                  {pendingTasks.map((t) => {
                    const overdue = t.deadline && new Date(t.deadline) < new Date()
                    return (
                      <li key={t.id} className="flex items-start gap-3 py-3 group">
                        <input
                          type="checkbox"
                          checked={t.is_completed}
                          onChange={(e) => toggleTask.mutate({ taskId: t.id, isCompleted: e.target.checked })}
                          className="mt-1 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary leading-snug">{t.title}</p>
                          {t.description && (
                            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{t.description}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            {t.deadline && (
                              <span className={cn(
                                'inline-flex items-center gap-1 text-[11px] font-medium',
                                overdue ? 'text-accent-red' : 'text-text-tertiary',
                              )}>
                                <Calendar className="h-3 w-3" />
                                {formatWIB(t.deadline, 'd MMM · HH:mm')}
                              </span>
                            )}
                            {!t.assigned_student_id && t.teams?.team_code && (
                              <Badge variant="outline" className="text-[10px] font-mono">{t.teams.team_code}</Badge>
                            )}
                            {t.assigned_student_id && (
                              <Badge variant="secondary" className="text-[10px]">Untukmu</Badge>
                            )}
                            {overdue && <Badge variant="danger" className="text-[10px]">Telat</Badge>}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Progress ring */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Bimbingan</CardTitle>
              <p className="text-xs text-text-tertiary mt-0.5">Tugas selesai bulan ini</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6">
              {tasksLoading ? (
                <Skeleton className="h-[140px] w-[140px] rounded-full" />
              ) : (
                <ProgressRing
                  value={progressPct}
                  size={150}
                  stroke={14}
                  fillClassName="text-primary-600"
                />
              )}
              <p className="mt-3 text-sm font-semibold text-text-primary">
                {completedTasks} dari {totalTasks} tugas
              </p>
              <p className="text-xs text-text-tertiary text-center mt-1">
                {progressPct >= 80 ? 'Mantap! Tetap konsisten' : progressPct >= 50 ? 'Setengah jalan, terus semangat' : 'Yuk cicil dari yang terdekat'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── 3-col shortcut row ───────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4">
          <ShortcutCard
            icon={Calendar}
            title="Kalender Bimbingan"
            description="Lihat semua jadwal kelas & deadline"
            onClick={() => navigate('/student/calendar')}
          />
          <ShortcutCard
            icon={FolderOpen}
            title="Drive Tim"
            description="Akses folder dokumen tim di Google Drive"
            onClick={() => navigate('/student/calendar')}
          />
          <ShortcutCard
            icon={ListChecks}
            title="Daftar Tugas"
            description="Semua tugas tim & individu"
            onClick={() => navigate('/student/tasks')}
          />
        </div>

        {/* ── Bottom: next class + team mates ──────────── */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Next class */}
          <Card className="relative overflow-hidden">
            {nextClass && (
              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary-50 blur-3xl" />
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pertemuan Mendatang</CardTitle>
                {upcomingClasses.length > 1 && (
                  <button onClick={() => navigate('/student/classes')} className="text-xs font-semibold text-primary-600 hover:underline">
                    +{upcomingClasses.length - 1} lagi
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative pt-0">
              {teamLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : !nextClass ? (
                <EmptyState icon={Calendar} title="Belum ada kelas terjadwal" size="sm" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary-600 text-white flex flex-col items-center justify-center shadow-lift flex-shrink-0">
                      <span className="text-[10px] uppercase font-bold leading-none tracking-wider">{formatWIB(nextClass.scheduled_at, 'MMM')}</span>
                      <span className="text-xl font-extrabold leading-tight tabular-nums">{formatWIB(nextClass.scheduled_at, 'd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-primary text-base leading-tight">{nextClass.topic ?? 'Pertemuan'}</p>
                      <p className="text-sm text-text-secondary mt-1">
                        {formatWIB(nextClass.scheduled_at, 'EEEE, d MMM')} · {formatWIB(nextClass.scheduled_at, 'HH:mm')} WIB
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={nextClass.media === 'online' ? 'success' : 'secondary'} className="text-[10px]">
                          {nextClass.media === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                        {nextClass.location && (
                          <span className="text-xs text-text-tertiary truncate">{nextClass.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {nextClass.media === 'online' && nextClass.gmeet_link && (
                    <Button asChild className="w-full">
                      <a href={nextClass.gmeet_link} target="_blank" rel="noopener noreferrer">
                        Masuk ke Kelas
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </Button>
                  )}
                  {nextClass.media === 'offline' && nextClass.maps_url && (
                    <Button asChild variant="outline" className="w-full">
                      <a href={nextClass.maps_url} target="_blank" rel="noopener noreferrer">
                        Lihat Lokasi di Maps
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team mates */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Anggota Tim</CardTitle>
              {team?.team_code && <Badge variant="outline" className="font-mono text-[10px]">{team.team_code}</Badge>}
            </CardHeader>
            <CardContent className="pt-0">
              {teamLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !team || team.team_members.length === 0 ? (
                <EmptyState icon={Users} title="Belum ada anggota tim" size="sm" />
              ) : (
                <ul className="space-y-2">
                  {team.team_members.map((tm) => {
                    const isMe = tm.student_id === studentId
                    const s = tm.students
                    return (
                      <li key={tm.student_id} className="flex items-center gap-3 rounded-xl border border-surface-100 p-2.5">
                        {s?.profiles?.photo_url ? (
                          <img src={s.profiles.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-accent-teal/15 text-accent-teal flex items-center justify-center text-sm font-bold">
                            {(s?.profiles?.full_name ?? '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{s?.profiles?.full_name ?? 'Anggota'}</p>
                          <p className="text-[11px] text-text-tertiary">{s?.grade ? `Kelas ${s.grade}` : 'Murid'}{s?.major ? ` · ${s.major}` : ''}</p>
                        </div>
                        {isMe && <Badge variant="secondary" className="text-[10px]">Kamu</Badge>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Tip footer ───────────────────────────────── */}
        <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Tip:</span> WhatsApp reminder otomatis dikirim H-2 sebelum deadline tugas dan H-1 sebelum kelas. Cek juga{' '}
            <button onClick={() => navigate('/student/calendar')} className="text-primary-600 font-semibold hover:underline">kalender bimbingan</button> untuk overview lengkap.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

interface ShortcutCardProps {
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
}
function ShortcutCard({ icon: Icon, title, description, onClick }: ShortcutCardProps) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl bg-white border border-surface-200 p-5 hover:border-primary-300 hover:shadow-lift transition-all"
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 mb-3">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="font-bold text-text-primary mb-0.5">{title}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
      <div className="mt-3 inline-flex items-center text-xs font-semibold text-primary-600">
        Buka
        <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  )
}

