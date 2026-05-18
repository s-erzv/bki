import { Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { formatWIB } from '@/lib/utils'
import type { UserRole } from '@/types/database'

const ROLE_LABEL: Record<UserRole, string> = {
  coach:   'Pembimbing',
  student: 'Murid',
  parent:  'Orang Tua',
  admin:   'Admin',
}

const ROLE_ACCENT: Record<UserRole, string> = {
  coach:   'from-primary-500 to-primary-700',
  student: 'from-accent-teal to-primary-600',
  parent:  'from-accent-purple to-primary-700',
  admin:   'from-text-secondary to-primary-950',
}

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { profile } = useAuthStore()
  const role = profile?.role ?? 'student'
  const today = new Date()

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-surface-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="min-w-0">
        <h1 className="text-base font-bold text-text-primary truncate">{title}</h1>
        {subtitle && <p className="text-xs text-text-tertiary truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {actions}

        <div className="hidden md:block text-right border-r border-surface-200 pr-4 mr-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">Hari ini</p>
          <p className="text-xs font-semibold text-text-primary tabular-nums">{formatWIB(today.toISOString(), 'EEEE, d MMM yyyy')}</p>
        </div>

        <button className="relative p-2 rounded-lg text-text-secondary hover:bg-surface-50 hover:text-text-primary transition-colors" aria-label="Notifikasi">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent-red ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5">
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-surface-100" />
          ) : (
            <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${ROLE_ACCENT[role]} flex items-center justify-center text-white text-sm font-bold shadow-soft`}>
              {(profile?.full_name ?? 'U').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-tight truncate max-w-[12rem]">{profile?.full_name ?? 'Pengguna'}</p>
            <p className="text-[11px] text-text-tertiary leading-tight">{ROLE_LABEL[role]}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
