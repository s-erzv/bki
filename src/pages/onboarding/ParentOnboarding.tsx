import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'

const schema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  nomor_hp_pemantau: z.string().min(10, 'Nomor HP tidak valid'),
})
type FormData = z.infer<typeof schema>

export function ParentOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return
    const { error } = await supabase.from('parents').upsert({
      id: user.id,
      nama: data.nama,
      nomor_hp_pemantau: data.nomor_hp_pemantau,
    })
    if (error) {
      toast({ title: 'Gagal menyimpan', description: error.message, variant: 'destructive' })
      return
    }
    await supabase.from('profiles').update({ display_name: data.nama }).eq('id', user.id)
    navigate('/parent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lengkapi Profil Orang Tua</CardTitle>
          <p className="text-sm text-text-secondary">Data untuk pemantauan perkembangan anak</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input placeholder="Nama lengkap" {...register('nama')} />
              {errors.nama && <p className="text-xs text-danger">{errors.nama.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nomor HP / WhatsApp</Label>
              <Input placeholder="08xxxxxxxxxx" {...register('nomor_hp_pemantau')} />
              {errors.nomor_hp_pemantau && <p className="text-xs text-danger">{errors.nomor_hp_pemantau.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
