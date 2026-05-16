import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Users, Heart, Shield, Globe, Mail, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useSignInWithGoogle, useSignInWithEmail, useRoleRedirectPath } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'
import type { UserRole } from '@/types/database'

const emailSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})
type EmailForm = z.infer<typeof emailSchema>

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

export function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [authMode, setAuthMode] = useState<'google' | 'email' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const signInWithGoogle = useSignInWithGoogle()
  const signInWithEmail = useSignInWithEmail()
  const redirectPath = useRoleRedirectPath(profile?.role)

  const { register, handleSubmit, formState: { errors } } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  })

  // Redirect if already logged in
  if (profile) {
    navigate(redirectPath, { replace: true })
    return null
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await signInWithGoogle(selectedRole!)
    } catch {
      toast({ title: 'Login Gagal', description: 'Coba lagi beberapa saat.', variant: 'destructive' })
      setLoading(false)
    }
  }

  const handleEmailLogin = async (data: EmailForm) => {
    setLoading(true)
    try {
      await signInWithEmail(data.email, data.password, selectedRole!)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Email atau password salah.'
      toast({ title: 'Login Gagal', description: msg, variant: 'destructive' })
      setLoading(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-text-primary mb-2">BKI</h1>
          <p className="text-text-secondary">Bimbingan Karya Ilmiah — Platform Riset Akademis Terpadu</p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {ROLE_CARDS.map((card) => (
            <button
              key={card.role}
              onClick={() => { setSelectedRole(card.role); setAuthMode(null) }}
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

        {/* Auth buttons */}
        {selectedRole && (
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6 max-w-sm mx-auto">
            <p className="text-sm font-medium text-text-secondary text-center mb-4">
              Masuk sebagai <span className="text-text-primary font-semibold">{ROLE_CARDS.find(r => r.role === selectedRole)?.label}</span>
            </p>

            {authMode === null && (
              <div className="space-y-3">
                <Button className="w-full" onClick={() => setAuthMode('google')} disabled={loading}>
                  <Globe className="h-4 w-4" />
                  Masuk dengan Google
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setAuthMode('email')}>
                  <Mail className="h-4 w-4" />
                  Masuk dengan Email
                </Button>
              </div>
            )}

            {authMode === 'google' && (
              <div className="space-y-3">
                <Button className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                  <Globe className="h-4 w-4" />
                  {loading ? 'Mengarahkan...' : 'Lanjut dengan Google'}
                </Button>
                <button onClick={() => setAuthMode(null)} className="text-xs text-text-tertiary hover:text-text-secondary w-full text-center">← Kembali</button>
              </div>
            )}

            {authMode === 'email' && (
              <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="nama@email.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
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
                  {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Memproses...' : 'Masuk'}
                </Button>
                <button type="button" onClick={() => setAuthMode(null)} className="text-xs text-text-tertiary hover:text-text-secondary w-full text-center">← Kembali</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
