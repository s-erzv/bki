import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Copy, Check, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/database'

type CoachDivision = 'admin' | 'research' | 'paper' | 'presentation' | 'marketing' | 'intern'

const COACH_DIVISIONS: Array<{ value: CoachDivision; label: string }> = [
  { value: 'admin',        label: 'Admin' },
  { value: 'research',     label: 'Research' },
  { value: 'paper',        label: 'Paper' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'marketing',    label: 'Marketing' },
  { value: 'intern',       label: 'Intern' },
]

const ROLE_LABELS: Record<UserRole, string> = {
  coach: 'Pembimbing', student: 'Murid', parent: 'Orang Tua', admin: 'Admin',
}

const schema = z.object({
  email:     z.string().email('Email tidak valid'),
  password:  z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  role:      z.enum(['coach', 'student', 'parent', 'admin']),
  phone:     z.string().optional(),
  // Coach
  division:   z.enum(['admin', 'research', 'paper', 'presentation', 'marketing', 'intern']).optional(),
  work_email: z.string().email('Email kerja tidak valid').optional().or(z.literal('')),
  // Student
  nisn:       z.string().optional(),
  grade:      z.string().optional(),
  major:      z.string().optional(),
  npsn:       z.string().optional(),
  age:        z.string().optional(),  // form sends string, we coerce later
  interests:  z.string().optional(),
  info_email: z.string().email('Email info tidak valid').optional().or(z.literal('')),
}).refine((d) => d.role !== 'coach' || !!d.division, {
  message: 'Coach wajib pilih division',
  path: ['division'],
})
type FormData = z.infer<typeof schema>

interface CreatedCredentials {
  email: string
  password: string
  role: UserRole
  full_name: string
}

function generatePassword(): string {
  // Friendly password: 3 letters + 4 digits + 1 special. Easy enough to type/share.
  const letters = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const specials = '!@#$%'
  const pick = (chars: string, n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return pick(letters, 3) + pick(digits, 4) + pick(specials, 1)
}

export function AdminCreateUser() {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'email' | 'password' | 'both' | null>(null)
  const [lastCreated, setLastCreated] = useState<CreatedCredentials | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'student',
      password: generatePassword(),
    },
  })
  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      // Build payload — only include role-specific fields if relevant.
      const payload: Record<string, unknown> = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        full_name: data.full_name.trim(),
        role: data.role,
        phone: data.phone?.trim() || null,
      }
      if (data.role === 'coach') {
        payload.division = data.division
        payload.work_email = data.work_email || null
      } else if (data.role === 'student') {
        payload.nisn = data.nisn || null
        payload.grade = data.grade || null
        payload.major = data.major || null
        payload.npsn = data.npsn || null
        payload.age = data.age ? Number(data.age) : null
        payload.interests = data.interests || null
        payload.info_email = data.info_email || null
      }

      const { data: resp, error } = await supabase.functions.invoke('admin-create-user', {
        body: payload,
      })
      if (error) {
        // supabase.functions.invoke returns a FunctionsHttpError; try to extract body
        const msg = (await tryReadError(error)) ?? error.message
        throw new Error(msg)
      }
      if (resp?.error) throw new Error(resp.error)

      setLastCreated({
        email: payload.email as string,
        password: data.password,
        role: data.role,
        full_name: data.full_name,
      })
      toast({ title: 'Akun berhasil dibuat', description: `${data.full_name} (${ROLE_LABELS[data.role]})` })
      reset({ role: data.role, password: generatePassword() })
    } catch (err) {
      toast({
        title: 'Gagal buat akun',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string, key: 'email' | 'password' | 'both') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast({ title: 'Gagal copy', variant: 'destructive' })
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* ── Form ──────────────────────────────────────── */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Tambah Akun Baru
          </CardTitle>
          <p className="text-sm text-text-secondary">
            Bikin akun lengkap (auth + profil + role) sekaligus. User langsung bisa login pakai email & password yang lo set.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role <span className="text-danger">*</span></Label>
              <Select value={role} onValueChange={(v) => setValue('role', v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Pembimbing (Coach)</SelectItem>
                  <SelectItem value="student">Murid (Student)</SelectItem>
                  <SelectItem value="parent">Orang Tua (Parent)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Identity */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nama Lengkap <span className="text-danger">*</span></Label>
                <Input placeholder="Nama lengkap" {...register('full_name')} />
                {errors.full_name && <p className="text-xs text-danger">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nomor HP / WhatsApp</Label>
                <Input placeholder="08xxxxxxxxxx" {...register('phone')} />
              </div>
            </div>

            {/* Credentials */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-4">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Kredensial Login</p>
              <div className="space-y-1.5">
                <Label>Email <span className="text-danger">*</span></Label>
                <Input type="email" placeholder="user@example.com" autoComplete="off" {...register('email')} />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Password <span className="text-danger">*</span></Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setValue('password', generatePassword(), { shouldValidate: true })}
                    title="Generate password baru"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
                <p className="text-xs text-text-tertiary">Catat password ini sebelum submit — bakal di-share ke user untuk login pertama.</p>
              </div>
            </div>

            {/* Role-specific fields */}
            {role === 'coach' && (
              <div className="rounded-lg border border-primary-200 bg-primary-50/30 p-4 space-y-4">
                <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">Data Pembimbing</p>
                <div className="space-y-1.5">
                  <Label>Division <span className="text-danger">*</span></Label>
                  <Select value={watch('division') ?? ''} onValueChange={(v) => setValue('division', v as CoachDivision, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Pilih division..." /></SelectTrigger>
                    <SelectContent>
                      {COACH_DIVISIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.division && <p className="text-xs text-danger">{errors.division.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email Kerja</Label>
                  <Input type="email" placeholder="coach@bki.org" {...register('work_email')} />
                  {errors.work_email && <p className="text-xs text-danger">{errors.work_email.message}</p>}
                </div>
              </div>
            )}

            {role === 'student' && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 p-4 space-y-4">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Data Murid</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>NISN</Label>
                    <Input placeholder="Nomor Induk Siswa" {...register('nisn')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>NPSN Sekolah</Label>
                    <Input placeholder="Kode sekolah" {...register('npsn')} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Kelas</Label>
                    <Input placeholder="12" {...register('grade')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Jurusan</Label>
                    <Input placeholder="IPA / IPS" {...register('major')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Usia</Label>
                    <Input type="number" placeholder="17" {...register('age')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Email Info Lomba</Label>
                  <Input type="email" placeholder="email@gmail.com" {...register('info_email')} />
                  {errors.info_email && <p className="text-xs text-danger">{errors.info_email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Minat</Label>
                  <Input placeholder="Biologi, kimia, ..." {...register('interests')} />
                </div>
              </div>
            )}

            {role === 'parent' && (
              <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4 text-sm text-text-secondary">
                Tidak ada data tambahan untuk parent. Setelah akun jadi, link ke murid via menu <strong>Relasi Anak</strong>.
              </div>
            )}

            {role === 'admin' && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-4 text-sm text-text-secondary">
                Admin punya akses penuh ke semua data & manajemen sistem. Pastikan orang ini bener-bener perlu akses admin.
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? 'Membuat akun...' : (<><UserPlus className="h-4 w-4 mr-2" /> Buat Akun</>)}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Last created credentials ──────────────────── */}
      <div className="space-y-4">
        {lastCreated ? (
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="text-base text-green-900">Akun Terakhir Dibuat</CardTitle>
              <p className="text-xs text-green-700">Share kredensial di bawah ke user untuk login pertama.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-text-tertiary mb-1">Nama</p>
                <p className="font-medium">{lastCreated.full_name} <span className="text-text-tertiary text-xs">({ROLE_LABELS[lastCreated.role]})</span></p>
              </div>
              <CopyRow label="Email" value={lastCreated.email} copied={copied === 'email'} onCopy={() => copyToClipboard(lastCreated.email, 'email')} />
              <CopyRow label="Password" value={lastCreated.password} copied={copied === 'password'} onCopy={() => copyToClipboard(lastCreated.password, 'password')} mono />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => copyToClipboard(
                  `Akun BKI lo udah siap.\nEmail: ${lastCreated.email}\nPassword: ${lastCreated.password}\nLogin di: ${window.location.origin}/login`,
                  'both',
                )}
              >
                {copied === 'both' ? <><Check className="h-4 w-4 mr-2" /> Tersalin!</> : <><Copy className="h-4 w-4 mr-2" /> Copy pesan untuk user</>}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-text-tertiary">
              Setelah akun dibuat, kredensial akan tampil di sini.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Catatan</CardTitle></CardHeader>
          <CardContent className="text-xs text-text-secondary space-y-2">
            <p>• Email sudah auto-confirmed — user gak perlu klik link verifikasi.</p>
            <p>• User langsung bisa login & langsung masuk dashboard sesuai role (skip onboarding).</p>
            <p>• Password bisa di-reset user lewat halaman login → "Lupa password".</p>
            <p>• Kalau bikin coach, jangan lupa pilih division-nya.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CopyRow({ label, value, copied, onCopy, mono }: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-text-tertiary mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className={`flex-1 px-3 py-2 rounded-md bg-white border border-surface-200 text-sm truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </code>
        <Button variant="outline" size="icon" onClick={onCopy} className="h-9 w-9 flex-shrink-0">
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

async function tryReadError(err: unknown): Promise<string | null> {
  // supabase-js v2's FunctionsHttpError exposes context.response (a Fetch Response)
  const ctx = (err as { context?: { response?: Response } })?.context
  if (!ctx?.response) return null
  try {
    const body = await ctx.response.clone().json()
    return body?.error ?? null
  } catch {
    return null
  }
}
