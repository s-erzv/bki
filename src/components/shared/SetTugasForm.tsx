import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Link as LinkIcon, Trash2, Plus, Users as UsersIcon, User, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useCoachTeams } from '@/hooks/useTeam'
import { useCreateTask, useUpdateTask, type TaskWithRefs } from '@/hooks/useTasks'
import { toast } from '@/components/ui/use-toast'
import { formatWIB } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  team_id: z.string().min(1, 'Pilih tim'),
  assign_type: z.enum(['team', 'student']),
  assigned_student_id: z.string().optional(),
  submission_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  refs: z.array(z.object({
    ref_type: z.enum(['file', 'link']),
    label: z.string().min(1, 'Label wajib'),
    url: z.string().min(1, 'URL wajib'),
  })),
})
type SetTugasFormData = z.infer<typeof schema>

interface SetTugasFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass an existing task to edit it; omit/null for create mode. */
  task?: TaskWithRefs | null
}

export function SetTugasForm({ open, onOpenChange, task }: SetTugasFormProps) {
  const { data: teams = [] } = useCoachTeams()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const isEdit = !!task

  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm<SetTugasFormData>({
    resolver: zodResolver(schema),
    defaultValues: { assign_type: 'team', refs: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'refs' })
  const assignType = watch('assign_type')
  const selectedTeamId = watch('team_id')

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const students = (selectedTeam?.team_members ?? [])
    .map((m) => m.students)
    .filter((s): s is NonNullable<typeof s> => s !== null)

  // Hydrate form when opening — both create (reset) and edit (prefill from task) cases.
  useEffect(() => {
    if (!open) return
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        deadline: task.deadline ? formatWIB(task.deadline, "yyyy-MM-dd'T'HH:mm") : '',
        team_id: task.team_id,
        assign_type: task.assigned_student_id ? 'student' : 'team',
        assigned_student_id: task.assigned_student_id ?? undefined,
        submission_url: task.submission_url ?? '',
        refs: task.task_refs.map((r) => ({
          ref_type: r.ref_type as 'file' | 'link',
          label: r.label ?? '',
          url: r.url,
        })),
      })
    } else {
      reset({ assign_type: 'team', refs: [] })
    }
  }, [open, task, reset])

  const onSubmit = async (data: SetTugasFormData) => {
    try {
      const deadlineIso = data.deadline ? new Date(data.deadline).toISOString() : null
      const taskPayload = {
        title: data.title,
        description: data.description || null,
        deadline: deadlineIso,
        team_id: data.team_id,
        assigned_student_id: data.assign_type === 'student' ? (data.assigned_student_id ?? null) : null,
        submission_url: data.submission_url || null,
      }
      const refsPayload = data.refs.map((r) => ({ ref_type: r.ref_type, url: r.url, label: r.label }))

      if (isEdit && task) {
        await updateTask.mutateAsync({ taskId: task.id, task: taskPayload, refs: refsPayload })
        toast({ title: 'Tugas berhasil diupdate' })
      } else {
        await createTask.mutateAsync({ task: taskPayload, refs: refsPayload })
        toast({ title: 'Tugas berhasil diberikan' })
      }
      onOpenChange(false)
    } catch (err) {
      toast({
        title: isEdit ? 'Gagal update tugas' : 'Gagal beri tugas',
        description: errMsg(err),
        variant: 'destructive',
      })
    }
  }

  const isPending = createTask.isPending || updateTask.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Tugas' : 'Berikan Tugas'}</SheetTitle>
          <p className="text-xs text-text-tertiary mt-1">
            {isEdit
              ? 'Perubahan langsung kelihatan di sisi murid.'
              : 'Murid otomatis dapat WA reminder H-2 sebelum deadline.'}
          </p>
        </SheetHeader>
        <SheetBody>
          <form id="tugas-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ── Detail ────────────────────────────────── */}
            <Section label="Detail Tugas">
              <FormField label="Judul" error={errors.title?.message}>
                <Input placeholder="Misal: Susun BAB 3 metodologi" {...register('title')} />
              </FormField>
              <FormField label="Deskripsi (opsional)">
                <Textarea rows={3} placeholder="Penjelasan tambahan, instruksi, format pengumpulan…" {...register('description')} />
              </FormField>
              <FormField label="Deadline" error={errors.deadline?.message}>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-text-tertiary" />
                  <Input type="datetime-local" {...register('deadline')} />
                </div>
              </FormField>
            </Section>

            {/* ── Assignee ──────────────────────────────── */}
            <Section label="Yang Ditugaskan" icon={UsersIcon}>
              <FormField label="Tim" error={errors.team_id?.message}>
                <Select value={selectedTeamId ?? ''} onValueChange={(v) => setValue('team_id', v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Pilih tim…" /></SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.team_code}{t.research_title ? ` — ${t.research_title}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Diberikan ke">
                <div className="grid grid-cols-2 gap-2">
                  <AssigneeOption
                    selected={assignType === 'team'}
                    icon={UsersIcon}
                    label="Seluruh Tim"
                    description="Semua anggota wajib"
                    onClick={() => setValue('assign_type', 'team')}
                  />
                  <AssigneeOption
                    selected={assignType === 'student'}
                    icon={User}
                    label="Murid Tertentu"
                    description="Hanya 1 murid"
                    onClick={() => setValue('assign_type', 'student')}
                  />
                </div>
              </FormField>

              {assignType === 'student' && (
                selectedTeamId ? (
                  students.length > 0 ? (
                    <FormField label="Pilih Murid">
                      <Select value={watch('assigned_student_id') ?? ''} onValueChange={(v) => setValue('assigned_student_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Pilih murid…" /></SelectTrigger>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.profiles?.full_name ?? 'Murid'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  ) : (
                    <EmptyState icon={User} title="Tim belum punya murid" description="Tambahkan anggota tim dulu lewat menu Admin." size="sm" />
                  )
                ) : (
                  <p className="text-xs text-text-tertiary italic">Pilih tim dulu di atas.</p>
                )
              )}
            </Section>

            {/* ── Submission ────────────────────────────── */}
            <Section label="Pengumpulan">
              <FormField label="Link pengumpulan (opsional)" error={errors.submission_url?.message}>
                <Input placeholder="https://forms.google.com/…" {...register('submission_url')} />
              </FormField>
            </Section>

            {/* ── References ────────────────────────────── */}
            <Section label="Referensi (opsional)">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => append({ ref_type: 'link', label: '', url: '' })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Link
                </button>
                <button
                  type="button"
                  onClick={() => append({ ref_type: 'file', label: '', url: '' })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  <Plus className="h-3 w-3" /> File
                </button>
                <span className="text-[10px] text-text-tertiary">Bahan bacaan atau template untuk murid.</span>
              </div>

              {fields.length > 0 && (
                <div className="space-y-2">
                  {fields.map((field, i) => (
                    <div key={field.id} className="rounded-xl border border-surface-200 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-text-tertiary">
                          {field.ref_type === 'file' ? <FileText className="h-3 w-3" /> : <LinkIcon className="h-3 w-3" />}
                          {field.ref_type === 'file' ? 'File' : 'Link'}
                        </div>
                        <button type="button" onClick={() => remove(i)} className="text-text-tertiary hover:text-danger transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Input placeholder="Label (misal: Template Metodologi)" {...register(`refs.${i}.label`)} />
                      <Input placeholder={field.ref_type === 'file' ? 'URL file (Drive, Dropbox, …)' : 'URL link'} {...register(`refs.${i}.url`)} />
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </form>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" form="tugas-form" disabled={isPending}>
            {isPending ? 'Menyimpan…' : (isEdit ? 'Simpan Perubahan' : 'Berikan Tugas')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* ─────────────────────────────────────────────────────── */

function Section({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="h-7 w-7 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-text-tertiary">{label}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

interface AssigneeOptionProps {
  selected: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  onClick: () => void
}
function AssigneeOption({ selected, icon: Icon, label, description, onClick }: AssigneeOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all',
        selected ? 'border-primary-500 bg-primary-50/40 shadow-soft' : 'border-surface-200 hover:border-primary-300',
      )}
    >
      <div className={cn(
        'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
        selected ? 'bg-primary-600 text-white' : 'bg-surface-100 text-text-secondary',
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-text-primary leading-tight">{label}</p>
        <p className="text-[11px] text-text-tertiary leading-tight mt-0.5">{description}</p>
      </div>
    </button>
  )
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : 'Terjadi kesalahan'
}
