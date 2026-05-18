import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, CalendarPlus, FolderOpen, Users, ClipboardList,
  FilePlus2, ArrowRight, GraduationCap, CheckSquare, BookOpen,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GoogleConnectBanner } from '@/components/shared/GoogleConnectBanner'
import { ProfileHeroCard } from '@/components/shared/ProfileHeroCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatWIB } from '@/lib/utils'
import { useCoachTeams } from '@/hooks/useTeam'
import { useCoachTasks } from '@/hooks/useTasks'
import { useCoachClasses } from '@/hooks/useClasses'
import { useCoachSessions } from '@/hooks/useSessions'
import { useAuthStore } from '@/stores/authStore'
import { useToggleTask } from '@/hooks/useTasks'
import { useCoachProfile } from '@/hooks/useProfile'

interface WorkItem {
  id: string
  kind: 'task' | 'class'
  title: string
  when: string                // ISO
  teamCode?: string | null
  isCompleted?: boolean
  href?: string
}

export function CoachDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { data: coach } = useCoachProfile()
  const { data: teams = [], isLoading: teamsLoading } = useCoachTeams()
  const { data: tasks = [], isLoading: tasksLoading } = useCoachTasks()
  const { data: classes = [], isLoading: classesLoading } = useCoachClasses()
  const { data: sessions = [] } = useCoachSessions()
  const toggleTask = useToggleTask()

  const totalStudents = teams.reduce((sum, t) => sum + (t.team_members?.length ?? 0), 0)
  const pendingTasks = tasks.filter((t) => !t.is_completed)
  const now = Date.now()
  const upcomingClasses = classes
    .filter((c) => new Date(c.scheduled_at).getTime() > now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  // Daftar Kerjaan — union of tasks + classes for today/upcoming.
  const workItems: WorkItem[] = useMemo(() => {
    const taskItems: WorkItem[] = tasks
      .filter((t) => t.deadline)
      .map((t) => ({
        id: `task-${t.id}`,
        kind: 'task',
        title: t.title,
        when: t.deadline as string,
        teamCode: t.teams?.team_code ?? null,
        isCompleted: t.is_completed,
      }))
    const classItems: WorkItem[] = upcomingClasses.slice(0, 12).map((c) => ({
      id: `class-${c.id}`,
      kind: 'class',
      title: c.topic ?? 'Pertemuan',
      when: c.scheduled_at,
      teamCode: c.class_teams?.[0]?.teams?.team_code ?? null,
      href: '/coach/classes',
    }))
    return [...taskItems, ...classItems]
      .sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())
      .slice(0, 8)
  }, [tasks, upcomingClasses])

  const loading = teamsLoading || tasksLoading || classesLoading

  return (
    <DashboardLayout title="Dashboard" subtitle={`Halo, ${profile?.full_name?.split(' ')[0] ?? 'Pembimbing'} 👋`}>
      <GoogleConnectBanner />

      <div className="space-y-6">
        {/* ── Profile hero ─────────────────────────────── */}
        <ProfileHeroCard
          fullName={profile?.full_name ?? 'Pembimbing'}
          photoUrl={profile?.photo_url}
          subtitle={coach?.division ? `Divisi ${coach.division}` : 'Pembimbing'}
          accent="coach"
        />

        {/* ── Stats strip ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStat label="Murid Bimbingan" value={loading ? null : totalStudents} icon={Users}        accent="primary" />
          <MiniStat label="Tim Aktif"       value={loading ? null : teams.length}    icon={BookOpen}     accent="teal" />
          <MiniStat label="Tugas Aktif"     value={loading ? null : pendingTasks.length} icon={CheckSquare} accent="amber" />
          <MiniStat label="Total Sesi"      value={loading ? null : sessions.length}  icon={GraduationCap} accent="purple" />
        </div>

        {/* ── Daftar Kerjaan ────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Daftar Kerjaan</CardTitle>
              <p className="text-sm text-text-tertiary mt-0.5">Tugas & kelas yang menunggu — terhubung kalender & jadwal.</p>
            </div>
            <button onClick={() => navigate('/coach/calendar')} className="text-xs text-primary-600 hover:underline font-semibold">
              Lihat kalender →
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : workItems.length === 0 ? (
              <EmptyState icon={CheckSquare} title="Tidak ada kerjaan" description="Semua tugas selesai dan tidak ada kelas dijadwalkan." size="sm" />
            ) : (
              <ul className="divide-y divide-surface-100">
                {workItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 group">
                    {item.kind === 'task' ? (
                      <input
                        type="checkbox"
                        checked={item.isCompleted ?? false}
                        onChange={(e) => toggleTask.mutate({ taskId: item.id.replace('task-', ''), isCompleted: e.target.checked })}
                        className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-2.5 w-2.5 text-primary-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium leading-tight truncate',
                        item.isCompleted ? 'line-through text-text-tertiary' : 'text-text-primary',
                      )}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {item.kind === 'task' ? 'Deadline' : 'Kelas'} · {formatWIB(item.when, 'EEE, d MMM · HH:mm')} WIB
                      </p>
                    </div>
                    {item.teamCode && (
                      <Badge variant="outline" className="font-mono text-[10px] flex-shrink-0">{item.teamCode}</Badge>
                    )}
                    {item.href && (
                      <button onClick={() => navigate(item.href!)} className="text-text-tertiary hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── 3-col shortcut action row ─────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4">
          <ShortcutCard
            icon={Calendar}
            title="Kalender Bimbingan"
            description="Semua jadwal kelas & deadline tugas"
            accent="primary"
            onClick={() => navigate('/coach/calendar')}
          />
          <ShortcutCard
            icon={CalendarPlus}
            title="Adakan Kelas"
            description="Jadwalkan pertemuan baru"
            accent="teal"
            onClick={() => navigate('/coach/classes')}
          />
          <ShortcutCard
            icon={FolderOpen}
            title="Lihat Drive"
            description="Buka folder tim di Google Drive"
            accent="amber"
            onClick={() => navigate('/coach/calendar')}
          />
        </div>

        {/* ── Big action: Buat Laporan + Berikan Tugas ──── */}
        <div className="grid md:grid-cols-2 gap-4">
          <BigAction
            icon={FilePlus2}
            title="Buat Laporan Pertemuan"
            subtitle="Isi laporan setelah sesi — auto-kirim ke wali via WA + Drive"
            cta="Mulai Laporan"
            onClick={() => navigate('/coach/report')}
            accent="from-primary-700 to-primary-500"
          />
          <BigAction
            icon={ClipboardList}
            title="Berikan Tugas"
            subtitle="Assign tugas ke tim atau murid tertentu"
            cta="Buat Tugas"
            onClick={() => navigate('/coach/tasks?new=1')}
            accent="from-accent-purple to-primary-700"
          />
        </div>

        {/* ── Bottom row: kelas + tugas previews ────────── */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Kelas</CardTitle>
              <button onClick={() => navigate('/coach/classes')} className="text-xs font-semibold text-primary-600 hover:underline">Lihat semua →</button>
            </CardHeader>
            <CardContent className="pt-0">
              {classesLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : upcomingClasses.length === 0 ? (
                <EmptyState icon={Calendar} title="Belum ada kelas" description="Jadwalkan kelas baru lewat tombol di atas." size="sm" />
              ) : (
                <ul className="space-y-2">
                  {upcomingClasses.slice(0, 4).map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl border border-surface-100 p-3 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-700 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] uppercase font-bold leading-none">{formatWIB(c.scheduled_at, 'MMM')}</span>
                        <span className="text-sm font-extrabold leading-tight tabular-nums">{formatWIB(c.scheduled_at, 'd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{c.topic ?? 'Pertemuan'}</p>
                        <p className="text-[11px] text-text-tertiary">{formatWIB(c.scheduled_at, 'EEE · HH:mm')} · {c.media === 'online' ? 'Online' : 'Offline'}</p>
                      </div>
                      <Badge variant={c.media === 'online' ? 'success' : 'secondary'} className="text-[10px] flex-shrink-0">
                        {c.media}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daftar Tugas</CardTitle>
              <button onClick={() => navigate('/coach/tasks')} className="text-xs font-semibold text-primary-600 hover:underline">Lihat semua →</button>
            </CardHeader>
            <CardContent className="pt-0">
              {tasksLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : pendingTasks.length === 0 ? (
                <EmptyState icon={CheckSquare} title="Tidak ada tugas aktif" description="Berikan tugas baru lewat tombol di atas." size="sm" />
              ) : (
                <ul className="space-y-2">
                  {pendingTasks.slice(0, 4).map((t) => {
                    const overdue = t.deadline && new Date(t.deadline) < new Date()
                    return (
                      <li key={t.id} className="flex items-center gap-3 rounded-xl border border-surface-100 p-3 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                        <div className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          overdue ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-amber/10 text-accent-amber',
                        )}>
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{t.title}</p>
                          <p className="text-[11px] text-text-tertiary">
                            {t.deadline ? formatWIB(t.deadline, 'EEE, d MMM') : 'Tanpa deadline'}
                            {t.teams?.team_code && ` · ${t.teams.team_code}`}
                          </p>
                        </div>
                        {overdue && <Badge variant="danger" className="text-[10px]">Telat</Badge>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

/* ─────────────────────────────────────────────────────── */
/* Sub-components                                          */
/* ─────────────────────────────────────────────────────── */

const ACCENT_STAT = {
  primary: { bg: 'bg-primary-50',       fg: 'text-primary-700' },
  teal:    { bg: 'bg-accent-teal/10',   fg: 'text-accent-teal' },
  amber:   { bg: 'bg-accent-amber/10',  fg: 'text-accent-amber' },
  purple:  { bg: 'bg-accent-purple/10', fg: 'text-accent-purple' },
}

interface MiniStatProps {
  label: string
  value: number | null
  icon: React.ComponentType<{ className?: string }>
  accent: keyof typeof ACCENT_STAT
}
function MiniStat({ label, value, icon: Icon, accent }: MiniStatProps) {
  const c = ACCENT_STAT[accent]
  return (
    <div className="rounded-2xl bg-white border border-surface-200 p-4 shadow-soft hover:shadow-lift transition-shadow">
      <div className="flex items-center gap-3">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', c.bg, c.fg)}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          {value === null ? (
            <Skeleton className="h-6 w-10 mb-1" />
          ) : (
            <p className="text-xl font-extrabold tabular-nums text-text-primary leading-tight">{value}</p>
          )}
          <p className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary leading-tight">{label}</p>
        </div>
      </div>
    </div>
  )
}

const ACCENT_SHORTCUT = {
  primary: { bg: 'bg-primary-50',        ring: 'group-hover:ring-primary-200',     fg: 'text-primary-700' },
  teal:    { bg: 'bg-accent-teal/10',    ring: 'group-hover:ring-accent-teal/30',  fg: 'text-accent-teal' },
  amber:   { bg: 'bg-accent-amber/10',   ring: 'group-hover:ring-accent-amber/30', fg: 'text-accent-amber' },
}
interface ShortcutCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  onClick: () => void
  accent: keyof typeof ACCENT_SHORTCUT
}
function ShortcutCard({ icon: Icon, title, description, onClick, accent }: ShortcutCardProps) {
  const c = ACCENT_SHORTCUT[accent]
  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-left rounded-2xl bg-white border border-surface-200 p-5 hover:border-primary-300 hover:shadow-lift transition-all ring-1 ring-transparent',
        c.ring,
      )}
    >
      <div className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl mb-3', c.bg, c.fg)}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="font-bold text-text-primary mb-0.5">{title}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
      <div className="mt-3 inline-flex items-center text-xs font-semibold text-primary-600 group-hover:gap-2 transition-all">
        Buka
        <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  )
}

interface BigActionProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  cta: string
  onClick: () => void
  accent: string  // tailwind gradient classes
}
function BigAction({ icon: Icon, title, subtitle, cta, onClick, accent }: BigActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden text-left rounded-2xl bg-gradient-to-br text-white p-6 shadow-lift hover:shadow-float transition-all hover:-translate-y-0.5',
        accent,
      )}
    >
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/[0.10] blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg leading-tight">{title}</p>
          <p className="text-sm text-white/80 mt-1 leading-relaxed max-w-sm">{subtitle}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white text-primary-950 px-3 py-1.5 text-xs font-bold shadow-soft group-hover:bg-white/90">
            {cta}
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </button>
  )
}
