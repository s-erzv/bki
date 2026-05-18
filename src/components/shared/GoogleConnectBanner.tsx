import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGoogleDriveAccess } from '@/hooks/useGoogleDriveAccess'

export function GoogleConnectBanner() {
  const { hasAccess, connect } = useGoogleDriveAccess()

  if (hasAccess) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent-amber/30 bg-gradient-to-r from-accent-amber/10 via-white to-accent-amber/5 px-5 py-4 mb-6">
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent-amber/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-accent-amber/15 text-accent-amber flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary leading-tight">Hubungkan Google Drive & Calendar</p>
            <p className="text-xs text-text-secondary mt-0.5">Aktifkan auto-sync jadwal kelas dan upload laporan ke Drive.</p>
          </div>
        </div>
        <Button onClick={connect} size="sm" className="bg-accent-amber hover:bg-accent-amber/90 text-white shadow-soft flex-shrink-0">
          Hubungkan
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
