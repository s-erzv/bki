import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, BookOpen, CheckSquare, FileText,
  User, LogOut, ChevronLeft, ChevronRight, Users, Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useSignOut } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  to: string
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  coach: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/coach' },
    { label: 'Kalender', icon: Calendar, to: '/coach/calendar' },
    { label: 'Daftar Kelas', icon: BookOpen, to: '/coach/classes' },
    { label: 'Daftar Tugas', icon: CheckSquare, to: '/coach/tasks' },
    { label: 'Laporan', icon: FileText, to: '/coach/sessions' },
    { label: 'Profil', icon: User, to: '/coach/profile' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/student' },
    { label: 'Kalender', icon: Calendar, to: '/student/calendar' },
    { label: 'Daftar Kelas', icon: BookOpen, to: '/student/classes' },
    { label: 'Daftar Tugas', icon: CheckSquare, to: '/student/tasks' },
    { label: 'Profil', icon: User, to: '/student/profile' },
  ],
  parent: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/parent' },
    { label: 'Kalender', icon: Calendar, to: '/parent/calendar' },
    { label: 'Laporan', icon: FileText, to: '/parent/reports' },
    { label: 'Profil', icon: User, to: '/parent/profile' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
    { label: 'Pengguna', icon: Users, to: '/admin/users' },
    { label: 'Tim', icon: BookOpen, to: '/admin/teams' },
    { label: 'Notifikasi WA', icon: Bell, to: '/admin/notifications' },
  ],
}

const ROLE_ACCENT: Record<UserRole, string> = {
  coach:   'bg-primary-600',
  student: 'bg-indigo-600',
  parent:  'bg-violet-600',
  admin:   'bg-slate-600',
}

const ROLE_LABEL: Record<UserRole, string> = {
  coach:   'Pembimbing',
  student: 'Murid',
  parent:  'Orang Tua',
  admin:   'Admin',
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { profile } = useAuthStore()
  const signOut = useSignOut()
  const navigate = useNavigate()

  const role = profile?.role ?? 'student'
  const items = NAV_ITEMS[role] ?? []
  const accentClass = ROLE_ACCENT[role]

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-surface-200 flex flex-col z-40 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn('p-4 border-b border-surface-200', accentClass)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">BKI</p>
              <p className="text-white/70 text-xs truncate">{ROLE_LABEL[role]}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === `/${role}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:bg-surface-50 hover:text-text-primary'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-200">
        {!collapsed && profile && (
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-text-primary truncate">{profile.display_name ?? 'Pengguna'}</p>
            <p className="text-xs text-text-tertiary">{ROLE_LABEL[role]}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-red-50 hover:text-danger transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-surface-200 flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200 z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}
