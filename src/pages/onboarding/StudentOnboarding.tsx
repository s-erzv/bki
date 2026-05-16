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
  nomor_hp: z.string().min(10, 'Nomor HP tidak valid'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  jurusan: z.string().optional(),
  nisn: z.string().optional(),
  email_lomba: z.string().email('Email tidak valid').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

export function StudentOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!user) return
    const { error } = await supabase.from('students').upsert({
      id: user.id,
      nama: data.nama,
      nomor_hp: data.nomor_hp || null,
      kelas: data.kelas || null,
      jurusan: data.jurusan || null,
      nisn: data.nisn || null,
      email_lomba: data.email_lomba || null,
    })
    if (error) {
      toast({ title: 'Gagal menyimpan', description: error.message, variant: 'destructive' })
      return
    }
    await supabase.from('profiles').update({ display_name: data.nama }).eq('id', user.id)
    navigate('/student')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lengkapi Profil Murid</CardTitle>
          <p className="text-sm text-text-secondary">Isi data dirimu untuk melanjutkan</p>
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
              <Input placeholder="08xxxxxxxxxx" {...register('nomor_hp')} />
              {errors.nomor_hp && <p className="text-xs text-danger">{errors.nomor_hp.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kelas</Label>
                <Input placeholder="12" {...register('kelas')} />
                {errors.kelas && <p className="text-xs text-danger">{errors.kelas.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Jurusan</Label>
                <Input placeholder="IPA / IPS" {...register('jurusan')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>NISN</Label>
              <Input placeholder="Nomor Induk Siswa Nasional" {...register('nisn')} />
            </div>
            <div className="space-y-1.5">
              <Label>Email Info Lomba (opsional)</Label>
              <Input type="email" placeholder="email@gmail.com" {...register('email_lomba')} />
              {errors.email_lomba && <p className="text-xs text-danger">{errors.email_lomba.message}</p>}
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
