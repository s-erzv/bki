import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'
import type { CoachDivision } from '@/types/database'

const DIVISIONS: { value: CoachDivision; label: string }[] = [
  { value: 'research',     label: 'Research' },
  { value: 'paper',        label: 'Paper' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'marketing',    label: 'Marketing' },
  { value: 'admin',        label: 'Admin' },
  { value: 'intern',       label: 'Intern' },
]

const schema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  nomor_hp: z.string().min(10, 'Nomor HP tidak valid'),
  work_email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  divisi: z.enum(['admin', 'research', 'paper', 'presentation', 'marketing', 'intern']),
})
type FormData = z.infer<typeof schema>

export function CoachOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { divisi: 'research' },
  })

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill))

  const onSubmit = async (data: FormData) => {
    if (!user) return

    const { error } = await supabase.from('coaches').upsert({
      id: user.id,
      nama: data.nama,
      nomor_hp: data.nomor_hp || null,
      work_email: data.work_email || null,
      divisi: data.divisi,
    })
    if (error) {
      toast({ title: 'Gagal menyimpan', description: error.message, variant: 'destructive' })
      return
    }

    if (skills.length > 0) {
      await supabase.from('coach_skills').delete().eq('coach_id', user.id)
      await supabase.from('coach_skills').insert(skills.map((skill) => ({ coach_id: user.id, skill })))
    }

    await supabase.from('profiles').update({ display_name: data.nama }).eq('id', user.id)
    navigate('/coach')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lengkapi Profil Pembimbing</CardTitle>
          <p className="text-sm text-text-secondary">Data profil kamu sebagai pembimbing BKI</p>
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
            <div className="space-y-1.5">
              <Label>Email Kerja (opsional)</Label>
              <Input type="email" placeholder="email@bki.co" {...register('work_email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Divisi</Label>
              <Select defaultValue="research" onValueChange={(v) => setValue('divisi', v as CoachDivision)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Keahlian</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Tambah keahlian..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                />
                <Button type="button" variant="outline" onClick={addSkill}>Tambah</Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <span key={skill} className="flex items-center gap-1 bg-primary-50 text-primary-700 text-sm px-3 py-1 rounded-full">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
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
