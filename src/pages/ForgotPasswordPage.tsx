import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
})
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      toast({
        title: 'Gagal kirim link reset',
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
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" /> Kembali ke login
        </Link>

        <div className="bg-white rounded-3xl border border-surface-200 shadow-lift p-8 sm:p-10">
          {sent ? (
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-accent-green/10 text-accent-green flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-primary-950 mb-2">Link reset terkirim</h1>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                Cek inbox email Anda untuk tautan reset password. Tautan berlaku selama 1 jam.
                Kalau gak nemu, cek folder spam atau coba lagi.
              </p>
              <div className="space-y-2">
                <Button onClick={() => setSent(false)} variant="outline" className="w-full">
                  Kirim ke email lain
                </Button>
                <Button asChild className="w-full">
                  <Link to="/login">Kembali ke login</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-950 flex items-center justify-center mb-5">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-extrabold text-primary-950 mb-2">Lupa password</h1>
              <p className="text-sm text-text-secondary mb-7">
                Masukkan email akun Anda. Kami akan kirim link untuk reset password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="kamu@example.com"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full h-11" disabled={busy}>
                  {busy ? 'Mengirim...' : 'Kirim link reset'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
