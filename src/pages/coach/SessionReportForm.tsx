import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Upload, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useCoachTeams } from '@/hooks/useTeam'
import { useCreateSession } from '@/hooks/useSessions'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const step1Schema = z.object({
  team_id: z.string().min(1, 'Pilih tim'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  duration_minutes: z.number().min(1),
  media: z.enum(['online', 'offline']),
  location: z.string().optional(),
  topic: z.string().min(1, 'Topik wajib diisi'),
  achievement: z.string().optional(),
  homework: z.string().optional(),
  evaluation: z.string().optional(),
})
type Step1Data = z.infer<typeof step1Schema>

const SCORE_FIELDS = [
  { key: 'score_penguasaan', label: 'Penguasaan Materi' },
  { key: 'score_presentasi', label: 'Presentasi' },
  { key: 'score_keaktifan', label: 'Keaktifan' },
  { key: 'score_kedisiplinan', label: 'Kedisiplinan' },
  { key: 'score_kreativitas', label: 'Kreativitas' },
] as const

type ScoreKey = typeof SCORE_FIELDS[number]['key']

interface StudentScore {
  student_id: string
  nama: string
  scores: Record<ScoreKey, number>
  notes: string
}

const STEPS = ['Info Sesi', 'Nilai Murid', 'Dokumentasi']

export function SessionReportForm() {
  const [step, setStep] = useState(0)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [studentScores, setStudentScores] = useState<StudentScore[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const classId = searchParams.get('classId')
  const { user } = useAuthStore()

  const { data: teams = [] } = useCoachTeams()
  const createSession = useCreateSession()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { media: 'online', duration_minutes: 90 },
  })

  const selectedTeamId = watch('team_id')
  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  const initStudentScores = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    const members = team?.team_members ?? []
    setStudentScores(
      members.map((m) => ({
        student_id: m.student_id,
        nama: (m.students as { nama?: string } | null)?.nama ?? 'Murid',
        scores: {
          score_penguasaan: 7,
          score_presentasi: 7,
          score_keaktifan: 7,
          score_kedisiplinan: 7,
          score_kreativitas: 7,
        },
        notes: '',
      }))
    )
  }

  const handleStep1 = (data: Step1Data): void => {
    setStep1Data(data)
    if (studentScores.length === 0) initStudentScores(data.team_id)
    setStep(1)
  }

  const updateScore = (studentId: string, key: ScoreKey, value: number) => {
    setStudentScores((prev) =>
      prev.map((s) => s.student_id === studentId ? { ...s, scores: { ...s.scores, [key]: value } } : s)
    )
  }

  const updateNotes = (studentId: string, notes: string) => {
    setStudentScores((prev) => prev.map((s) => s.student_id === studentId ? { ...s, notes } : s))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setPhotos((prev) => [...prev, ...files].slice(0, 4))
  }

  const handleSubmitAll = async () => {
    if (!step1Data || !user) return
    setUploading(true)
    try {
      const photoPaths: string[] = []
      for (const file of photos) {
        const path = `session-docs/${user.id}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('session-docs').upload(path, file)
        if (error) throw error
        photoPaths.push(path)
      }

      await createSession.mutateAsync({
        class_id: classId,
        team_id: step1Data.team_id,
        date: step1Data.date,
        duration_minutes: step1Data.duration_minutes,
        media: step1Data.media,
        location: step1Data.location ?? '',
        topic: step1Data.topic,
        achievement: step1Data.achievement ?? '',
        homework: step1Data.homework ?? '',
        evaluation: step1Data.evaluation ?? '',
        studentReports: studentScores.map((s) => ({
          student_id: s.student_id,
          score_penguasaan: s.scores.score_penguasaan,
          score_presentasi: s.scores.score_presentasi,
          score_keaktifan: s.scores.score_keaktifan,
          score_kedisiplinan: s.scores.score_kedisiplinan,
          score_kreativitas: s.scores.score_kreativitas,
          notes: s.notes,
        })),
        photoPaths,
      })

      toast({ title: 'Laporan berhasil disimpan!' })
      navigate('/coach/sessions')
    } catch (err) {
      toast({ title: 'Gagal menyimpan laporan', description: String(err), variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <DashboardLayout title="Isi Laporan Sesi">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              i < step ? 'bg-primary-600 text-white'
                : i === step ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                : 'bg-surface-100 text-text-tertiary'
            )}>
              {i + 1}
            </div>
            <span className={cn('text-sm font-medium', i === step ? 'text-text-primary' : 'text-text-tertiary')}>{s}</span>
            {i < STEPS.length - 1 && <div className={cn('h-px w-8', i < step ? 'bg-primary-500' : 'bg-surface-200')} />}
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 0 && (
        <form onSubmit={handleSubmit(handleStep1)} className="max-w-2xl space-y-5">
          <div className="space-y-1.5">
            <Label>Tim</Label>
            <Select onValueChange={(v) => setValue('team_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih tim..." /></SelectTrigger>
              <SelectContent>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.team_code} — {t.nama_tim}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.team_id && <p className="text-xs text-danger">{errors.team_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tanggal</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Durasi (menit)</Label>
              <Input type="number" {...register('duration_minutes', { valueAsNumber: true })} />
            </div>
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

          <div className="space-y-1.5">
            <Label>Lokasi (opsional)</Label>
            <Input placeholder="Lokasi pertemuan" {...register('location')} />
          </div>

          <div className="space-y-1.5">
            <Label>Topik</Label>
            <Input placeholder="Topik yang dibahas" {...register('topic')} />
            {errors.topic && <p className="text-xs text-danger">{errors.topic.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Pencapaian</Label>
            <Textarea placeholder="Apa yang berhasil dicapai..." {...register('achievement')} />
          </div>

          <div className="space-y-1.5">
            <Label>PR / Tindak Lanjut</Label>
            <Textarea placeholder="Tugas untuk pertemuan selanjutnya..." {...register('homework')} />
          </div>

          <div className="space-y-1.5">
            <Label>Evaluasi</Label>
            <Textarea placeholder="Evaluasi umum sesi ini..." {...register('evaluation')} />
          </div>

          <div className="flex justify-end">
            <Button type="submit">
              Lanjut <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Student scores */}
      {step === 1 && (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary">
            Tim: <span className="font-medium text-text-primary">{selectedTeam?.team_code ?? step1Data?.team_id}</span>
            {' '}• {studentScores.length} murid
          </p>

          {studentScores.map((student) => (
            <Card key={student.student_id}>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-text-primary">{student.nama}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {SCORE_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4">
                      <Label className="w-40 flex-shrink-0 text-xs">{label}</Label>
                      <input
                        type="range"
                        min={1} max={10} step={1}
                        value={student.scores[key]}
                        onChange={(e) => updateScore(student.student_id, key, Number(e.target.value))}
                        className="flex-1 accent-primary-600"
                      />
                      <span className="w-8 text-center font-bold text-primary-600 text-sm">{student.scores[key]}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Catatan</Label>
                  <Textarea
                    placeholder="Catatan untuk murid ini..."
                    value={student.notes}
                    onChange={(e) => updateNotes(student.student_id, e.target.value)}
                    className="h-20"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ChevronLeft className="h-4 w-4" /> Kembali
            </Button>
            <Button onClick={() => setStep(2)}>
              Lanjut <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Photos */}
      {step === 2 && (
        <div className="max-w-2xl space-y-6">
          <div className="space-y-3">
            <Label>Foto Dokumentasi (maks. 4 foto, landscape)</Label>
            <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-surface-300 bg-surface-50 cursor-pointer hover:bg-surface-100 transition-colors">
              <Upload className="h-6 w-6 text-text-tertiary mb-2" />
              <span className="text-sm text-text-secondary">Klik untuk unggah foto</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
            </label>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((file, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden aspect-video bg-surface-100">
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4" /> Kembali
            </Button>
            <Button onClick={handleSubmitAll} disabled={uploading || createSession.isPending}>
              {uploading ? 'Mengunggah...' : createSession.isPending ? 'Menyimpan...' : 'Simpan Laporan'}
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
