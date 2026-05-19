import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Stepper } from '@/components/ui/stepper'
import { TagInput } from '@/components/ui/tag-input'
import { OnboardingShell } from '@/components/shared/OnboardingShell'
import { supabase } from '@/lib/supabase'
import { useAuthStore, metadataRole } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'

const STEPS = ['Data Diri', 'Sekolah & Akademik']

const schema = z.object({
  full_name:   z.string().min(2, 'Nama minimal 2 karakter'),
  phone:       z.string().min(10, 'Nomor HP tidak valid'),
  age:         z.string().optional(),
  info_email:  z.string().email('Email tidak valid').optional().or(z.literal('')),
  nisn:        z.string().optional(),
  npsn:        z.string().optional(),
  grade:       z.string().min(1, 'Kelas wajib diisi'),
  major:       z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function StudentOnboarding() {
  const navigate = useNavigate()
  const { user, profile, onboarded, setProfile, setRoleId, setOnboarded } = useAuthStore()

  // Already finished onboarding → skip the form.
  useEffect(() => {
    if (onboarded) navigate('/student', { replace: true })
  }, [onboarded, navigate])
  const [step, setStep] = useState(0)
  const [interests, setInterests] = useState<string[]>([])

  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? '',
      phone: profile?.phone ?? '',
    },
  })

  const nextStep = async () => {
    const valid = await trigger(['full_name', 'phone'])
    if (valid) setStep(1)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    try {
      const role = profile?.role ?? metadataRole(user) ?? 'student'
      const { data: profileRow, error: pErr } = await supabase
        .from('profiles')
        .upsert(
          { auth_user_id: user.id, full_name: data.full_name, phone: data.phone || null, role },
          { onConflict: 'auth_user_id' },
        )
        .select()
        .single()
      if (pErr) throw pErr

      const { data: studentRow, error: sErr } = await supabase
        .from('students')
        .upsert(
          {
            profile_id: (profileRow as { id: string }).id,
            grade: data.grade,
            major: data.major || null,
            nisn: data.nisn || null,
            npsn: data.npsn || null,
            age: data.age ? Number(data.age) : null,
            info_email: data.info_email || null,
            interests: interests.length > 0 ? interests.join(', ') : null,
          },
          { onConflict: 'profile_id' },
        )
        .select()
        .single()
      if (sErr) throw sErr

      setProfile(profileRow as never)
      setRoleId((studentRow as { id: string }).id)
      setOnboarded(true)
      toast({ title: 'Selamat datang!', description: 'Profil murid tersimpan.' })
      navigate('/student', { replace: true })
    } catch (err) {
      toast({ title: 'Gagal menyimpan', description: errMsg(err), variant: 'destructive' })
    }
  }

  return (
    <OnboardingShell
      role="student"
      title="Halo, mari kenalan dulu"
      description="Beberapa data biar pembimbing kenal kamu dan bisa kasih materi yang relevan."
      stepper={<Stepper steps={STEPS} current={step} />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {step === 0 && (
          <Section title="Identitas">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nama lengkap" error={errors.full_name?.message}>
                <Input placeholder="Nama yang akan ditampilkan" {...register('full_name')} />
              </Field>
              <Field label="Nomor HP / WhatsApp" error={errors.phone?.message}>
                <Input placeholder="08xxxxxxxxxx" {...register('phone')} />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Usia (opsional)">
                <Input type="number" placeholder="17" {...register('age')} />
              </Field>
              <Field label="Email info lomba (opsional)" error={errors.info_email?.message}>
                <Input type="email" placeholder="email@gmail.com" {...register('info_email')} />
              </Field>
            </div>
            <Field label="Minat (opsional)">
              <TagInput value={interests} onChange={setInterests} placeholder="Misal: biologi, robotik, fotografi…" />
            </Field>
          </Section>
        )}

        {step === 1 && (
          <Section title="Data Akademik">
            <Field label="NISN (opsional)">
              <Input placeholder="Nomor Induk Siswa Nasional" {...register('nisn')} />
            </Field>
            <Field label="NPSN Sekolah (opsional)">
              <Input placeholder="Kode sekolah" {...register('npsn')} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Kelas" error={errors.grade?.message}>
                <Input placeholder="X / XI / XII" {...register('grade')} />
              </Field>
              <Field label="Jurusan (opsional)">
                <Input placeholder="IPA / IPS / Bahasa" {...register('major')} />
              </Field>
            </div>
          </Section>
        )}

        <div className="flex items-center justify-between pt-2">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
            </Button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep} className="h-11 px-6">
              Lanjut <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="h-11 px-6">
              {isSubmitting ? 'Menyimpan…' : (<>Selesai <ArrowRight className="h-4 w-4 ml-1.5" /></>)}
            </Button>
          )}
        </div>
      </form>
    </OnboardingShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary-600">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : 'Terjadi kesalahan'
}
