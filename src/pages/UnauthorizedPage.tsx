import { useNavigate } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <ShieldX className="h-16 w-16 text-danger opacity-70" />
      <h1 className="text-2xl font-bold text-text-primary">Akses Ditolak</h1>
      <p className="text-text-secondary">Kamu tidak memiliki izin untuk mengakses halaman ini.</p>
      <Button onClick={() => navigate('/')}>Kembali ke Halaman Utama</Button>
    </div>
  )
}
