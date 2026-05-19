import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { GraduationCap, Globe, Mail, ArrowLeft, Sparkles, ShieldCheck, Heart, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useSignInWithGoogle, useSignUpWithGoogle,
  useSignInWithEmail, useSignUpWithEmail,
  dashboardPath, onboardingPath,
} from '@/hooks/useAuth'
import { useAuthStore, metadataRole } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'
import { isSupabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

const ROLE_META: Record<UserRole, { label: string; icon: LucideIcon; accent: string; tagline: string }> = {
  coach:   { label: 'Pembimbing', icon: GraduationCap, accent: 'from-primary-500 to-primary-700',     tagline: 'Bimbing, jadwalkan, laporkan.' },
  student: { label: 'Murid',      icon: Users,         accent: 'from-accent-teal to-primary-600',      tagline: 'Riset & tugas dalam satu pintu.' },
  parent:  { label: 'Orang Tua',  icon: Heart,         accent: 'from-accent-purple to-primary-700',    tagline: 'Pantau perkembangan anakmu.' },
  admin:   { label: 'Admin',      icon: ShieldCheck,   accent: 'from-text-secondary to-primary-950',   tagline: 'Kelola seluruh sistem BKI.' },
}

function readRole(sp: URLSearchParams): UserRole {
  const r = sp.get('role')
  return r === 'coach' || r === 'student' || r === 'parent' || r === 'admin' ? r : 'student'
}

export interface AuthPageProps { mode: 'login' | 'register' }

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register'
  const [searchParams] = useSearchParams()
  const role = readRole(searchParams)
  const meta = ROLE_META[role]

  const [method, setMethod] = useState<null | 'email'>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const { session, profile, onboarded, sessionRestored, user } = useAuthStore()

  const signInGoogle = useSignInWithGoogle()
  const signUpGoogle = useSignUpWithGoogle()
  const signInEmail  = useSignInWithEmail()
  const signUpEmail  = useSignUpWithEmail()

  useEffect(() => {
    if (!sessionRestored || !session) return
    const r = profile?.role ?? metadataRole(user)
    if (!r) return
    if (!onboarded && onboardingPath(r)) navigate(onboardingPath(r)!, { replace: true })
    else navigate(dashboardPath(r), { replace: true })
  }, [session, profile, onboarded, sessionRestored, user, navigate])

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const handleGoogle = async () => {
    if (!isSupabaseConfigured) {
      toast({ title: 'Supabase belum dikonfigurasi', description: 'Isi VITE_SUPABASE_URL di .env', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      if (isRegister) await signUpGoogle(role)
      else await signInGoogle()
    } catch (err) {
      toast({ title: isRegister ? 'Registrasi Gagal' : 'Login Gagal', description: errMsg(err), variant: 'destructive' })
      setBusy(false)
    }
  }

  const handleEmailLogin = async (data: LoginForm) => {
    setBusy(true)
    try { await signInEmail(data.email, data.password) }
    catch (err) {
      toast({ title: 'Login Gagal', description: errMsg(err), variant: 'destructive' })
      setBusy(false)
    }
  }

  const handleEmailRegister = async (data: RegisterForm) => {
    setBusy(true)
    try {
      await signUpEmail(data.email, data.password, role, data.fullName)
      toast({ title: 'Registrasi berhasil!', description: 'Silakan cek email untuk verifikasi.' })
    } catch (err) {
      toast({ title: 'Registrasi Gagal', description: errMsg(err), variant: 'destructive' })
      setBusy(false)
    }
  }

  const Icon = meta.icon

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left: brand panel (hidden on small) ─────────── */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-primary-950 text-white overflow-hidden">
        {/* Decorative gradient mesh */}
        <div className={cn('absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-30 bg-gradient-to-br', meta.accent)} />
        <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary-400/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative">
          <Link to="/" className="inline-block leading-tight group">
            <p className="font-extrabold tracking-tight group-hover:text-white/80 transition-colors">BKI</p>
            <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-white/60">Bimbingan Karya Ilmiah</p>
          </Link>
        </div>

        <div className="relative">
          <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 border bg-white/[0.06] backdrop-blur border-white/[0.15]')}>
            <span className={cn('h-1.5 w-1.5 rounded-full bg-gradient-to-br', meta.accent)} />
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-white/80">{meta.label}</span>
          </div>
          <h2 className="text-5xl font-extrabold tracking-tight leading-[1.05] mb-4">
            {isRegister ? (
              <>Mulai bimbingan,<br/><span className="text-primary-200">satu peran.</span></>
            ) : (
              <>{meta.tagline}</>
            )}
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Semua sesi, tugas, dan laporan tersimpan rapi — terintegrasi Google Calendar, Drive, dan WhatsApp.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            {[
              { v: '500+', l: 'Murid' },
              { v: '40+',  l: 'Tim' },
              { v: '15+',  l: 'Lomba menang' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur p-3">
                <p className="text-2xl font-extrabold tracking-tight tabular-nums">{s.v}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} BKI</p>
      </aside>

      {/* ── Right: form ─────────────────────────────────── */}
      <main className="relative flex items-center justify-center p-6 sm:p-10 bg-surface-50">
        <div className="w-full max-w-md">
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-block leading-tight">
              <p className="font-extrabold text-primary-950 text-lg tracking-tight">BKI</p>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-text-tertiary mt-0.5">
                Bimbingan Karya Ilmiah
              </p>
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-surface-200 shadow-lift p-8 sm:p-10">
            {/* Role chip */}
            <div className="flex items-center gap-3 mb-7">
              <div className={cn('h-11 w-11 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-soft', meta.accent)}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-text-tertiary">
                  {isRegister ? 'Daftar sebagai' : 'Masuk sebagai'}
                </p>
                <p className="font-bold text-text-primary leading-tight">{meta.label}</p>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mb-1">
              {isRegister ? 'Buat akun baru' : 'Selamat datang kembali'}
            </h1>
            <p className="text-sm text-text-secondary mb-7">
              {isRegister ? 'Daftar untuk mulai bimbingan' : 'Masuk untuk lanjut ke dashboard'}
            </p>

            {method === null && (
              <div className="space-y-2.5">
                <Button className="w-full h-11" onClick={handleGoogle} disabled={busy}>
                  <Globe className="h-4 w-4" />
                  {busy ? 'Mengarahkan...' : isRegister ? 'Daftar dengan Google' : 'Masuk dengan Google'}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200" /></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">atau</span></div>
                </div>
                <Button variant="outline" className="w-full h-11" onClick={() => setMethod('email')} disabled={busy}>
                  <Mail className="h-4 w-4" />
                  {isRegister ? 'Daftar dengan Email' : 'Masuk dengan Email'}
                </Button>
              </div>
            )}

            {method === 'email' && (
              isRegister ? (
                <form onSubmit={registerForm.handleSubmit(handleEmailRegister)} className="space-y-4">
                  <Field label="Nama Lengkap" error={registerForm.formState.errors.fullName?.message}>
                    <Input {...registerForm.register('fullName')} placeholder="Nama lengkap kamu" />
                  </Field>
                  <Field label="Email" error={registerForm.formState.errors.email?.message}>
                    <Input type="email" autoComplete="email" placeholder="kamu@example.com" {...registerForm.register('email')} />
                  </Field>
                  <Field label="Password" error={registerForm.formState.errors.password?.message}>
                    <Input type="password" autoComplete="new-password" placeholder="Min. 6 karakter" {...registerForm.register('password')} />
                  </Field>
                  <Field label="Konfirmasi Password" error={registerForm.formState.errors.confirmPassword?.message}>
                    <Input type="password" autoComplete="new-password" placeholder="Ulang password" {...registerForm.register('confirmPassword')} />
                  </Field>
                  <Button type="submit" className="w-full h-11" disabled={busy}>
                    {busy ? 'Memproses...' : 'Buat Akun'}
                  </Button>
                  <button type="button" onClick={() => setMethod(null)} className="w-full text-xs text-text-tertiary hover:text-text-primary transition-colors">
                    ← Pilih cara lain
                  </button>
                </form>
              ) : (
                <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                  <Field label="Email" error={loginForm.formState.errors.email?.message}>
                    <Input type="email" autoComplete="email" placeholder="kamu@example.com" {...loginForm.register('email')} />
                  </Field>
                  <Field label="Password" error={loginForm.formState.errors.password?.message}>
                    <Input type="password" autoComplete="current-password" placeholder="Password kamu" {...loginForm.register('password')} />
                  </Field>
                  <Button type="submit" className="w-full h-11" disabled={busy}>
                    {busy ? 'Memproses...' : 'Masuk'}
                  </Button>
                  <button type="button" onClick={() => setMethod(null)} className="w-full text-xs text-text-tertiary hover:text-text-primary transition-colors">
                    ← Pilih cara lain
                  </button>
                </form>
              )
            )}

            <div className="mt-8 pt-6 border-t border-surface-100 text-center space-y-3">
              <p className="text-sm text-text-secondary">
                {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
                <Link
                  to={isRegister ? `/login?role=${role}` : `/register?role=${role}`}
                  onClick={() => setMethod(null)}
                  className="text-primary-600 font-bold hover:underline"
                >
                  {isRegister ? 'Masuk' : 'Daftar sekarang'}
                </Link>
              </p>
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors">
                <ArrowLeft className="h-3 w-3" /> Ganti Peran
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-text-tertiary flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Dilindungi oleh enkripsi end-to-end Supabase
          </p>
        </div>
      </main>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Terjadi kesalahan'
}
