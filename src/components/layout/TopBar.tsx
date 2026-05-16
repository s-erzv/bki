import { Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/database'

const ROLE_LABEL: Record<UserRole, string> = {
  coach:   'Pembimbing',
  student: 'Murid',
  parent:  'Orang Tua',
  admin:   'Admin',
}

interface TopBarProps {
  title: string
}

export function TopBar({ title }: TopBarProps) {
  const { profile } = useAuthStore()

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-surface-50 transition-colors">
          <Bell className="h-5 w-5 text-text-secondary" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-primary-700 font-semibold text-sm">
                {profile?.display_name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary leading-tight">{profile?.display_name ?? 'Pengguna'}</p>
            <p className="text-xs text-text-tertiary leading-tight">{profile?.role ? ROLE_LABEL[profile.role] : ''}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
