import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, CheckSquare, Calendar as CalIcon, User, Users as UsersIcon, ExternalLink, Search, Pencil, Trash2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SetTugasForm } from '@/components/shared/SetTugasForm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useCoachTasks, useToggleTask, useDeleteTask, type TaskWithRefs } from '@/hooks/useTasks'
import { useCoachTeams } from '@/hooks/useTeam'
import { toast } from '@/components/ui/use-toast'
import { cn, formatWIB } from '@/lib/utils'

type Filter = 'all' | 'active' | 'done'

export function CoachTasks() {
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(searchParams.get('new') === '1')
  const [filter, setFilter] = useState<Filter>('active')
  const [search, setSearch] = useState('')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [editingTask, setEditingTask] = useState<TaskWithRefs | null>(null)
  const [deletingTask, setDeletingTask] = useState<TaskWithRefs | null>(null)

  const { data: tasks = [], isLoading } = useCoachTasks()
  const { data: teams = [] } = useCoachTeams()
  const toggleTask = useToggleTask()
  const deleteTask = useDeleteTask()

  const handleEdit = (t: TaskWithRefs) => setEditingTask(t)
  const handleDelete = async () => {
    if (!deletingTask) return
    try {
      await deleteTask.mutateAsync(deletingTask.id)
      toast({ title: 'Tugas dihapus' })
      setDeletingTask(null)
    } catch (err) {
      toast({
        title: 'Gagal hapus tugas',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    }
  }

  const counts = {
    all:    tasks.length,
    active: tasks.filter((t) => !t.is_completed).length,
    done:   tasks.filter((t) => t.is_completed).length,
  }

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterTeam !== 'all' && t.team_id !== filterTeam) return false
      if (filter === 'active' && t.is_completed) return false
      if (filter === 'done' && !t.is_completed) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tasks, filter, filterTeam, search])

  return (
    <DashboardLayout
      title="Daftar Tugas"
      subtitle={`${counts.active} tugas aktif · ${counts.done} selesai`}
      actions={
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Berikan Tugas</span>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
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
                {f === 'active' ? 'Aktif' : f === 'done' ? 'Selesai' : 'Semua'}
                <span className="ml-1.5 text-[10px] opacity-70 tabular-nums">{counts[f]}</span>
              </button>
            ))}
          </div>

          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-40 h-9 bg-white shadow-soft">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tim</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.team_code}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[12rem] max-w-xs ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas…"
              className="pl-9 h-9 bg-white shadow-soft"
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title={filter === 'done' ? 'Belum ada tugas selesai' : 'Tidak ada tugas'}
                description={filter !== 'done' ? 'Beri tugas baru lewat tombol di kanan atas.' : undefined}
                size="lg"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50/50 border-b border-surface-100">
                    <tr className="text-left">
                      <th className="w-12 px-4 py-3"></th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Tugas</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Deadline</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Diberikan ke</th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Status</th>
                      <th className="w-20 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => {
                      const overdue = t.deadline && new Date(t.deadline) < new Date() && !t.is_completed
                      return (
                        <tr key={t.id} className="border-b border-surface-100 last:border-b-0 hover:bg-primary-50/30 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={t.is_completed}
                              onChange={(e) => toggleTask.mutate({ taskId: t.id, isCompleted: e.target.checked })}
                              className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-4 py-3 min-w-0">
                            <p className={cn(
                              'font-semibold text-text-primary leading-tight',
                              t.is_completed && 'line-through text-text-tertiary',
                            )}>{t.title}</p>
                            {t.description && (
                              <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{t.description}</p>
                            )}
                            {(t.task_refs?.length ?? 0) > 0 && (
                              <p className="text-[10px] text-text-tertiary mt-1 inline-flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {t.task_refs.length} referensi
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {t.deadline ? (
                              <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', overdue ? 'text-accent-red' : 'text-text-secondary')}>
                                <CalIcon className="h-3 w-3" />
                                {formatWIB(t.deadline, 'd MMM · HH:mm')}
                              </span>
                            ) : (
                              <span className="text-xs text-text-tertiary italic">Tanpa deadline</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {t.assigned_student_id ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                                <User className="h-3 w-3 text-accent-purple" />
                                {t.students?.profiles?.full_name ?? 'Murid'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                                <UsersIcon className="h-3 w-3 text-accent-teal" />
                                <Badge variant="outline" className="font-mono text-[10px]">{t.teams?.team_code ?? '—'}</Badge>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {t.is_completed ? (
                              <Badge variant="success" className="text-[10px]">Selesai</Badge>
                            ) : overdue ? (
                              <Badge variant="danger" className="text-[10px]">Telat</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(t)}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-tertiary hover:text-primary-700 hover:bg-primary-50 transition-colors"
                                title="Edit tugas"
                                aria-label="Edit tugas"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTask(t)}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-tertiary hover:text-accent-red hover:bg-red-50 transition-colors"
                                title="Hapus tugas"
                                aria-label="Hapus tugas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SetTugasForm open={open} onOpenChange={setOpen} />
      <SetTugasForm
        open={!!editingTask}
        onOpenChange={(o) => { if (!o) setEditingTask(null) }}
        task={editingTask}
      />

      <Dialog open={!!deletingTask} onOpenChange={(o) => { if (!o) setDeletingTask(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus tugas ini?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Tugas <span className="font-semibold text-text-primary">"{deletingTask?.title}"</span> bakal dihapus permanen
              beserta semua referensinya. Aksi ini gak bisa dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingTask(null)} disabled={deleteTask.isPending}>
                Batal
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteTask.isPending}
                className="bg-accent-red hover:bg-accent-red/90 text-white"
              >
                {deleteTask.isPending ? 'Menghapus…' : 'Hapus permanen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
