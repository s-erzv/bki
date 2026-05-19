import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  GraduationCap, Users as UsersIcon, Heart, ShieldCheck,
  Microscope, FileText, Presentation, Megaphone, Shield, User as UserIcon,
  Lock, Save, LogOut, Mail, Phone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhotoUpload } from '@/components/ui/photo-upload'
import { TagInput } from '@/components/ui/tag-input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useSignOut } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile, useCoachProfile, useStudentProfile } from '@/hooks/useProfile'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { CoachDivision, UserRole } from '@/types/database'

/* ─── Maps ─────────────────────────────────────────────────────────────── */

const ROLE_META: Record<UserRole, { label: string; icon: LucideIcon; accent: string }> = {
  coach:   { label: 'Pembimbing', icon: GraduationCap, accent: 'from-primary-500 to-primary-700' },
  student: { label: 'Murid',      icon: UsersIcon,     accent: 'from-accent-teal to-primary-600' },
  parent:  { label: 'Orang Tua',  icon: Heart,         accent: 'from-accent-purple to-primary-700' },
  admin:   { label: 'Admin',      icon: ShieldCheck,   accent: 'from-text-secondary to-primary-950' },
}

const COACH_DIVISIONS: Array<{ value: CoachDivision; label: string; icon: LucideIcon }> = [
  { value: 'research',     label: 'Research',     icon: Microscope },
  { value: 'paper',        label: 'Paper',        icon: FileText },
  { value: 'presentation', label: 'Presentation', icon: Presentation },
  { value: 'marketing',    label: 'Marketing',    icon: Megaphone },
  { value: 'admin',        label: 'Admin',        icon: Shield },
  { value: 'intern',       label: 'Intern',       icon: GraduationCap },
]

/* ─── Schemas ──────────────────────────────────────────────────────────── */

const baseSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone:     z.string().min(10, 'Nomor HP tidak valid').optional().or(z.literal('')),
})
type BaseForm = z.infer<typeof baseSchema>

const coachSchema = z.object({
  division:   z.enum(['admin', 'research', 'paper', 'presentation', 'marketing', 'intern']),
  work_email: z.string().email('Email tidak valid').optional().or(z.literal('')),
})
type CoachForm = z.infer<typeof coachSchema>

const studentSchema = z.object({
  nisn:       z.string().optional().or(z.literal('')),
  grade:      z.string().optional().or(z.literal('')),
  major:      z.string().optional().or(z.literal('')),
  npsn:       z.string().optional().or(z.literal('')),
  age:        z.string().optional().or(z.literal('')),
  info_email: z.string().email('Email tidak valid').optional().or(z.literal('')),
})
type StudentForm = z.infer<typeof studentSchema>

const passwordSchema = z.object({
  new_password: z.string().min(6, 'Min 6 karakter'),
  confirm:      z.string().min(6, 'Min 6 karakter'),
}).refine((d) => d.new_password === d.confirm, {
  path: ['confirm'],
  message: 'Konfirmasi tidak cocok',
})
type PasswordForm = z.infer<typeof passwordSchema>

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function ProfilePage() {
  const { user, profile, setProfile } = useAuthStore()
  const role = (profile?.role ?? 'student') as UserRole
  const meta = ROLE_META[role]
  const RoleIcon = meta.icon

  const { data: serverProfile, isLoading: profileLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const signOut = useSignOut()

  const { data: coachData } = useCoachProfile()
  const { data: studentData } = useStudentProfile()

  const [photoUploading, setPhotoUploading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])

  /* ── Universal form (name + phone) ─────────────────────────────────── */
  const baseForm = useForm<BaseForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: { full_name: '', phone: '' },
  })

  useEffect(() => {
    if (!serverProfile) return
    baseForm.reset({
      full_name: serverProfile.full_name ?? '',
      phone:     serverProfile.phone ?? '',
    })
  }, [serverProfile, baseForm])

  const saveBase = async (data: BaseForm) => {
    try {
      await updateProfile.mutateAsync({
        full_name: data.full_name,
        phone:     data.phone || null,
      })
      // Sync auth store
      if (serverProfile) setProfile({ ...serverProfile, full_name: data.full_name, phone: data.phone || null })
      toast({ title: 'Data dasar tersimpan' })
    } catch (err) {
      toast({ title: 'Gagal simpan', description: errMsg(err), variant: 'destructive' })
    }
  }

  /* ── Photo upload ──────────────────────────────────────────────────── */
  const handlePhotoUpload = async (file: File) => {
    if (!user) return
    setPhotoUploading(true)
    try {
      const path = `avatars/${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { error: upErr } = await supabase.storage.from('session-docs').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('session-docs').getPublicUrl(path)
      const url = pub.publicUrl

      await updateProfile.mutateAsync({ photo_url: url })
      if (serverProfile) setProfile({ ...serverProfile, photo_url: url })
      toast({ title: 'Foto profil diperbarui' })
    } catch (err) {
      toast({ title: 'Gagal upload foto', description: errMsg(err), variant: 'destructive' })
    } finally {
      setPhotoUploading(false)
    }
  }

  const handlePhotoClear = async () => {
    try {
      await updateProfile.mutateAsync({ photo_url: null })
      if (serverProfile) setProfile({ ...serverProfile, photo_url: null })
      toast({ title: 'Foto dihapus' })
    } catch (err) {
      toast({ title: 'Gagal hapus foto', description: errMsg(err), variant: 'destructive' })
    }
  }

  /* ── Coach form ────────────────────────────────────────────────────── */
  const coachForm = useForm<CoachForm>({
    resolver: zodResolver(coachSchema),
    defaultValues: { division: 'research', work_email: '' },
  })

  useEffect(() => {
    if (!coachData) return
    coachForm.reset({
      division: (coachData.division ?? 'research') as CoachDivision,
      work_email: coachData.work_email ?? '',
    })
    setSkills((coachData.coach_skills ?? []).map((s) => s.skill))
  }, [coachData, coachForm])

  const saveCoach = async (data: CoachForm) => {
    if (!coachData) return
    try {
      const { error } = await supabase
        .from('coaches')
        .update({ division: data.division, work_email: data.work_email || null })
        .eq('id', coachData.id)
      if (error) throw error

      // Sync skills (replace-all)
      const { error: delErr } = await supabase.from('coach_skills').delete().eq('coach_id', coachData.id)
      if (delErr) throw delErr
      if (skills.length > 0) {
        const { error: insErr } = await supabase
          .from('coach_skills')
          .insert(skills.map((skill) => ({ coach_id: coachData.id, skill })))
        if (insErr) throw insErr
      }

      toast({ title: 'Data pembimbing tersimpan' })
    } catch (err) {
      toast({ title: 'Gagal simpan', description: errMsg(err), variant: 'destructive' })
    }
  }

  /* ── Student form ──────────────────────────────────────────────────── */
  const studentForm = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { nisn: '', grade: '', major: '', npsn: '', age: '', info_email: '' },
  })

  useEffect(() => {
    if (!studentData) return
    studentForm.reset({
      nisn:       studentData.nisn ?? '',
      grade:      studentData.grade ?? '',
      major:      studentData.major ?? '',
      npsn:       studentData.npsn ?? '',
      age:        studentData.age != null ? String(studentData.age) : '',
      info_email: studentData.info_email ?? '',
    })
  }, [studentData, studentForm])

  const saveStudent = async (data: StudentForm) => {
    if (!studentData) return
    try {
      const { error } = await supabase
        .from('students')
        .update({
          nisn:       data.nisn || null,
          grade:      data.grade || null,
          major:      data.major || null,
          npsn:       data.npsn || null,
          age:        data.age ? Number(data.age) : null,
          info_email: data.info_email || null,
        })
        .eq('id', studentData.id)
      if (error) throw error
      toast({ title: 'Data murid tersimpan' })
    } catch (err) {
      toast({ title: 'Gagal simpan', description: errMsg(err), variant: 'destructive' })
    }
  }

  /* ── Password ──────────────────────────────────────────────────────── */
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: '', confirm: '' },
  })

  const savePassword = async (data: PasswordForm) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.new_password })
      if (error) throw error
      toast({ title: 'Password diperbarui' })
      passwordForm.reset({ new_password: '', confirm: '' })
    } catch (err) {
      toast({ title: 'Gagal update password', description: errMsg(err), variant: 'destructive' })
    }
  }

  return (
    <DashboardLayout
      title="Profil Saya"
      subtitle="Atur foto, identitas, dan kata sandi"
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <PhotoUpload
                value={serverProfile?.photo_url ?? null}
                onFileSelect={handlePhotoUpload}
                onClear={serverProfile?.photo_url ? handlePhotoClear : undefined}
                shape="circle"
                size={104}
                uploading={photoUploading}
                hint="Klik untuk ganti / tarik file ke sini"
              />
              <div className="min-w-0 flex-1">
                <div className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 mb-2 text-[10px] uppercase tracking-[0.14em] font-bold text-white bg-gradient-to-br',
                  meta.accent,
                )}>
                  <RoleIcon className="h-3 w-3" />
                  {meta.label}
                </div>
                {profileLoading ? (
                  <Skeleton className="h-7 w-48" />
                ) : (
                  <h2 className="text-2xl font-extrabold text-text-primary leading-tight">
                    {serverProfile?.full_name ?? 'Pengguna'}
                  </h2>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
                  {user?.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                  )}
                  {serverProfile?.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {serverProfile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Data dasar ──────────────────────────────────────────── */}
        <FormCard
          icon={UserIcon}
          title="Data Dasar"
          subtitle="Nama dan kontak yang ditampilkan ke pengguna lain."
          onSubmit={baseForm.handleSubmit(saveBase)}
          submitting={updateProfile.isPending && !photoUploading}
        >
          <Field label="Nama lengkap" error={baseForm.formState.errors.full_name?.message}>
            <Input {...baseForm.register('full_name')} placeholder="Nama lengkap" />
          </Field>
          <Field label="Nomor HP / WhatsApp" error={baseForm.formState.errors.phone?.message}>
            <Input {...baseForm.register('phone')} placeholder="08xxxxxxxxxx" />
          </Field>
        </FormCard>

        {/* ── Role-specific ───────────────────────────────────────── */}
        {role === 'coach' && coachData && (
          <FormCard
            icon={GraduationCap}
            title="Data Pembimbing"
            subtitle="Divisi, email kerja, dan keahlian."
            onSubmit={coachForm.handleSubmit(saveCoach)}
            submitting={coachForm.formState.isSubmitting}
          >
            <Field label="Divisi" error={coachForm.formState.errors.division?.message}>
              <Select
                value={coachForm.watch('division')}
                onValueChange={(v) => coachForm.setValue('division', v as CoachDivision, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COACH_DIVISIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Email kerja (opsional)" error={coachForm.formState.errors.work_email?.message}>
              <Input type="email" {...coachForm.register('work_email')} placeholder="coach@bki.org" />
            </Field>
            <Field label="Keahlian" hint="Pisah dengan Enter atau koma. Min 1 huruf per tag.">
              <TagInput value={skills} onChange={setSkills} placeholder="Tambah keahlian…" />
            </Field>
          </FormCard>
        )}

        {role === 'student' && studentData && (
          <FormCard
            icon={UsersIcon}
            title="Data Murid"
            subtitle="Informasi akademik dan kontak alternatif."
            onSubmit={studentForm.handleSubmit(saveStudent)}
            submitting={studentForm.formState.isSubmitting}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="NISN">
                <Input {...studentForm.register('nisn')} placeholder="Nomor Induk Siswa" />
              </Field>
              <Field label="NPSN Sekolah">
                <Input {...studentForm.register('npsn')} placeholder="Kode sekolah" />
              </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Kelas">
                <Input {...studentForm.register('grade')} placeholder="12" />
              </Field>
              <Field label="Jurusan">
                <Input {...studentForm.register('major')} placeholder="IPA / IPS" />
              </Field>
              <Field label="Usia">
                <Input type="number" {...studentForm.register('age')} placeholder="17" />
              </Field>
            </div>
            <Field label="Email info lomba" error={studentForm.formState.errors.info_email?.message}>
              <Input type="email" {...studentForm.register('info_email')} placeholder="email@gmail.com" />
            </Field>
          </FormCard>
        )}

        {/* ── Password ────────────────────────────────────────────── */}
        <FormCard
          icon={Lock}
          title="Ubah Password"
          subtitle="Minimal 6 karakter. Lo bakal tetap login setelah ganti."
          onSubmit={passwordForm.handleSubmit(savePassword)}
          submitting={passwordForm.formState.isSubmitting}
          submitLabel="Ganti Password"
        >
          <Field label="Password baru" error={passwordForm.formState.errors.new_password?.message}>
            <Input type="password" autoComplete="new-password" {...passwordForm.register('new_password')} />
          </Field>
          <Field label="Konfirmasi password" error={passwordForm.formState.errors.confirm?.message}>
            <Input type="password" autoComplete="new-password" {...passwordForm.register('confirm')} />
          </Field>
        </FormCard>

        {/* ── Sign out ────────────────────────────────────────────── */}
        <Card className="border-accent-red/20">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text-primary">Keluar dari akun</p>
              <p className="text-xs text-text-tertiary mt-0.5">Sesi akan dihapus dari device ini.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="border-accent-red/30 text-accent-red hover:bg-accent-red/5 hover:text-accent-red"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

/* ─── Building blocks ──────────────────────────────────────────────────── */

interface FormCardProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  onSubmit: (e: React.FormEvent) => void
  submitting?: boolean
  submitLabel?: string
  children: React.ReactNode
}
function FormCard({ icon: Icon, title, subtitle, onSubmit, submitting, submitLabel = 'Simpan Perubahan', children }: FormCardProps) {
  return (
    <Card>
      <CardContent className="p-6 sm:p-7">
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-surface-100">
          <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="gap-1.5">
              <Save className="h-4 w-4" />
              {submitting ? 'Menyimpan…' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}
function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className={cn('text-xs', error && 'text-danger')}>{label}</Label>
      {children}
      {hint && !error && <p className="text-[11px] text-text-tertiary">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : 'Terjadi kesalahan'
}
