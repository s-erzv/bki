import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DashboardLayout({ title, subtitle, actions, children }: DashboardLayoutProps) {
  // Mobile sidebar drawer state. On lg+ the sidebar is always visible.
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close the drawer on route change (clicking a nav link).
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [mobileOpen])

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <div className="flex flex-col min-h-screen lg:pl-[260px] transition-[padding] duration-200">
        <TopBar title={title} subtitle={subtitle} actions={actions} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <div className="animate-fade-slide-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
