import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Video, MapPin, Clock, Calendar as CalendarIcon, Users as UsersIcon, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { useCoachTeams } from '@/hooks/useTeam'
import { useCreateClass, useUpdateClass, type ClassWithTeams } from '@/hooks/useClasses'
import { useGoogleDriveAccess } from '@/hooks/useGoogleDriveAccess'
import { toast } from '@/components/ui/use-toast'
import { formatWIB } from '@/lib/utils'

const schema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  time: z.string().min(1, 'Waktu wajib diisi'),
  duration_mins: z.number().min(15, 'Min 15 menit').max(480, 'Max 8 jam'),
  media: z.enum(['online', 'offline']),
  location: z.string().optional(),
  maps_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  gmeet_link: z.string().url('Link tidak valid').optional().or(z.literal('')),
  topic: z.string().min(1, 'Bahasan wajib diisi'),
  teamIds: z.array(z.string()).min(1, 'Pilih minimal 1 tim'),
})
type SetKelasFormData = z.infer<typeof schema>

interface SetKelasFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional default date when opened from calendar cell click. */
  defaultDate?: string  // yyyy-MM-dd
  /** When provided, the form opens in EDIT mode pre-populated from this class. */
  editClass?: ClassWithTeams | null
}

export function SetKelasForm({ open, onOpenChange, defaultDate, editClass }: SetKelasFormProps) {
  const { data: teams = [] } = useCoachTeams()
  const createClass = useCreateClass()
  const updateClass = useUpdateClass()
  const { hasAccess: hasGoogleSync } = useGoogleDriveAccess()
  const isEdit = !!editClass

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SetKelasFormData>({
    resolver: zodResolver(schema),
    defaultValues: { media: 'online', duration_mins: 90, teamIds: [] },
  })
  const media = watch('media')
  const selectedTeamIds = watch('teamIds') ?? []

  // Hydrate form when opening (both create with defaultDate and edit with existing class)
  useEffect(() => {
    if (!open) return
    if (editClass) {
      reset({
        date: formatWIB(editClass.scheduled_at, 'yyyy-MM-dd'),
        time: formatWIB(editClass.scheduled_at, 'HH:mm'),
        duration_mins: editClass.duration_mins ?? 90,
        media: editClass.media,
        location: editClass.location ?? '',
        maps_url: editClass.maps_url ?? '',
        gmeet_link: editClass.gmeet_link ?? '',
        topic: editClass.topic ?? '',
        teamIds: (editClass.class_teams ?? []).map((ct) => ct.team_id),
      })
    } else if (defaultDate) {
      setValue('date', defaultDate)
    }
  }, [open, editClass, defaultDate, reset, setValue])

  const toggleTeam = (id: string) => {
    setValue(
      'teamIds',
      selectedTeamIds.includes(id) ? selectedTeamIds.filter((t) => t !== id) : [...selectedTeamIds, id],
      { shouldValidate: true },
    )
  }

  const onSubmit = async (data: SetKelasFormData) => {
    try {
      const scheduledAt = new Date(`${data.date}T${data.time}:00+07:00`).toISOString()
      const classData = {
        scheduled_at: scheduledAt,
        duration_mins: data.duration_mins,
        media: data.media,
        location: data.location || null,
        maps_url: data.maps_url || null,
        gmeet_link: data.gmeet_link || null,
        topic: data.topic,
      }

      if (isEdit && editClass) {
        await updateClass.mutateAsync({
          classId: editClass.id,
          updates: classData,
          teamIds: data.teamIds,
        })
        toast({ title: 'Kelas berhasil diupdate' })
      } else {
        const { gmeetWarning } = await createClass.mutateAsync({
          classData,
          teamIds: data.teamIds,
        })
        if (gmeetWarning) {
          toast({
            title: 'Kelas tersimpan, tapi Meet link gagal dibuat',
            description: gmeetWarning,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Kelas berhasil dijadwalkan',
            description: data.media === 'online' && hasGoogleSync ? 'Link Google Meet dan event Calendar otomatis dibuat.' : undefined,
          })
        }
      }
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Gagal menyimpan', description: errMsg(err), variant: 'destructive' })
    }
  }

  const isPending = createClass.isPending || updateClass.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Kelas' : 'Jadwalkan Kelas Baru'}</SheetTitle>
          <p className="text-xs text-text-tertiary mt-1">
            Murid otomatis dapat WA reminder H-1 dan event di kalender mereka.
          </p>
        </SheetHeader>
        <SheetBody>
          <form id="kelas-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ── When ──────────────────────────────────── */}
            <Section label="Kapan" icon={CalendarIcon}>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tanggal" error={errors.date?.message}>
                  <Input type="date" {...register('date')} />
                </FormField>
                <FormField label="Waktu" error={errors.time?.message}>
                  <Input type="time" {...register('time')} />
                </FormField>
              </div>
              <FormField label="Durasi (menit)" error={errors.duration_mins?.message}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-tertiary" />
                  <Input type="number" min={15} max={480} step={15} {...register('duration_mins', { valueAsNumber: true })} />
                </div>
              </FormField>
            </Section>

            {/* ── Where ─────────────────────────────────── */}
            <Section label="Di mana" icon={MapPin}>
              <FormField label="Media">
                <div className="grid grid-cols-2 gap-2">
                  <MediaOption
                    selected={media === 'online'}
                    icon={Video}
                    label="Google Meet"
                    description={hasGoogleSync ? 'Auto-generate link' : 'Input link manual'}
                    onClick={() => setValue('media', 'online')}
                  />
                  <MediaOption
                    selected={media === 'offline'}
                    icon={MapPin}
                    label="Tatap Muka"
                    description="Lokasi fisik"
                    onClick={() => setValue('media', 'offline')}
                  />
                </div>
              </FormField>

              {media === 'offline' && (
                <>
                  <FormField label="Lokasi">
                    <Input placeholder="Nama tempat / alamat" {...register('location')} />
                  </FormField>
                  <FormField label="URL Maps (opsional)" error={errors.maps_url?.message}>
                    <Input placeholder="https://maps.google.com/…" {...register('maps_url')} />
                  </FormField>
                </>
              )}

              {media === 'online' && (
                <div className="space-y-3">
                  {hasGoogleSync ? (
                    <div className="rounded-xl border border-primary-100 bg-primary-50/40 px-3 py-2.5 text-xs text-text-secondary leading-relaxed">
                      Link Google Meet akan otomatis dibuat saat kelas tersimpan.
                    </div>
                  ) : (
                    <FormField label="Link Pertemuan (GMeet/Zoom/dll)" error={errors.gmeet_link?.message}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-text-tertiary" />
                        <Input placeholder="https://meet.google.com/..." {...register('gmeet_link')} />
                      </div>
                    </FormField>
                  )}
                </div>
              )}
            </Section>

            {/* ── What ──────────────────────────────────── */}
            <Section label="Bahasan">
              <FormField label="Topik / materi yang dibahas" error={errors.topic?.message}>
                <Textarea
                  rows={3}
                  placeholder="Misal: review BAB 2 metodologi, latihan pitch presentasi…"
                  {...register('topic')}
                />
              </FormField>
            </Section>

            {/* ── Teams ─────────────────────────────────── */}
            <Section label="Untuk tim mana" icon={UsersIcon}>
              {teams.length === 0 ? (
                <EmptyState icon={UsersIcon} title="Belum ada tim" description="Bikin tim dulu lewat menu Admin → Tim." size="sm" />
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => {
                    const checked = selectedTeamIds.includes(team.id)
                    return (
                      <label
                        key={team.id}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all',
                          checked ? 'border-primary-500 bg-primary-50/40 shadow-soft' : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50/50',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTeam(team.id)}
                          className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary font-mono">{team.team_code}</p>
                          {team.research_title && (
                            <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{team.research_title}</p>
                          )}
                          <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary mt-1">
                            {team.team_members?.length ?? 0} murid
                          </p>
                        </div>
                      </label>
                    )
                  })}
                  {errors.teamIds && <p className="text-xs text-danger">{errors.teamIds.message}</p>}
                </div>
              )}
            </Section>
          </form>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" form="kelas-form" disabled={isPending}>
            {isPending ? 'Menyimpan…' : (isEdit ? 'Simpan Perubahan' : 'Jadwalkan Kelas')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* ─────────────────────────────────────────────────────── */

interface SectionProps {
  label: string
  icon?: LucideIcon
  children: React.ReactNode
}
function Section({ label, icon: Icon, children }: SectionProps) {
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

interface FormFieldProps {
  label: string
  error?: string
  children: React.ReactNode
}
function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

interface MediaOptionProps {
  selected: boolean
  icon: LucideIcon
  label: string
  description: string
  onClick: () => void
}
function MediaOption({ selected, icon: Icon, label, description, onClick }: MediaOptionProps) {
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
