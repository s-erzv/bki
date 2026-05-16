import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ClassCard } from '@/components/shared/ClassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useCoachClasses, useCreateClass } from '@/hooks/useClasses'
import { useCoachTeams } from '@/hooks/useTeam'
import { toast } from '@/components/ui/use-toast'

const classSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  time: z.string().min(1, 'Waktu wajib diisi'),
  duration_minutes: z.number().min(1),
  media: z.enum(['online', 'offline']),
  location: z.string().optional(),
  maps_url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  topic: z.string().min(1, 'Topik wajib diisi'),
  teamIds: z.array(z.string()).min(1, 'Pilih minimal 1 tim'),
})
type ClassFormData = z.infer<typeof classSchema>

export function CoachClasses() {
  const [open, setOpen] = useState(false)
  const { data: classes = [], isLoading } = useCoachClasses()
  const { data: teams = [] } = useCoachTeams()
  const createClass = useCreateClass()

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: { media: 'online', duration_minutes: 90, teamIds: [] },
  })
  const media = watch('media')
  const selectedTeamIds = watch('teamIds') ?? []

  const toggleTeam = (id: string) => {
    setValue(
      'teamIds',
      selectedTeamIds.includes(id) ? selectedTeamIds.filter((t) => t !== id) : [...selectedTeamIds, id]
    )
  }

  const onSubmit = async (data: ClassFormData): Promise<void> => {
    try {
      await createClass.mutateAsync({
        classData: {
          date: data.date,
          time: data.time,
          duration_minutes: data.duration_minutes,
          media: data.media,
          location: data.location || null,
          maps_url: data.maps_url || null,
          topic: data.topic,
        },
        teamIds: data.teamIds,
      })
      toast({ title: 'Kelas berhasil dibuat!', variant: 'default' })
      reset()
      setOpen(false)
    } catch (err) {
      toast({ title: 'Gagal membuat kelas', description: String(err), variant: 'destructive' })
    }
  }

  return (
    <DashboardLayout title="Daftar Kelas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-text-secondary text-sm">{classes.length} kelas terdaftar</p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Tambah Jadwal Pertemuan
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">
            <BookOpenIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Belum ada kelas. Tambahkan jadwal pertemuan pertamamu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls) => <ClassCard key={cls.id} cls={cls as Parameters<typeof ClassCard>[0]['cls']} showReportBtn />)}
          </div>
        )}
      </div>

      {/* Set Kelas Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Tambah Jadwal Pertemuan</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <form id="class-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tanggal</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Waktu</Label>
                  <Input type="time" {...register('time')} />
                  {errors.time && <p className="text-xs text-danger">{errors.time.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Durasi (menit)</Label>
                <Input type="number" {...register('duration_minutes', { valueAsNumber: true })} />
              </div>

              <div className="space-y-1.5">
                <Label>Media</Label>
                <Select defaultValue="online" onValueChange={(v) => setValue('media', v as 'online' | 'offline')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {media === 'offline' && (
                <>
                  <div className="space-y-1.5">
                    <Label>Lokasi</Label>
                    <Input placeholder="Nama tempat" {...register('location')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>URL Maps (opsional)</Label>
                    <Input placeholder="https://maps.google.com/..." {...register('maps_url')} />
                    {errors.maps_url && <p className="text-xs text-danger">{errors.maps_url.message}</p>}
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Topik / Materi</Label>
                <Input placeholder="Topik pertemuan ini" {...register('topic')} />
                {errors.topic && <p className="text-xs text-danger">{errors.topic.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Pilih Tim</Label>
                {teams.length === 0 ? (
                  <p className="text-sm text-text-tertiary">Belum ada tim terdaftar</p>
                ) : (
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <label key={team.id} className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50">
                        <input
                          type="checkbox"
                          checked={selectedTeamIds.includes(team.id)}
                          onChange={() => toggleTeam(team.id)}
                          className="h-4 w-4 rounded border-surface-300 text-primary-600"
                        />
                        <span className="text-sm font-medium">{team.team_code}</span>
                        <span className="text-xs text-text-tertiary">{team.nama_tim}</span>
                      </label>
                    ))}
                  </div>
                )}
                {errors.teamIds && <p className="text-xs text-danger">{errors.teamIds.message}</p>}
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" form="class-form" disabled={createClass.isPending}>
              {createClass.isPending ? 'Menyimpan...' : 'Simpan Kelas'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}
