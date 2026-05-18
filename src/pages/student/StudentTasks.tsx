import { useMemo, useState } from 'react'
import { Calendar as CalIcon, CheckSquare, ExternalLink, FileText, User, Users as UsersIcon, Sparkles } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useStudentTeam } from '@/hooks/useTeam'
import { useStudentTasks, useToggleTask } from '@/hooks/useTasks'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatWIB } from '@/lib/utils'

type Filter = 'all' | 'active' | 'done'

export function StudentTasks() {
  const studentId = useAuthStore((s) => (s.profile?.role === 'student' ? s.roleId : null))
  const { data: team } = useStudentTeam()
  const { data: tasks = [], isLoading } = useStudentTasks(team?.id ?? null, studentId)
  const toggleTask = useToggleTask()
  const [filter, setFilter] = useState<Filter>('active')

  const counts = {
    all:    tasks.length,
    active: tasks.filter((t) => !t.is_completed).length,
    done:   tasks.filter((t) => t.is_completed).length,
  }
  const progressPct = counts.all > 0 ? Math.round((counts.done / counts.all) * 100) : 0

  const filtered = useMemo(() => {
    const list = filter === 'active'
      ? tasks.filter((t) => !t.is_completed)
      : filter === 'done'
        ? tasks.filter((t) => t.is_completed)
        : tasks
    return [...list].sort((a, b) => {
      // Active: by deadline ascending, no-deadline last. Done: by completed_at desc.
      if (filter === 'done') {
        return new Date(b.completed_at ?? b.created_at).getTime() - new Date(a.completed_at ?? a.created_at).getTime()
      }
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return ad - bd
    })
  }, [tasks, filter])

  return (
    <DashboardLayout
      title="Daftar Tugas"
      subtitle={team?.team_code ? `Tugas tim ${team.team_code}` : 'Semua tugasmu'}
    >
      <div className="space-y-5">
        {/* Progress card */}
        <Card className="overflow-hidden">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-2">
                <p className="text-3xl font-extrabold text-text-primary tabular-nums">{counts.done}</p>
                <p className="text-sm text-text-secondary">dari {counts.all} tugas selesai</p>
              </div>
              <ProgressBar value={progressPct} size="md" />
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">Progress</p>
              <p className="text-3xl font-extrabold tabular-nums text-primary-600">{progressPct}<span className="text-lg text-text-tertiary">%</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Filter tabs */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-surface-200 bg-white p-1 shadow-soft">
          {(['active', 'done', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 h-8 rounded-lg text-xs font-bold transition-all',
                filter === f
                  ? 'bg-primary-950 text-white shadow-soft'
                  : 'text-text-secondary hover:bg-surface-50 hover:text-text-primary',
              )}
            >
              {f === 'active' ? 'Belum Selesai' : f === 'done' ? 'Selesai' : 'Semua'}
              <span className="ml-1.5 text-[10px] opacity-70 tabular-nums">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title={filter === 'done' ? 'Belum ada yang diselesaikan' : counts.all === 0 ? 'Belum ada tugas' : 'Semua tugas selesai!'}
                description={counts.all === 0 ? 'Pembimbing akan kasih tugas via dashboard.' : filter === 'active' ? 'Mantap! Cek tab "Selesai" untuk lihat history.' : undefined}
                size="lg"
              />
            ) : (
              <ul className="divide-y divide-surface-100">
                {filtered.map((t) => {
                  const overdue = t.deadline && new Date(t.deadline) < new Date() && !t.is_completed
                  const forIndividual = !!t.assigned_student_id
                  return (
                    <li key={t.id} className="group flex items-start gap-3 p-4 hover:bg-primary-50/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={t.is_completed}
                        onChange={(e) => toggleTask.mutate({ taskId: t.id, isCompleted: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className={cn(
                            'font-semibold text-text-primary leading-snug',
                            t.is_completed && 'line-through text-text-tertiary',
                          )}>
                            {t.title}
                          </p>
                          {t.is_completed ? (
                            <Badge variant="success" className="text-[10px]">Selesai</Badge>
                          ) : overdue ? (
                            <Badge variant="danger" className="text-[10px]">Telat</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">{t.description}</p>
                        )}
                        <div className="mt-2.5 flex flex-wrap items-center gap-3">
                          {t.deadline && (
                            <span className={cn(
                              'inline-flex items-center gap-1 text-[11px] font-semibold',
                              overdue ? 'text-accent-red' : 'text-text-tertiary',
                            )}>
                              <CalIcon className="h-3 w-3" />
                              {formatWIB(t.deadline, 'EEE, d MMM · HH:mm')}
                            </span>
                          )}
                          {forIndividual ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
                              <User className="h-3 w-3" /> Khusus kamu
                            </span>
                          ) : t.teams?.team_code && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
                              <UsersIcon className="h-3 w-3" />
                              <Badge variant="outline" className="font-mono text-[10px]">{t.teams.team_code}</Badge>
                            </span>
                          )}
                          {t.submission_url && (
                            <a
                              href={t.submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Link pengumpulan
                            </a>
                          )}
                          {(t.task_refs?.length ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary">
                              <FileText className="h-3 w-3" /> {t.task_refs.length} referensi
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Reminder tip */}
        <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Tip:</span> WhatsApp reminder otomatis dikirim H-2 sebelum deadline tugas. Kerjain dari yang deadline-nya paling dekat dulu ya.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
