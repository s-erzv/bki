import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGoogleDriveAccess } from '@/hooks/useGoogleDriveAccess'

export function GoogleConnectBanner() {
  const { hasAccess, connect } = useGoogleDriveAccess()

  if (hasAccess) return null

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          Hubungkan Google untuk menggunakan fitur Drive & Calendar
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-300 text-amber-800 hover:bg-amber-100 flex-shrink-0"
        onClick={connect}
      >
        Hubungkan Sekarang →
      </Button>
    </div>
  )
}
