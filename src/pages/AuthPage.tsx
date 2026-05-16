import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Users, Heart, Shield, Globe, Mail, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useSignInWithGoogle, useSignUpWithGoogle, useSignInWithEmail, useSignUpWithEmail, useRoleRedirectPath } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'
import type { UserRole } from '@/types/database'

/* ── Schemas ─────────────────────────────────────────────── */
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

/* ── Role Cards ──────────────────────────────────────────── */
interface RoleCard {
  role: UserRole
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}

const ROLE_CARDS: RoleCard[] = [
  { role: 'coach',   label: 'Pembimbing', description: 'Kelola tim, kelas, dan tugas murid',     icon: GraduationCap, color: 'text-primary-600', bg: 'bg-primary-50 border-primary-200' },
  { role: 'student', label: 'Murid',      description: 'Pantau progress dan tugas penelitianmu',  icon: Users,         color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200' },
  { role: 'parent',  label: 'Orang Tua',  description: 'Monitor perkembangan anakmu',             icon: Heart,         color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200' },
  { role: 'admin',   label: 'Admin',      description: 'Kelola sistem dan pengguna BKI',          icon: Shield,        color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200' },
]

/* ── Props ───────────────────────────────────────────────── */
export interface AuthPageProps {
  mode: 'login' | 'register'
}

/* ── Component ───────────────────────────────────────────── */
export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register'

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const signInGoogle = useSignInWithGoogle()
  const signUpGoogle = useSignUpWithGoogle()
  const signInEmail  = useSignInWithEmail()
  const signUpEmail  = useSignUpWithEmail()

  const redirectPath = useRoleRedirectPath(profile?.role)

  // Login form
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Register form
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  // Redirect if already logged in
  if (profile) {
    navigate(redirectPath, { replace: true })
    return null
  }

  /* ── Handlers ────────────────────────────────────────── */
  const handleGoogle = async () => {
    setLoading(true)
    try {
      if (isRegister) {
        await signUpGoogle(selectedRole!)
      } else {
        await signInGoogle()
      }
    } catch {
      toast({
        title: isRegister ? 'Registrasi Gagal' : 'Login Gagal',
        description: 'Coba lagi beberapa saat.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  const handleEmailLogin = async (data: LoginForm) => {
    setLoading(true)
    try {
      await signInEmail(data.email, data.password)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Email atau password salah.'
      toast({ title: 'Login Gagal', description: msg, variant: 'destructive' })
      setLoading(false)
    }
  }

  const handleEmailRegister = async (data: RegisterForm) => {
    setLoading(true)
    try {
      await signUpEmail(data.email, data.password, selectedRole!, data.fullName)
      toast({
        title: 'Registrasi Berhasil!',
        description: 'Silahkan cek email untuk verifikasi akun.',
      })
      setLoading(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal registrasi.'
      toast({ title: 'Registrasi Gagal', description: msg, variant: 'destructive' })
      setLoading(false)
    }
  }

  /* ── Labels ──────────────────────────────────────────── */
  const title = isRegister ? 'Daftar Akun Baru' : 'Masuk ke BKI'
  const subtitle = isRegister
    ? 'Pilih peran dan buat akun untuk mulai menggunakan BKI'
    : 'Bimbingan Karya Ilmiah — Platform Riset Akademis Terpadu'
  const roleLabel = ROLE_CARDS.find(r => r.role === selectedRole)?.label
  const actionLabel = isRegister ? 'Daftar' : 'Masuk'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex flex-col items-center justify-center p-6">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-100 opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Logo & tagline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-lg mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">{title}</h1>
          <p className="text-text-secondary">{subtitle}</p>
        </div>

        {/* Role cards — always visible for register, hidden for login */}
        {(isRegister || !isRegister) && (
          <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 mb-8', !isRegister && 'hidden')}>
            {ROLE_CARDS.map((card) => (
              <button
                key={card.role}
                onClick={() => { setSelectedRole(card.role); setAuthMethod(null) }}
                className={cn(
                  'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 text-center',
                  selectedRole === card.role
                    ? `${card.bg} border-current ${card.color} shadow-md scale-105`
                    : 'bg-white border-surface-200 hover:border-surface-300 hover:shadow-sm'
                )}
              >
                <card.icon className={cn('h-8 w-8', selectedRole === card.role ? card.color : 'text-text-tertiary')} />
                <div>
                  <p className={cn('font-semibold text-sm', selectedRole === card.role ? card.color : 'text-text-primary')}>
                    {card.label}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">{card.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Auth panel — show when role selected (register) or always (login) */}
        {(isRegister ? selectedRole : true) && (
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6 max-w-sm mx-auto">
            {isRegister && (
              <p className="text-sm font-medium text-text-secondary text-center mb-4">
                Daftar sebagai <span className="text-text-primary font-semibold">{roleLabel}</span>
              </p>
            )}

            {/* Method selection */}
            {authMethod === null && (
              <div className="space-y-3">
                <Button className="w-full" onClick={() => isRegister ? handleGoogle() : setAuthMethod('google')} disabled={loading}>
                  <Globe className="h-4 w-4" />
                  {isRegister ? (loading ? 'Mengarahkan...' : 'Daftar dengan Google') : 'Masuk dengan Google'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setAuthMethod('email')}>
                  <Mail className="h-4 w-4" />
                  {isRegister ? 'Daftar dengan Email' : 'Masuk dengan Email'}
                </Button>
              </div>
            )}

            {/* Google confirm (login only) */}
            {!isRegister && authMethod === 'google' && (
              <div className="space-y-3">
                <Button className="w-full" onClick={handleGoogle} disabled={loading}>
                  <Globe className="h-4 w-4" />
                  {loading ? 'Mengarahkan...' : 'Lanjut dengan Google'}
                </Button>
                <button onClick={() => setAuthMethod(null)} className="text-xs text-text-tertiary hover:text-text-secondary w-full text-center">← Kembali</button>
              </div>
            )}

            {/* Email form */}
            {authMethod === 'email' && (
              isRegister ? (
                /* ── Register Form ─── */
                <form onSubmit={registerForm.handleSubmit(handleEmailRegister)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input id="fullName" type="text" placeholder="Nama lengkap" {...registerForm.register('fullName')} />
                    {registerForm.formState.errors.fullName && <p className="text-xs text-danger">{registerForm.formState.errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" placeholder="nama@email.com" {...registerForm.register('email')} />
                    {registerForm.formState.errors.email && <p className="text-xs text-danger">{registerForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...registerForm.register('password')}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && <p className="text-xs text-danger">{registerForm.formState.errors.password.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...registerForm.register('confirmPassword')}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && <p className="text-xs text-danger">{registerForm.formState.errors.confirmPassword.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <UserPlus className="h-4 w-4" />
                    {loading ? 'Memproses...' : 'Daftar'}
                  </Button>
                  <button type="button" onClick={() => setAuthMethod(null)} className="text-xs text-text-tertiary hover:text-text-secondary w-full text-center">← Kembali</button>
                </form>
              ) : (
                /* ── Login Form ─── */
                <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="nama@email.com" {...loginForm.register('email')} />
                    {loginForm.formState.errors.email && <p className="text-xs text-danger">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...loginForm.register('password')}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && <p className="text-xs text-danger">{loginForm.formState.errors.password.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <LogIn className="h-4 w-4" />
                    {loading ? 'Memproses...' : 'Masuk'}
                  </Button>
                  <button type="button" onClick={() => setAuthMethod(null)} className="text-xs text-text-tertiary hover:text-text-secondary w-full text-center">← Kembali</button>
                </form>
              )
            )}

            {/* Toggle link */}
            <div className="mt-5 pt-4 border-t border-surface-100 text-center">
              {isRegister ? (
                <p className="text-sm text-text-secondary">
                  Sudah punya akun?{' '}
                  <Link to="/login" className="text-primary-600 font-semibold hover:underline">Masuk</Link>
                </p>
              ) : (
                <p className="text-sm text-text-secondary">
                  Belum punya akun?{' '}
                  <Link to="/register" className="text-primary-600 font-semibold hover:underline">Daftar</Link>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
