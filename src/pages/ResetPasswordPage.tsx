import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  new_password: z.string().min(6, 'Password minimal 6 karakter'),
  confirm:      z.string().min(6, 'Konfirmasi minimal 6 karakter'),
}).refine((d) => d.new_password === d.confirm, {
  path: ['confirm'],
  message: 'Konfirmasi tidak cocok',
})
type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const { session, sessionRestored } = useAuthStore()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Supabase puts the reset token in the URL hash and auto-establishes a
  // recovery session — wait for that session before showing the form.
  useEffect(() => {
    if (sessionRestored && !session) {
      // No session = user landed here without clicking a reset link
      toast({
        title: 'Link reset tidak valid',
        description: 'Coba minta link baru dari halaman Lupa password.',
        variant: 'destructive',
      })
    }
  }, [sessionRestored, session])

  const onSubmit = async (data: FormData) => {
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.new_password })
      if (error) throw error
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      toast({
        title: 'Gagal ganti password',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-surface-200 shadow-lift p-8 sm:p-10">
          {done ? (
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-accent-green/10 text-accent-green flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-primary-950 mb-2">Password berhasil diganti</h1>
              <p className="text-sm text-text-secondary mb-6">
                Mengarahkan ke halaman login...
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Login Sekarang</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-950 flex items-center justify-center mb-5">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-extrabold text-primary-950 mb-2">Reset password</h1>
              <p className="text-sm text-text-secondary mb-7">
                Masukkan password baru untuk akun Anda. Minimal 6 karakter.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Password baru</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...register('new_password')}
                  />
                  {errors.new_password && <p className="text-xs text-danger">{errors.new_password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Konfirmasi password</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...register('confirm')}
                  />
                  {errors.confirm && <p className="text-xs text-danger">{errors.confirm.message}</p>}
                </div>
                <Button type="submit" className="w-full h-11" disabled={busy || !session}>
                  {busy ? 'Menyimpan...' : 'Ganti password'}
                </Button>
                {sessionRestored && !session && (
                  <p className="text-xs text-danger text-center">
                    Sesi reset tidak ditemukan. <Link to="/forgot-password" className="underline">Minta link baru</Link>.
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
