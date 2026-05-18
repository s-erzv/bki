import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DashboardLayout({ title, subtitle, actions, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <div className="flex flex-col min-h-screen pl-[260px] transition-[padding] duration-200">
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="animate-fade-slide-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
