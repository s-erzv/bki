import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Shield, Microscope, FileText, Presentation, Megaphone, GraduationCap, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagInput } from '@/components/ui/tag-input'
import { OnboardingShell } from '@/components/shared/OnboardingShell'
import { supabase } from '@/lib/supabase'
import { useAuthStore, metadataRole } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { CoachDivision } from '@/types/database'

const DIVISIONS: Array<{ value: CoachDivision; label: string; description: string; icon: LucideIcon }> = [
  { value: 'research',     label: 'Research',     description: 'Penelitian & metode ilmiah',  icon: Microscope },
  { value: 'paper',        label: 'Paper',        description: 'Penulisan makalah',           icon: FileText },
  { value: 'presentation', label: 'Presentation', description: 'Komunikasi & deck',           icon: Presentation },
  { value: 'marketing',    label: 'Marketing',    description: 'Promosi & branding',          icon: Megaphone },
  { value: 'admin',        label: 'Admin',        description: 'Manajemen sistem',            icon: Shield },
  { value: 'intern',       label: 'Intern',       description: 'Pembimbing magang',           icon: GraduationCap },
]

const schema = z.object({
  full_name:  z.string().min(2, 'Nama minimal 2 karakter'),
  phone:      z.string().min(10, 'Nomor HP tidak valid'),
  work_email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  division:   z.enum(['admin', 'research', 'paper', 'presentation', 'marketing', 'intern']),
})
type FormData = z.infer<typeof schema>

export function CoachOnboarding() {
  const navigate = useNavigate()
  const { user, profile, onboarded, setProfile, setRoleId, setOnboarded } = useAuthStore()
  const [skills, setSkills] = useState<string[]>([])

  // Already finished onboarding (phone set + coach row exists) → skip the form.
  useEffect(() => {
    if (onboarded) navigate('/coach', { replace: true })
  }, [onboarded, navigate])

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      division: 'research',
      full_name: profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? '',
      phone: profile?.phone ?? '',
    },
  })
  const division = watch('division')

  const onSubmit = async (data: FormData) => {
    if (!user) return
    try {
      const role = profile?.role ?? metadataRole(user) ?? 'coach'
      const { data: profileRow, error: pErr } = await supabase
        .from('profiles')
        .upsert(
          { auth_user_id: user.id, full_name: data.full_name, phone: data.phone || null, role },
          { onConflict: 'auth_user_id' },
        )
        .select()
        .single()
      if (pErr) throw pErr

      const profileId = (profileRow as { id: string }).id
      const { data: coachRow, error: cErr } = await supabase
        .from('coaches')
        .upsert(
          { profile_id: profileId, division: data.division, work_email: data.work_email || null },
          { onConflict: 'profile_id' },
        )
        .select()
        .single()
      if (cErr) throw cErr
      const coachId = (coachRow as { id: string }).id

      if (skills.length > 0) {
        await supabase.from('coach_skills').insert(skills.map((skill) => ({ coach_id: coachId, skill })))
      }

      setProfile(profileRow as never)
      setRoleId(coachId)
      setOnboarded(true)
      toast({ title: 'Selamat datang!', description: 'Profil pembimbing tersimpan.' })
      navigate('/coach', { replace: true })
    } catch (err) {
      toast({ title: 'Gagal menyimpan', description: errMsg(err), variant: 'destructive' })
    }
  }

  return (
    <OnboardingShell
      role="coach"
      title="Lengkapi profil pembimbing"
      description="Data ini muncul di dashboard murid dan wali yang kamu bimbing."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ── Identitas ─────────────────────────────── */}
        <Section title="Identitas">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nama lengkap" error={errors.full_name?.message}>
              <Input placeholder="Nama yang akan ditampilkan" {...register('full_name')} />
            </Field>
            <Field label="Nomor HP / WhatsApp" error={errors.phone?.message}>
              <Input placeholder="08xxxxxxxxxx" {...register('phone')} />
            </Field>
          </div>
          <Field label="Email kerja (opsional)" error={errors.work_email?.message}>
            <Input type="email" placeholder="email@bki.org" {...register('work_email')} />
          </Field>
        </Section>

        {/* ── Divisi ────────────────────────────────── */}
        <Section title="Pilih divisimu" description="Menentukan jenis bimbingan yang akan kamu pegang.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIVISIONS.map((d) => {
              const selected = division === d.value
              const Icon = d.icon
              return (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => setValue('division', d.value)}
                  className={cn(
                    'group text-left rounded-2xl border p-4 transition-all',
                    selected
                      ? 'border-primary-500 bg-primary-50/40 shadow-soft ring-2 ring-primary-100'
                      : 'border-surface-200 bg-white hover:border-primary-300',
                  )}
                >
                  <div className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3',
                    selected ? 'bg-primary-600 text-white' : 'bg-surface-100 text-text-secondary group-hover:bg-primary-100 group-hover:text-primary-700',
                  )}>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <p className="font-bold text-text-primary leading-tight">{d.label}</p>
                  <p className="text-xs text-text-tertiary leading-snug mt-0.5">{d.description}</p>
                </button>
              )
            })}
          </div>
        </Section>

        {/* ── Skills ────────────────────────────────── */}
        <Section title="Keahlianmu" description="Ketik dan tekan Enter — minimal 3 supaya tim BKI bisa matching project yang pas.">
          <TagInput value={skills} onChange={setSkills} placeholder="Misal: kimia organik, machine learning, public speaking…" />
        </Section>

        <div className="flex items-center justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="h-11 px-6">
            {isSubmitting ? 'Menyimpan…' : (<>Simpan & Masuk Dashboard <ArrowRight className="h-4 w-4 ml-1.5" /></>)}
          </Button>
        </div>
      </form>
    </OnboardingShell>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary-600">{title}</p>
        {description && <p className="text-xs text-text-tertiary mt-1">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
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
