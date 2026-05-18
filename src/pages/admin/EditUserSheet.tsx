import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  GraduationCap, Users as UsersIcon, Heart, ShieldCheck, Mail, Phone,
  Microscope, FileText, Presentation, Megaphone, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { Profile, UserRole, CoachDivision } from '@/types/database'

const ROLE_META: Record<UserRole, { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  coach:   { label: 'Pembimbing', icon: GraduationCap, accent: 'from-primary-500 to-primary-700' },
  student: { label: 'Murid',      icon: UsersIcon,     accent: 'from-accent-teal to-primary-600' },
  parent:  { label: 'Orang Tua',  icon: Heart,         accent: 'from-accent-purple to-primary-700' },
  admin:   { label: 'Admin',      icon: ShieldCheck,   accent: 'from-text-secondary to-primary-950' },
}

const DIVISIONS: Array<{ value: CoachDivision; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: 'research',     label: 'Research',     icon: Microscope },
  { value: 'paper',        label: 'Paper',        icon: FileText },
  { value: 'presentation', label: 'Presentation', icon: Presentation },
  { value: 'marketing',    label: 'Marketing',    icon: Megaphone },
  { value: 'admin',        label: 'Admin',        icon: Shield },
  { value: 'intern',       label: 'Intern',       icon: GraduationCap },
]

const schema = z.object({
  // Common (profiles)
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone:     z.string().optional(),
  // Coach
  division:   z.enum(['admin', 'research', 'paper', 'presentation', 'marketing', 'intern']).optional(),
  work_email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  // Student
  grade:      z.string().optional(),
  major:      z.string().optional(),
  nisn:       z.string().optional(),
  npsn:       z.string().optional(),
  age:        z.string().optional(),
  info_email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  interests:  z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface EditUserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile | null
}

interface CoachRow { id: string; division: CoachDivision; work_email: string | null }
interface StudentRow {
  id: string; grade: string | null; major: string | null; nisn: string | null
  npsn: string | null; age: number | null; info_email: string | null; interests: string | null
}

export function EditUserSheet({ open, onOpenChange, profile }: EditUserSheetProps) {
  const qc = useQueryClient()
  const role = profile?.role

  /* ── Fetch role-specific row ───────────────────────── */
  const { data: roleRow, isLoading: roleLoading } = useQuery<CoachRow | StudentRow | { id: string } | null>({
    queryKey: ['admin_edit_role_row', profile?.id, role],
    queryFn: async () => {
      if (!profile || !role) return null
      if (role === 'coach') {
        const { data, error } = await supabase
          .from('coaches')
          .select('id, division, work_email')
          .eq('profile_id', profile.id)
          .maybeSingle()
        if (error) throw error
        return (data as CoachRow | null) ?? null
      }
      if (role === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('id, grade, major, nisn, npsn, age, info_email, interests')
          .eq('profile_id', profile.id)
          .maybeSingle()
        if (error) throw error
        return (data as StudentRow | null) ?? null
      }
      if (role === 'parent') {
        const { data, error } = await supabase
          .from('parents')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle()
        if (error) throw error
        return (data as { id: string } | null) ?? null
      }
      return null
    },
    enabled: open && !!profile,
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Reset form whenever profile or roleRow changes (i.e. sheet opened on a new user).
  useEffect(() => {
    if (!open || !profile) return
    reset({
      full_name: profile.full_name ?? '',
      phone:     profile.phone ?? '',
      ...(role === 'coach' && roleRow && 'division' in roleRow ? {
        division: roleRow.division,
        work_email: roleRow.work_email ?? '',
      } : {}),
      ...(role === 'student' && roleRow && 'grade' in roleRow ? {
        grade:      roleRow.grade      ?? '',
        major:      roleRow.major      ?? '',
        nisn:       roleRow.nisn       ?? '',
        npsn:       roleRow.npsn       ?? '',
        age:        roleRow.age != null ? String(roleRow.age) : '',
        info_email: roleRow.info_email ?? '',
        interests:  roleRow.interests  ?? '',
      } : {}),
    })
  }, [open, profile, roleRow, role, reset])

  const division = watch('division')

  /* ── Mutation ──────────────────────────────────────── */
  const save = useMutation({
    mutationFn: async (data: FormData) => {
      if (!profile || !role) return

      // 1. Update profiles row
      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
        })
        .eq('id', profile.id)
      if (pErr) throw new Error(`Update profile: ${pErr.message}`)

      // 2. Upsert role-specific row
      if (role === 'coach') {
        if (!data.division) throw new Error('Division wajib untuk coach')
        const { error } = await supabase
          .from('coaches')
          .upsert(
            {
              profile_id: profile.id,
              division: data.division,
              work_email: data.work_email || null,
            },
            { onConflict: 'profile_id' },
          )
        if (error) throw new Error(`Update coach: ${error.message}`)
      } else if (role === 'student') {
        const { error } = await supabase
          .from('students')
          .upsert(
            {
              profile_id: profile.id,
              grade:      data.grade      || null,
              major:      data.major      || null,
              nisn:       data.nisn       || null,
              npsn:       data.npsn       || null,
              age:        data.age ? Number(data.age) : null,
              info_email: data.info_email || null,
              interests:  data.interests  || null,
            },
            { onConflict: 'profile_id' },
          )
        if (error) throw new Error(`Update student: ${error.message}`)
      } else if (role === 'parent') {
        // Ensure parent row exists (no extra editable fields).
        const { error } = await supabase
          .from('parents')
          .upsert({ profile_id: profile.id }, { onConflict: 'profile_id' })
        if (error) throw new Error(`Update parent: ${error.message}`)
      }
      // role === 'admin': no extra row.
    },
    onSuccess: () => {
      toast({ title: 'Akun diperbarui' })
      qc.invalidateQueries({ queryKey: ['admin_users_list'] })
      qc.invalidateQueries({ queryKey: ['admin_recent_profiles'] })
      qc.invalidateQueries({ queryKey: ['admin_edit_role_row'] })
      onOpenChange(false)
    },
    onError: (err) => {
      toast({
        title: 'Gagal simpan',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    },
  })

  if (!profile || !role) return null
  const meta = ROLE_META[role]
  const Icon = meta.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          {/* Header chip */}
          <div className="flex items-center gap-3 mb-3">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="" className="h-11 w-11 rounded-xl object-cover" />
            ) : (
              <div className={cn('h-11 w-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-bold shadow-soft', meta.accent)}>
                {(profile.full_name ?? 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-text-tertiary inline-flex items-center gap-1">
                <Icon className="h-3 w-3" /> {meta.label}
              </p>
              <p className="text-sm font-bold text-text-primary truncate">{profile.full_name}</p>
            </div>
          </div>
          <SheetTitle>Edit Akun</SheetTitle>
          <p className="text-xs text-text-tertiary mt-1">
            Mengubah data di tabel <code className="text-[10px] bg-surface-100 px-1.5 py-0.5 rounded">profiles</code>
            {role !== 'admin' && (
              <> & <code className="text-[10px] bg-surface-100 px-1.5 py-0.5 rounded">{role === 'coach' ? 'coaches' : role === 'student' ? 'students' : 'parents'}</code></>
            )}.
          </p>
        </SheetHeader>

        <SheetBody>
          {roleLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <form id="edit-user-form" onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-6">
              {/* ── Profile (common) ──────────────────── */}
              <Section title="Data Profil" subtitle="Tersimpan di profiles">
                <Field label="Nama lengkap" error={errors.full_name?.message}>
                  <Input {...register('full_name')} />
                </Field>
                <Field label="Nomor HP / WhatsApp" hint="Untuk notifikasi WA dari sistem.">
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                    <Input className="pl-9" placeholder="08xxxxxxxxxx" {...register('phone')} />
                  </div>
                </Field>
              </Section>

              {/* ── Role-specific ──────────────────────── */}
              {role === 'coach' && (
                <Section title="Data Pembimbing" subtitle="Tersimpan di coaches">
                  <Field label="Divisi" error={errors.division?.message}>
                    <div className="grid grid-cols-2 gap-2">
                      {DIVISIONS.map((d) => {
                        const selected = division === d.value
                        const DIcon = d.icon
                        return (
                          <button
                            type="button"
                            key={d.value}
                            onClick={() => setValue('division', d.value, { shouldValidate: true })}
                            className={cn(
                              'flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all',
                              selected
                                ? 'border-primary-500 bg-primary-50/40 shadow-soft'
                                : 'border-surface-200 hover:border-primary-300',
                            )}
                          >
                            <div className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                              selected ? 'bg-primary-600 text-white' : 'bg-surface-100 text-text-secondary',
                            )}>
                              <DIcon className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-xs font-bold text-text-primary leading-tight">{d.label}</p>
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                  <Field label="Email kerja" error={errors.work_email?.message}>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                      <Input className="pl-9" type="email" placeholder="email@bki.org" {...register('work_email')} />
                    </div>
                  </Field>
                </Section>
              )}

              {role === 'student' && (
                <Section title="Data Murid" subtitle="Tersimpan di students">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="NISN">
                      <Input placeholder="Nomor Induk Siswa" {...register('nisn')} />
                    </Field>
                    <Field label="NPSN Sekolah">
                      <Input placeholder="Kode sekolah" {...register('npsn')} />
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Kelas">
                      <Input placeholder="X / XI / XII" {...register('grade')} />
                    </Field>
                    <Field label="Jurusan">
                      <Input placeholder="IPA / IPS" {...register('major')} />
                    </Field>
                    <Field label="Usia">
                      <Input type="number" placeholder="17" {...register('age')} />
                    </Field>
                  </div>
                  <Field label="Email info lomba" error={errors.info_email?.message}>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                      <Input className="pl-9" type="email" placeholder="email@gmail.com" {...register('info_email')} />
                    </div>
                  </Field>
                  <Field label="Minat" hint="Pisahkan dengan koma.">
                    <Input placeholder="biologi, robotik, fotografi…" {...register('interests')} />
                  </Field>
                </Section>
              )}

              {role === 'parent' && (
                <div className="rounded-xl border border-accent-purple/20 bg-accent-purple/5 p-4 text-sm text-text-secondary">
                  <Badge variant="outline" className="text-[10px] mb-2">Parent</Badge>
                  <p>Parent tidak punya data tambahan di luar profil. Untuk mengelola anak yang dipantau, gunakan halaman <strong className="text-text-primary">Relasi Anak</strong>.</p>
                </div>
              )}

              {role === 'admin' && (
                <div className="rounded-xl border border-text-secondary/20 bg-surface-100 p-4 text-sm text-text-secondary">
                  <Badge variant="outline" className="text-[10px] mb-2">Admin</Badge>
                  <p>Admin tidak punya data tambahan. Hanya nama dan kontak yang bisa diedit.</p>
                </div>
              )}
            </form>
          )}
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" form="edit-user-form" disabled={isSubmitting || save.isPending || roleLoading}>
            {save.isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* ─────────────────────────────────────────────────────── */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary-600">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-text-tertiary mt-0.5">
            <code className="font-mono">{subtitle}</code>
          </p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className={cn('text-xs', error && 'text-danger')}>{label}</Label>
      {children}
      {hint && !error && <p className="text-[11px] text-text-tertiary">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
