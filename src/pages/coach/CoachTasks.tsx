import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TaskCard } from '@/components/shared/TaskCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useCoachTasks, useCreateTask } from '@/hooks/useTasks'
import { useCoachTeams } from '@/hooks/useTeam'
import { toast } from '@/components/ui/use-toast'

const taskSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  assign_type: z.enum(['team', 'student']),
  team_id: z.string().optional(),
  student_id: z.string().optional(),
  submission_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  refs: z.array(z.object({
    ref_type: z.enum(['file', 'link']),
    name: z.string().min(1),
    url: z.string().min(1),
  })),
})
type TaskFormData = z.infer<typeof taskSchema>

export function CoachTasks() {
  const [open, setOpen] = useState(false)
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const { data: tasks = [], isLoading } = useCoachTasks()
  const { data: teams = [] } = useCoachTeams()
  const createTask = useCreateTask()

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { assign_type: 'team', refs: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'refs' })
  const assignType = watch('assign_type')
  const selectedTeamId = watch('team_id')

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const students = selectedTeam?.team_members?.map((m) => m.students).filter(Boolean) ?? []

  const filtered = tasks.filter((t) => {
    if (filterTeam !== 'all' && t.team_id !== filterTeam) return false
    if (filterStatus === 'active' && t.is_completed) return false
    if (filterStatus === 'done' && !t.is_completed) return false
    return true
  })

  const onSubmit = async (data: TaskFormData) => {
    try {
      await createTask.mutateAsync({
        task: {
          title: data.title,
          description: data.description || null,
          deadline: data.deadline || null,
          team_id: data.assign_type === 'team' ? (data.team_id || null) : null,
          student_id: data.assign_type === 'student' ? (data.student_id || null) : null,
          submission_url: data.submission_url || null,
        },
        refs: data.refs,
      })
      toast({ title: 'Tugas berhasil dibuat!' })
      reset()
      setOpen(false)
    } catch (err) {
      toast({ title: 'Gagal membuat tugas', description: String(err), variant: 'destructive' })
    }
  }

  return (
    <DashboardLayout title="Daftar Tugas">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Semua Tim" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tim</SelectItem>
              {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.team_code}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="done">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Beri Tugas
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">
            <p>Belum ada tugas. Mulai beri tugas ke tim atau murid.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => <TaskCard key={task.id} task={task as Parameters<typeof TaskCard>[0]['task']} />)}
          </div>
        )}
      </div>

      {/* Set Tugas Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Beri Tugas</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label>Judul Tugas</Label>
                <Input placeholder="Judul tugas..." {...register('title')} />
                {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Deskripsi</Label>
                <Textarea placeholder="Deskripsi tugas..." {...register('description')} />
              </div>

              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="datetime-local" {...register('deadline')} />
              </div>

              <div className="space-y-1.5">
                <Label>Diberikan ke</Label>
                <Select defaultValue="team" onValueChange={(v) => setValue('assign_type', v as 'team' | 'student')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Tim</SelectItem>
                    <SelectItem value="student">Murid Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Tim</Label>
                <Select onValueChange={(v) => setValue('team_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih tim..." /></SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.team_code} — {t.nama_tim}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {assignType === 'student' && students.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Murid</Label>
                  <Select onValueChange={(v) => setValue('student_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih murid..." /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => s && <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>URL Pengumpulan (opsional)</Label>
                <Input placeholder="https://..." {...register('submission_url')} />
              </div>

              {/* Refs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Referensi</Label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => append({ ref_type: 'link', name: '', url: '' })}
                      className="text-xs text-primary-600 hover:underline">+ Link</button>
                    <button type="button" onClick={() => append({ ref_type: 'file', name: '', url: '' })}
                      className="text-xs text-primary-600 hover:underline">+ File</button>
                  </div>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start p-3 bg-surface-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Nama referensi" {...register(`refs.${index}.name`)} />
                      <Input placeholder="URL / link" {...register(`refs.${index}.url`)} />
                    </div>
                    <button type="button" onClick={() => remove(index)} className="p-1 text-text-tertiary hover:text-danger mt-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="task-form" disabled={createTask.isPending}>
              {createTask.isPending ? 'Menyimpan...' : 'Simpan Tugas'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
