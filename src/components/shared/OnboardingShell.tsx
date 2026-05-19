import { Link } from 'react-router-dom'
import { Heart, Users, ShieldCheck, GraduationCap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

const ROLE_META: Record<UserRole, {
  label: string; icon: LucideIcon;
  accent: string; tagline: string;
}> = {
  coach:   { label: 'Pembimbing', icon: GraduationCap, accent: 'from-primary-500 to-primary-700',   tagline: 'Lengkapi profilmu untuk mulai membimbing.' },
  student: { label: 'Murid',      icon: Users,         accent: 'from-accent-teal to-primary-600',    tagline: 'Beberapa data biar pembimbing kenal kamu.' },
  parent:  { label: 'Orang Tua',  icon: Heart,         accent: 'from-accent-purple to-primary-700',  tagline: 'Pantau perkembangan anakmu lewat satu dashboard.' },
  admin:   { label: 'Admin',      icon: ShieldCheck,   accent: 'from-text-secondary to-primary-950', tagline: 'Akses penuh ke seluruh sistem BKI.' },
}

interface OnboardingShellProps {
  role: UserRole
  title: string
  description: string
  /** Optional stepper rendered above the form. */
  stepper?: React.ReactNode
  children: React.ReactNode
  /** Right-side decorative content. Defaults to brand panel. */
  rightPanel?: React.ReactNode
}

export function OnboardingShell({ role, title, description, stepper, children, rightPanel }: OnboardingShellProps) {
  const meta = ROLE_META[role]
  const Icon = meta.icon

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_440px] bg-surface-50">
      {/* ── Form side ─────────────────────────────────── */}
      <main className="flex flex-col min-h-screen px-6 sm:px-10 lg:px-16 py-10 lg:py-14">
        <Link to="/" className="inline-block self-start group mb-10 leading-tight">
          <p className="font-extrabold text-text-primary tracking-tight group-hover:text-primary-700 transition-colors">BKI</p>
          <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-text-tertiary">
            Bimbingan Karya Ilmiah
          </p>
        </Link>

        <div className="flex-1 max-w-2xl mx-auto w-full">
          <div className={cn(
            'inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 mb-6 shadow-soft',
          )}>
            <span className={cn('h-1.5 w-1.5 rounded-full bg-gradient-to-br', meta.accent)} />
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-text-secondary">
              Onboarding {meta.label}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight mb-2">
            {title}
          </h1>
          <p className="text-base text-text-secondary mb-8 leading-relaxed">{description}</p>

          {stepper && <div className="mb-8">{stepper}</div>}

          {children}
        </div>

        <p className="mt-12 text-xs text-text-tertiary self-start">
          © {new Date().getFullYear()} BKI · Data tersimpan aman di Supabase
        </p>
      </main>

      {/* ── Brand panel (hidden < lg) ─────────────────── */}
      <aside className="hidden lg:flex relative flex-col justify-between p-12 bg-primary-950 text-white overflow-hidden">
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
          <div className="flex items-center gap-3 mb-1">
            <div className={cn('h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg', meta.accent)}>
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-white/60">Halo,</p>
              <p className="font-bold text-lg">{meta.label}!</p>
            </div>
          </div>
        </div>

        <div className="relative">
          {rightPanel ?? (
            <>
              <h2 className="text-3xl font-extrabold leading-tight mb-4">{meta.tagline}</h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-sm">
                Setelah ini, kamu masuk ke dashboard yang dirancang khusus untuk peran {meta.label.toLowerCase()}.
              </p>
            </>
          )}
        </div>

        <p className="relative text-xs text-white/40">Data hanya dilihat oleh tim BKI dan diri kamu sendiri.</p>
      </aside>
    </div>
  )
}
