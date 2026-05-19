import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, BookOpen, CheckSquare, FileText,
  LogOut, ChevronLeft, ChevronRight, Users, Bell, Heart, UserPlus,
  FilePlus2, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useSignOut } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

interface NavItem {
  label: string
  icon: LucideIcon
  to: string
  section?: 'main' | 'action'
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  coach: [
    { label: 'Dashboard',     icon: LayoutDashboard, to: '/coach',          section: 'main' },
    { label: 'Kalender',      icon: Calendar,        to: '/coach/calendar', section: 'main' },
    { label: 'Daftar Kelas',  icon: BookOpen,        to: '/coach/classes',  section: 'main' },
    { label: 'Daftar Tugas',  icon: CheckSquare,     to: '/coach/tasks',    section: 'main' },
    { label: 'Riwayat Laporan', icon: FileText,      to: '/coach/sessions', section: 'main' },
    { label: 'Buat Laporan',  icon: FilePlus2,       to: '/coach/report',   section: 'action' },
  ],
  student: [
    { label: 'Dashboard',     icon: LayoutDashboard, to: '/student',          section: 'main' },
    { label: 'Kalender',      icon: Calendar,        to: '/student/calendar', section: 'main' },
    { label: 'Daftar Kelas',  icon: BookOpen,        to: '/student/classes',  section: 'main' },
    { label: 'Daftar Tugas',  icon: CheckSquare,     to: '/student/tasks',    section: 'main' },
  ],
  parent: [
    { label: 'Dashboard',     icon: LayoutDashboard, to: '/parent',          section: 'main' },
    { label: 'Kalender',      icon: Calendar,        to: '/parent/calendar', section: 'main' },
    { label: 'Laporan',       icon: FileText,        to: '/parent/reports',  section: 'main' },
  ],
  admin: [
    { label: 'Dashboard',     icon: LayoutDashboard, to: '/admin',             section: 'main' },
    { label: 'Pengguna',      icon: Users,           to: '/admin/users',       section: 'main' },
    { label: 'Tim',           icon: BookOpen,        to: '/admin/teams',       section: 'main' },
    { label: 'Relasi Anak',   icon: Heart,           to: '/admin/relations',   section: 'main' },
    { label: 'Log WA',        icon: Bell,            to: '/admin/notifications', section: 'main' },
    { label: 'Tambah Akun',   icon: UserPlus,        to: '/admin/create-user', section: 'action' },
  ],
}

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

interface SidebarProps {
  /** Mobile drawer open state — controlled by DashboardLayout. */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { profile } = useAuthStore()
  const signOut = useSignOut()
  const navigate = useNavigate()

  const role = profile?.role ?? 'student'
  const items = NAV_ITEMS[role] ?? []
  const accentGradient = ROLE_ACCENT[role]
  const mainItems = items.filter((i) => i.section !== 'action')
  const actionItems = items.filter((i) => i.section === 'action')

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-primary-950 flex flex-col z-40',
        'transition-[width,transform] duration-200 ease-out',
        // Mobile: always 260px wide, slides off-screen unless mobileOpen
        'w-[260px] -translate-x-full',
        mobileOpen && 'translate-x-0',
        // Desktop (lg+): always visible, can collapse to 72px
        'lg:translate-x-0',
        collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
      )}
    >
      {/* Mobile close button (top-right, inside sidebar) */}
      <button
        onClick={onMobileClose}
        className="lg:hidden absolute right-3 top-3 h-8 w-8 inline-flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
        aria-label="Tutup menu"
      >
        <X className="h-4 w-4" />
      </button>
      {/* ── Brand ────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-6">
        <div className={cn(collapsed && 'flex justify-center')}>
          {collapsed ? (
            <div className={cn(
              'h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-extrabold text-sm tracking-tight shadow-lg',
              accentGradient,
            )}>
              BKI
            </div>
          ) : (
            <div className="min-w-0 leading-tight">
              <p className="text-white font-extrabold tracking-tight">BKI</p>
              <p className="text-white/50 text-[10px] uppercase tracking-[0.14em] font-semibold">
                Bimbingan Karya Ilmiah
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-1">
            <span className={cn('h-1.5 w-1.5 rounded-full bg-gradient-to-br', accentGradient)} />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-white/80">
              {ROLE_LABEL[role]}
            </span>
          </div>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────── */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {!collapsed && <SectionLabel>Menu</SectionLabel>}
        <div className="space-y-0.5">
          {mainItems.map((item) => (
            <NavItemLink key={item.to} item={item} role={role} collapsed={collapsed} />
          ))}
        </div>

        {actionItems.length > 0 && (
          <>
            {!collapsed && <SectionLabel className="mt-5">Aksi Cepat</SectionLabel>}
            <div className="space-y-0.5">
              {actionItems.map((item) => (
                <NavItemLink key={item.to} item={item} role={role} collapsed={collapsed} action />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* ── User footer ──────────────────────────────── */}
      <div className="border-t border-white/[0.08] p-3">
        {!collapsed && profile && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1.5">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10" />
            ) : (
              <div className={cn('h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold', accentGradient)}>
                {(profile.full_name ?? 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{profile.full_name}</p>
              <p className="text-[10px] text-white/50 truncate">{ROLE_LABEL[role]}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/[0.06] hover:text-white transition-all',
            collapsed && 'justify-center',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* ── Collapse toggle (desktop only) ───────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-[68px] h-6 w-6 rounded-full bg-white border border-surface-200 items-center justify-center shadow-soft hover:shadow-lift transition-shadow z-10"
        aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3 text-text-secondary" /> : <ChevronLeft className="h-3 w-3 text-text-secondary" />}
      </button>
    </aside>
  )
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('px-3 text-[10px] uppercase tracking-[0.14em] font-bold text-white/30 mb-2', className)}>
      {children}
    </p>
  )
}

function NavItemLink({ item, role, collapsed, action }: { item: NavItem; role: UserRole; collapsed: boolean; action?: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === `/${role}`}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
          collapsed && 'justify-center',
          isActive
            ? 'bg-white/[0.10] text-white shadow-inset-line'
            : action
              ? 'text-primary-200 hover:bg-white/[0.06] hover:text-white'
              : 'text-white/60 hover:bg-white/[0.06] hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active accent bar */}
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-white" />
          )}
          <item.icon className={cn('h-[18px] w-[18px] flex-shrink-0', isActive && 'text-white')} strokeWidth={2} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}
