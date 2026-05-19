import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Image as ImageIcon, MapPin, Video,
  Clock, BookOpen, Sparkles, Trophy, Lightbulb, ClipboardCheck,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stepper } from '@/components/ui/stepper'
import { ScoreInput } from '@/components/ui/score-input'
import { PhotoUpload } from '@/components/ui/photo-upload'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCoachTeams } from '@/hooks/useTeam'
import { useCreateSession } from '@/hooks/useSessions'
import { useGoogleDriveAccess } from '@/hooks/useGoogleDriveAccess'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { generateReportPdf, blobToBase64, type ReportData } from '@/lib/report-pdf'

const STEPS = ['Info Sesi', 'Nilai Murid', 'Dokumentasi']

const step1Schema = z.object({
  team_id: z.string().min(1, 'Pilih tim'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  time: z.string().min(1, 'Waktu wajib diisi'),
  duration_mins: z.number().min(15, 'Min 15 menit').max(480, 'Max 8 jam'),
  media: z.enum(['online', 'offline']),
  location: z.string().optional(),
  topic: z.string().min(1, 'Bahasan wajib diisi'),
  achievement: z.string().optional(),
  homework: z.string().optional(),
  evaluation: z.string().optional(),
})
type Step1Data = z.infer<typeof step1Schema>

const SCORE_FIELDS = [
  { key: 'score_discipline',     label: 'Kedisiplinan' },
  { key: 'score_activeness',     label: 'Keaktifan' },
  { key: 'score_communication',  label: 'Komunikasi' },
  { key: 'score_ethics',         label: 'Etika' },
  { key: 'score_understanding',  label: 'Pemahaman' },
] as const
type ScoreKey = typeof SCORE_FIELDS[number]['key']

interface StudentScore {
  student_id: string
  nama: string
  photo_url: string | null
  scores: Record<ScoreKey, number>
  notes: string
}

export function SessionReportForm() {
  const [step, setStep] = useState(0)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [studentScores, setStudentScores] = useState<StudentScore[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const classId = searchParams.get('classId')
  const { user, profile } = useAuthStore()

  const { data: teams = [] } = useCoachTeams()
  const createSession = useCreateSession()
  const { hasAccess: hasDriveAccess } = useGoogleDriveAccess()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      media: 'online',
      duration_mins: 90,
      date: new Date().toISOString().slice(0, 10),
    },
  })

  const selectedTeamId = watch('team_id')
  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const media = watch('media')

  // Pre-populate from classId if available
  useEffect(() => {
    if (!classId) return
    // For now we just leave it — could fetch class and pre-fill in the future.
  }, [classId])

  const initStudentScores = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    const members = team?.team_members ?? []
    setStudentScores(
      members.map((m) => ({
        student_id: m.student_id,
        nama: m.students?.profiles?.full_name ?? 'Murid',
        photo_url: m.students?.profiles?.photo_url ?? null,
        scores: {
          score_discipline: 7,
          score_activeness: 7,
          score_communication: 7,
          score_ethics: 7,
          score_understanding: 7,
        },
        notes: '',
      })),
    )
  }

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data)
    if (studentScores.length === 0 || studentScores[0]?.student_id) {
      // Re-init if team changed
      const existingTeamId = studentScores[0]?.student_id
        ? teams.find((t) => t.team_members.some((m) => m.student_id === studentScores[0].student_id))?.id
        : null
      if (existingTeamId !== data.team_id) initStudentScores(data.team_id)
    }
    setStep(1)
  }

  const updateScore = (studentId: string, key: ScoreKey, value: number) => {
    setStudentScores((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, scores: { ...s.scores, [key]: value } } : s)),
    )
  }
  const updateNotes = (studentId: string, notes: string) => {
    setStudentScores((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, notes } : s)))
  }

  const addPhoto = (file: File) => {
    setPhotos((prev) => prev.length < 4 ? [...prev, file] : prev)
  }
  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmitAll = async () => {
    if (!step1Data || !user) return
    setUploading(true)
    try {
      const sessionDate = new Date(`${step1Data.date}T${step1Data.time}:00+07:00`).toISOString()

      const photoUrls: string[] = []
      for (const file of photos) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
        const { error } = await supabase.storage.from('session-docs').upload(path, file)
        if (error) throw error
        const { data: pub } = supabase.storage.from('session-docs').getPublicUrl(path)
        photoUrls.push(pub.publicUrl)
      }

      const session = await createSession.mutateAsync({
        class_id: classId,
        team_id: step1Data.team_id,
        session_date: sessionDate,
        duration_mins: step1Data.duration_mins,
        media: step1Data.media,
        location: step1Data.location || null,
        topic: step1Data.topic,
        achievement: step1Data.achievement || null,
        homework: step1Data.homework || null,
        evaluation: step1Data.evaluation || null,
        studentReports: studentScores.map((s) => ({
          student_id: s.student_id,
          score_discipline: s.scores.score_discipline,
          score_activeness: s.scores.score_activeness,
          score_communication: s.scores.score_communication,
          score_ethics: s.scores.score_ethics,
          score_understanding: s.scores.score_understanding,
          notes: s.notes || null,
        })),
        photoUrls,
      })

      // PDF generation + Drive upload. Only attempt if coach has connected Drive.
      // Failure here is non-fatal — session is already saved, we just couldn't
      // produce the PDF artifact.
      let pdfWarning: string | undefined
      if (hasDriveAccess) {
        try {
          const team = teams.find((t) => t.id === step1Data.team_id)
          const reportData: ReportData = {
            team_code: team?.team_code ?? 'TIM',
            team_research_title: team?.research_title ?? null,
            coach_name: profile?.full_name ?? 'Pembimbing',
            session_date: sessionDate,
            duration_mins: step1Data.duration_mins,
            media: step1Data.media,
            location: step1Data.location || null,
            topic: step1Data.topic,
            achievement: step1Data.achievement || null,
            homework: step1Data.homework || null,
            evaluation: step1Data.evaluation || null,
            students: studentScores.map((s) => ({
              student_name: s.nama,
              score_discipline: s.scores.score_discipline,
              score_activeness: s.scores.score_activeness,
              score_communication: s.scores.score_communication,
              score_ethics: s.scores.score_ethics,
              score_understanding: s.scores.score_understanding,
              notes: s.notes || null,
            })),
          }
          const blob = await generateReportPdf(reportData)
          const base64 = await blobToBase64(blob)
          const { data: resp, error: fnErr } = await supabase.functions.invoke('upload-report-to-drive', {
            body: { sessionId: session.id, pdfBase64: base64 },
          })
          if (fnErr) {
            pdfWarning = (await readFnError(fnErr)) ?? fnErr.message
          } else if (resp?.error) {
            pdfWarning = resp.error
          }
        } catch (pdfErr) {
          pdfWarning = pdfErr instanceof Error ? pdfErr.message : String(pdfErr)
        }
      } else {
        pdfWarning = 'Hubungkan Google Drive di dashboard untuk auto-upload laporan PDF.'
      }

      if (pdfWarning) {
        toast({
          title: 'Laporan tersimpan',
          description: `Catatan: ${pdfWarning}`,
        })
      } else {
        toast({
          title: 'Laporan tersimpan!',
          description: 'PDF terupload ke Drive tim.',
        })
      }
      navigate('/coach/sessions')
    } catch (err) {
      toast({ title: 'Gagal menyimpan laporan', description: errMsg(err), variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  async function readFnError(err: unknown): Promise<string | null> {
    const ctx = (err as { context?: { response?: Response } })?.context
    if (!ctx?.response) return null
    try {
      const body = await ctx.response.clone().json()
      return body?.error ?? null
    } catch {
      return null
    }
  }

  return (
    <DashboardLayout
      title="Buat Laporan Pertemuan"
      subtitle="Selesai sesi? Catat semuanya di sini. Wali otomatis dapat PDF via WA."
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Stepper */}
        <Stepper steps={STEPS} current={step} />

        {/* ── Step 0: Info Sesi ───────────────────────── */}
        {step === 0 && (
          <form onSubmit={handleSubmit(handleStep1)} className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <SectionLabel icon={Clock}>Kapan & Di mana</SectionLabel>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tim yang dibimbing</Label>
                  <Select value={selectedTeamId ?? ''} onValueChange={(v) => setValue('team_id', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Pilih tim…" /></SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.team_code}{t.research_title ? ` — ${t.research_title}` : ''} ({t.team_members?.length ?? 0} murid)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.team_id && <p className="text-xs text-danger">{errors.team_id.message}</p>}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Tanggal" error={errors.date?.message}>
                    <Input type="date" {...register('date')} />
                  </Field>
                  <Field label="Waktu mulai" error={errors.time?.message}>
                    <Input type="time" {...register('time')} />
                  </Field>
                  <Field label="Durasi (menit)" error={errors.duration_mins?.message}>
                    <Input type="number" min={15} max={480} step={15} {...register('duration_mins', { valueAsNumber: true })} />
                  </Field>
                </div>

                <Field label="Media">
                  <div className="grid grid-cols-2 gap-2">
                    <MediaCard
                      selected={media === 'online'}
                      icon={Video}
                      label="Online (Google Meet)"
                      onClick={() => setValue('media', 'online')}
                    />
                    <MediaCard
                      selected={media === 'offline'}
                      icon={MapPin}
                      label="Offline (Tatap muka)"
                      onClick={() => setValue('media', 'offline')}
                    />
                  </div>
                </Field>

                {media === 'offline' && (
                  <Field label="Lokasi">
                    <Input placeholder="Nama tempat / alamat" {...register('location')} />
                  </Field>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-5">
                <SectionLabel icon={BookOpen}>Catatan Sesi</SectionLabel>

                <Field label="Bahasan utama" error={errors.topic?.message}>
                  <Textarea rows={2} placeholder="Topik yang dibahas pada sesi ini…" {...register('topic')} />
                </Field>

                <div className="grid md:grid-cols-2 gap-5">
                  <Field label={<>Pencapaian <Trophy className="h-3 w-3 text-accent-amber inline" /></>}>
                    <Textarea rows={3} placeholder="Apa yang berhasil dicapai murid sesi ini?" {...register('achievement')} />
                  </Field>
                  <Field label={<>PR / Tindak Lanjut <ClipboardCheck className="h-3 w-3 text-accent-teal inline" /></>}>
                    <Textarea rows={3} placeholder="Tugas yang harus dikerjakan sebelum sesi berikutnya…" {...register('homework')} />
                  </Field>
                </div>

                <Field label={<>Evaluasi & catatan <Lightbulb className="h-3 w-3 text-accent-purple inline" /></>}>
                  <Textarea rows={3} placeholder="Evaluasi umum sesi ini — kendala, hal positif, saran…" {...register('evaluation')} />
                </Field>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Batal
              </Button>
              <Button type="submit" className="h-11 px-6">
                Lanjut: Nilai Murid <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 1: Nilai Murid ─────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            {studentScores.length === 0 ? (
              <Card><CardContent><EmptyState icon={ClipboardCheck} title="Tim belum punya murid" description="Tambahkan anggota tim dulu lewat menu Admin → Tim." size="lg" /></CardContent></Card>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-text-secondary">
                    Tim <span className="font-bold text-text-primary font-mono">{selectedTeam?.team_code}</span> · {studentScores.length} murid
                  </p>
                  <p className="text-xs text-text-tertiary">Skala 1–10</p>
                </div>

                {studentScores.map((s) => (
                  <Card key={s.student_id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header */}
                      <div className="flex items-center gap-3 p-5 border-b border-surface-100 bg-surface-50/30">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt="" className="h-11 w-11 rounded-xl object-cover" />
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold shadow-soft">
                            {s.nama.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-text-primary truncate">{s.nama}</p>
                          <p className="text-xs text-text-tertiary">Avg: <span className="font-bold text-primary-700 tabular-nums">
                            {(Object.values(s.scores).reduce((a, b) => a + b, 0) / 5).toFixed(1)}
                          </span> / 10</p>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="p-5 space-y-3">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          {SCORE_FIELDS.map(({ key, label }) => (
                            <ScoreInput
                              key={key}
                              value={s.scores[key]}
                              onChange={(v) => updateScore(s.student_id, key, v)}
                              label={label}
                            />
                          ))}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs">Catatan untuk murid ini (opsional)</Label>
                          <Textarea
                            rows={2}
                            placeholder="Catatan khusus, feedback, hal yg perlu ditingkatkan…"
                            value={s.notes}
                            onChange={(e) => updateNotes(s.student_id, e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
              </Button>
              <Button onClick={() => setStep(2)} className="h-11 px-6" disabled={studentScores.length === 0}>
                Lanjut: Dokumentasi <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Dokumentasi ─────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <SectionLabel icon={ImageIcon}>Foto Dokumentasi</SectionLabel>
                  <p className="text-xs text-text-tertiary mt-1">Maksimal 4 foto landscape. Foto akan masuk ke folder Drive tim.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((i) => {
                    const file = photos[i]
                    return (
                      <div key={i} className="space-y-1.5">
                        <PhotoUpload
                          shape="square"
                          size={160}
                          value={file ? URL.createObjectURL(file) : null}
                          onFileSelect={addPhoto}
                          onClear={() => removePhoto(i)}
                          className="w-full"
                        />
                        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary text-center">
                          Foto {i + 1}{i === 0 && ' · utama'}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {photos.length === 0 && (
                  <p className="text-[11px] text-text-tertiary italic flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Foto opsional, tapi sangat membantu wali memantau aktivitas.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Summary preview */}
            <Card className="border-primary-200 bg-primary-50/30">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-700">Siap dikirim</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <Summary label="Tim"      value={selectedTeam?.team_code ?? '—'} />
                  <Summary label="Tanggal"  value={step1Data?.date ?? '—'} />
                  <Summary label="Durasi"   value={`${step1Data?.duration_mins ?? 0} menit`} />
                  <Summary label="Media"    value={step1Data?.media === 'online' ? 'Online' : 'Offline'} />
                  <Summary label="Murid"    value={`${studentScores.length} orang`} />
                  <Summary label="Foto"     value={`${photos.length} / 4`} />
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed mt-3 pt-3 border-t border-primary-200/50">
                  Setelah disimpan: PDF laporan dibuat → upload ke Drive tim → kirim ke nomor WA wali murid.
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={uploading}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
              </Button>
              <Button onClick={handleSubmitAll} disabled={uploading || createSession.isPending} className="h-11 px-6">
                {uploading
                  ? 'Mengunggah foto…'
                  : createSession.isPending
                    ? 'Menyimpan laporan…'
                    : (<>Konfirmasi & Kirim <ArrowRight className="h-4 w-4 ml-1.5" /></>)}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

/* ─────────────────────────────────────────────────────── */

function SectionLabel({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-text-tertiary">{children}</p>
    </div>
  )
}

function Field({ label, error, children }: { label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

interface MediaCardProps {
  selected: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}
function MediaCard({ selected, icon: Icon, label, onClick }: MediaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all',
        selected ? 'border-primary-500 bg-primary-50/40 shadow-soft' : 'border-surface-200 hover:border-primary-300',
      )}
    >
      <div className={cn(
        'h-9 w-9 rounded-lg flex items-center justify-center',
        selected ? 'bg-primary-600 text-white' : 'bg-surface-100 text-text-secondary',
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-bold text-text-primary leading-tight">{label}</p>
    </button>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wider font-bold text-text-tertiary">{label}</span>
      <Badge variant="outline" className="font-mono">{value}</Badge>
    </div>
  )
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : 'Terjadi kesalahan'
}
