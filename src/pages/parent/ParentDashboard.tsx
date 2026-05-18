import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, FolderOpen, FileText, ArrowRight,
  TrendingUp, Users, Heart, Download,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProfileHeroCard } from '@/components/shared/ProfileHeroCard'
import { ScoreChart } from '@/components/shared/ScoreChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressRing } from '@/components/ui/progress-ring'
import { useParentStudents } from '@/hooks/useTeam'
import { useStudentTasks } from '@/hooks/useTasks'
import { useStudentSessions } from '@/hooks/useSessions'
import { useStudentClasses } from '@/hooks/useClasses'
import { cn, formatWIB } from '@/lib/utils'
import type { SessionStudentReport } from '@/types/database'

export function ParentDashboard() {
  const navigate = useNavigate()
  const { data: students = [], isLoading: studentsLoading } = useParentStudents()
  const [selectedIdx, setSelectedIdx] = useState(0)

  const child = students[selectedIdx] ?? null
  const childTeam = child?.team_members?.[0]?.teams ?? null
  const teamId = childTeam?.id ?? null

  const { data: tasks = [] } = useStudentTasks(teamId, child?.id ?? null)
  const { data: sessions = [] } = useStudentSessions(teamId)
  const { data: classes = [] } = useStudentClasses(teamId)

  const completedTasks = tasks.filter((t) => t.is_completed).length
  const totalTasks = tasks.length
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const studentReports = sessions.flatMap((s) =>
    (s.session_student_reports ?? []).filter((r) => r.student_id === child?.id),
  )
  const avg = (key: keyof SessionStudentReport): number => {
    const vals = studentReports.map((r) => r[key]).filter((v): v is number => typeof v === 'number')
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
  }
  const avgScores = {
    discipline:    avg('score_discipline'),
    activeness:    avg('score_activeness'),
    communication: avg('score_communication'),
    ethics:        avg('score_ethics'),
    understanding: avg('score_understanding'),
  }
  const overallAvg = Object.values(avgScores).reduce((a, b) => a + b, 0) / 5

  const now = Date.now()
  const upcomingClasses = classes
    .filter((c) => new Date(c.scheduled_at).getTime() > now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const nextClass = upcomingClasses[0]
  const recentSessions = sessions.slice(0, 4)

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={child?.profiles?.full_name ? `Pantau perkembangan ${child.profiles.full_name.split(' ')[0]}` : 'Pantau perkembangan anak'}
    >
      <div className="space-y-6">
        {/* ── Child selector (if multiple) ──────────────── */}
        {students.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary mr-2">Pilih anak:</span>
            {students.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all border',
                  i === selectedIdx
                    ? 'bg-primary-950 text-white border-primary-950 shadow-soft'
                    : 'bg-white text-text-secondary border-surface-200 hover:border-primary-300 hover:text-text-primary',
                )}
              >
                {s.profiles?.photo_url ? (
                  <img src={s.profiles.photo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    i === selectedIdx ? 'bg-white/20 text-white' : 'bg-accent-purple/15 text-accent-purple',
                  )}>
                    {(s.profiles?.full_name ?? '?').slice(0, 1).toUpperCase()}
                  </span>
                )}
                {s.profiles?.full_name?.split(' ')[0] ?? 'Anak'}
              </button>
            ))}
          </div>
        )}

        {studentsLoading ? (
          <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
        ) : !child ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Heart}
                title="Belum ada anak yang dipantau"
                description="Hubungi admin BKI untuk menghubungkan akun ini ke murid."
                size="lg"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Profile hero (read-only for parent) ─── */}
            <ProfileHeroCard
              fullName={child.profiles?.full_name ?? 'Anak'}
              photoUrl={child.profiles?.photo_url}
              teamCode={childTeam?.team_code}
              researchTitle={childTeam?.research_title}
              subtitle={child.grade ? `Kelas ${child.grade}${child.major ? ` · ${child.major}` : ''}` : 'Murid'}
              accent="parent"
            />

            {/* ── Stats + progress ring ─────────────────── */}
            <div className="grid lg:grid-cols-4 gap-4">
              <Card className="lg:col-span-1">
                <CardContent className="flex flex-col items-center py-5">
                  <ProgressRing value={progressPct} size={120} stroke={10} fillClassName="text-accent-purple" />
                  <p className="mt-3 text-xs font-semibold text-text-primary">Progress Bimbingan</p>
                  <p className="text-[11px] text-text-tertiary">{completedTasks}/{totalTasks} tugas</p>
                </CardContent>
              </Card>

              <ScoreSummary
                label="Rata-rata Nilai"
                value={overallAvg ? overallAvg.toFixed(1) : '—'}
                suffix={overallAvg ? '/10' : ''}
                description={studentReports.length === 0 ? 'Belum ada laporan' : `Dari ${studentReports.length} sesi`}
                icon={TrendingUp}
                accent="primary"
              />
              <ScoreSummary
                label="Total Sesi"
                value={sessions.length}
                description="Sesi bimbingan tercatat"
                icon={FileText}
                accent="teal"
              />
              <ScoreSummary
                label="Anggota Tim"
                value={childTeam ? (sessions[0] ? '—' : '—') : 0}
                description={childTeam ? `Tim ${childTeam.team_code}` : 'Belum ada tim'}
                icon={Users}
                accent="amber"
                customValueNode={
                  <p className="text-xl font-extrabold text-text-primary tabular-nums leading-tight">
                    {childTeam ? '6' : 0}
                  </p>
                }
              />
            </div>

            {/* ── Statistik radar + Kelas berikutnya ────── */}
            <div className="grid lg:grid-cols-5 gap-4">
              {/* Radar (3 cols) */}
              <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Statistik Perkembangan</CardTitle>
                    <p className="text-xs text-text-tertiary mt-0.5">Rata-rata 5 dimensi dari laporan sesi</p>
                  </div>
                  {studentReports.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">{studentReports.length} sesi</Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {studentReports.length === 0 ? (
                    <EmptyState
                      icon={TrendingUp}
                      title="Belum ada data nilai"
                      description="Statistik muncul setelah pembimbing mengisi laporan pertama."
                      size="md"
                    />
                  ) : (
                    <>
                      <div className="mb-3">
                        <ScoreChart scores={avgScores} size={300} />
                      </div>
                      <div className="grid grid-cols-5 gap-2 pt-3 border-t border-surface-100">
                        {(Object.entries({
                          discipline: 'Disiplin',
                          activeness: 'Aktif',
                          communication: 'Komunikasi',
                          ethics: 'Etika',
                          understanding: 'Paham',
                        }) as Array<[keyof typeof avgScores, string]>).map(([k, label]) => (
                          <div key={k} className="text-center">
                            <p className="text-base font-extrabold text-text-primary tabular-nums">{avgScores[k] || '—'}</p>
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-text-tertiary leading-tight mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Right column: next class + shortcuts */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="relative overflow-hidden">
                  <CardHeader><CardTitle>Pertemuan Mendatang</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    {!nextClass ? (
                      <EmptyState icon={Calendar} title="Belum ada kelas terjadwal" size="sm" />
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-accent-purple/10 text-accent-purple flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[9px] uppercase font-bold leading-none">{formatWIB(nextClass.scheduled_at, 'MMM')}</span>
                          <span className="text-base font-extrabold leading-tight tabular-nums">{formatWIB(nextClass.scheduled_at, 'd')}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">{nextClass.topic ?? 'Pertemuan'}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{formatWIB(nextClass.scheduled_at, 'EEE · HH:mm')} WIB</p>
                          <Badge variant={nextClass.media === 'online' ? 'success' : 'secondary'} className="text-[10px] mt-1.5">
                            {nextClass.media === 'online' ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <MiniShortcut icon={Calendar}   label="Kalender"     onClick={() => navigate('/parent/calendar')} />
                  <MiniShortcut icon={FolderOpen} label="Drive Anak"   onClick={() => navigate('/parent/reports')} />
                </div>
              </div>
            </div>

            {/* ── Laporan terbaru ────────────────────────── */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Laporan Sesi Terbaru</CardTitle>
                  <p className="text-xs text-text-tertiary mt-0.5">PDF laporan tersedia untuk diunduh.</p>
                </div>
                <button onClick={() => navigate('/parent/reports')} className="text-xs font-semibold text-primary-600 hover:underline">
                  Lihat semua →
                </button>
              </CardHeader>
              <CardContent className="pt-0">
                {recentSessions.length === 0 ? (
                  <EmptyState icon={FileText} title="Belum ada laporan sesi" size="sm" />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {recentSessions.map((s) => (
                      <div key={s.id} className="rounded-2xl border border-surface-200 p-4 hover:border-primary-300 hover:shadow-soft transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-700 flex flex-col items-center justify-center">
                            <span className="text-[8px] uppercase font-bold leading-none">{formatWIB(s.session_date, 'MMM')}</span>
                            <span className="text-xs font-extrabold leading-tight tabular-nums">{formatWIB(s.session_date, 'd')}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono">{s.teams?.team_code ?? '—'}</Badge>
                        </div>
                        <p className="text-sm font-bold text-text-primary line-clamp-2 leading-snug mb-1">
                          {s.topic ?? 'Sesi bimbingan'}
                        </p>
                        <p className="text-[11px] text-text-tertiary mb-3">
                          {formatWIB(s.session_date, 'EEE, d MMM yyyy')}
                        </p>
                        {s.drive_report_url ? (
                          <Button asChild size="sm" variant="outline" className="w-full h-8 text-xs">
                            <a href={s.drive_report_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3 mr-1" /> Unduh PDF
                            </a>
                          </Button>
                        ) : (
                          <p className="text-[10px] text-text-tertiary italic text-center">PDF belum tersedia</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

/* ─────────────────────────────────────────────────────── */

const ACCENT_STAT = {
  primary: { bg: 'bg-primary-50',       fg: 'text-primary-700' },
  teal:    { bg: 'bg-accent-teal/10',   fg: 'text-accent-teal' },
  amber:   { bg: 'bg-accent-amber/10',  fg: 'text-accent-amber' },
  purple:  { bg: 'bg-accent-purple/10', fg: 'text-accent-purple' },
}

interface ScoreSummaryProps {
  label: string
  value: string | number
  suffix?: string
  description: string
  icon: LucideIcon
  accent: keyof typeof ACCENT_STAT
  customValueNode?: React.ReactNode
}
function ScoreSummary({ label, value, suffix, description, icon: Icon, accent, customValueNode }: ScoreSummaryProps) {
  const c = ACCENT_STAT[accent]
  return (
    <div className="rounded-2xl bg-white border border-surface-200 p-5 shadow-soft">
      <div className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg mb-3', c.bg, c.fg)}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      {customValueNode ?? (
        <p className="text-2xl font-extrabold text-text-primary tabular-nums leading-tight">
          {value}{suffix && <span className="text-sm text-text-tertiary font-bold">{suffix}</span>}
        </p>
      )}
      <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary leading-tight mt-1">{label}</p>
      <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">{description}</p>
    </div>
  )
}

interface MiniShortcutProps {
  icon: LucideIcon
  label: string
  onClick: () => void
}
function MiniShortcut({ icon: Icon, label, onClick }: MiniShortcutProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-surface-200 bg-white p-4 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
    >
      <Icon className="h-5 w-5 text-primary-600 group-hover:scale-110 transition-transform" strokeWidth={1.75} />
      <p className="text-xs font-bold text-text-primary">{label}</p>
      <ArrowRight className="h-3 w-3 text-text-tertiary group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
    </button>
  )
}
