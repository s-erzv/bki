import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, CheckCircle2, ArrowRight, UserSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingShell } from '@/components/shared/OnboardingShell'
import { supabase } from '@/lib/supabase'
import { useAuthStore, metadataRole } from '@/stores/authStore'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const schema = z.object({
  full_name:     z.string().min(2, 'Nama minimal 2 karakter'),
  monitor_phone: z.string().min(10, 'Nomor HP tidak valid'),
})
type FormData = z.infer<typeof schema>

interface StudentSearchResult {
  id: string
  nisn: string | null
  grade: string | null
  profiles: { full_name: string } | null
}

export function ParentOnboarding() {
  const navigate = useNavigate()
  const { user, profile, onboarded, setProfile, setRoleId, setOnboarded } = useAuthStore()

  // Already finished onboarding → skip the form.
  useEffect(() => {
    if (onboarded) navigate('/parent', { replace: true })
  }, [onboarded, navigate])

  const [studentSearch, setStudentSearch] = useState('')
  const [results, setResults] = useState<StudentSearchResult[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? '',
    },
  })

  useEffect(() => {
    if (studentSearch.length < 3) { setResults([]); return }
    setSearching(true)
    const timer = setTimeout(async () => {
      const [{ data: byProfile }, { data: byNisn }] = await Promise.all([
        supabase
          .from('students')
          .select('id, nisn, grade, profiles!inner(full_name)')
          .ilike('profiles.full_name', `%${studentSearch}%`)
          .is('deleted_at', null)
          .limit(5),
        supabase
          .from('students')
          .select('id, nisn, grade, profiles(full_name)')
          .ilike('nisn', `%${studentSearch}%`)
          .is('deleted_at', null)
          .limit(5),
      ])
      const merged = [
        ...((byProfile ?? []) as unknown as StudentSearchResult[]),
        ...((byNisn ?? []) as unknown as StudentSearchResult[]),
      ]
      const dedup = Array.from(new Map(merged.map((r) => [r.id, r])).values())
      setResults(dedup)
      setSearching(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [studentSearch])

  const onSubmit = async (data: FormData) => {
    if (!user) return
    try {
      const role = profile?.role ?? metadataRole(user) ?? 'parent'
      const { data: profileRow, error: pErr } = await supabase
        .from('profiles')
        .upsert(
          { auth_user_id: user.id, full_name: data.full_name, phone: data.monitor_phone, role },
          { onConflict: 'auth_user_id' },
        )
        .select()
        .single()
      if (pErr) throw pErr
      const profileId = (profileRow as { id: string }).id

      const { data: parentRow, error: parErr } = await supabase
        .from('parents')
        .upsert(
          { profile_id: profileId },
          { onConflict: 'profile_id' },
        )
        .select()
        .single()
      if (parErr) throw parErr
      const parentId = (parentRow as { id: string }).id

      if (selectedStudentId) {
        const { error: linkErr } = await supabase.from('parent_students').insert({
          parent_id: parentId,
          student_id: selectedStudentId,
          monitor_phone: data.monitor_phone,
        })
        if (linkErr) console.error('parent_students link', linkErr)
      }

      setProfile(profileRow as never)
      setRoleId(parentId)
      setOnboarded(true)
      toast({ title: 'Selamat datang!', description: 'Profil orang tua tersimpan.' })
      navigate('/parent', { replace: true })
    } catch (err) {
      toast({ title: 'Gagal menyimpan', description: errMsg(err), variant: 'destructive' })
    }
  }

  return (
    <OnboardingShell
      role="parent"
      title="Pantau perkembangan anak"
      description="Isi data singkat — terus pilih anak yang ingin kamu pantau."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ── Identitas wali ───────────────────────── */}
        <Section title="Identitas Wali">
          <Field label="Nama lengkap" error={errors.full_name?.message}>
            <Input placeholder="Nama yang akan ditampilkan" {...register('full_name')} />
          </Field>
          <Field
            label="Nomor HP / WhatsApp"
            error={errors.monitor_phone?.message}
            hint="Nomor ini yang akan menerima notifikasi WA dari pembimbing."
          >
            <Input placeholder="08xxxxxxxxxx" {...register('monitor_phone')} />
          </Field>
        </Section>

        {/* ── Pilih anak ────────────────────────────── */}
        <Section
          title="Siapa Anakmu?"
          description="Cari nama anak atau NISN-nya. Kalau belum ketemu, admin bisa hubungkan nanti."
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Cari nama atau NISN anak…"
              className="pl-9"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>

          <div className="min-h-[6rem]">
            {searching ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((s) => {
                  const selected = selectedStudentId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStudentId(s.id)}
                      className={cn(
                        'w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all',
                        selected
                          ? 'border-accent-purple bg-accent-purple/5 shadow-soft ring-2 ring-accent-purple/20'
                          : 'border-surface-200 bg-white hover:border-accent-purple/40',
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0',
                          selected ? 'bg-accent-purple text-white' : 'bg-accent-purple/10 text-accent-purple',
                        )}>
                          {(s.profiles?.full_name ?? '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary text-sm leading-tight truncate">{s.profiles?.full_name ?? 'Murid'}</p>
                          <p className="text-[11px] text-text-tertiary mt-0.5">
                            NISN: {s.nisn ?? '—'}{s.grade ? ` · Kelas ${s.grade}` : ''}
                          </p>
                        </div>
                      </div>
                      {selected && <CheckCircle2 className="h-5 w-5 text-accent-purple flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ) : studentSearch.length >= 3 ? (
              <div className="text-center py-6 text-xs text-text-tertiary">
                <UserSearch className="h-6 w-6 mx-auto mb-2 opacity-40" />
                Anak tidak ditemukan. Admin bisa hubungkan akun ini ke murid nanti.
              </div>
            ) : (
              <p className="text-[11px] text-text-tertiary italic px-1">
                Ketik minimal 3 huruf untuk mencari.
              </p>
            )}
          </div>
        </Section>

        <div className="flex items-center justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="h-11 px-6">
            {isSubmitting ? 'Menyimpan…' : (<>Selesai <ArrowRight className="h-4 w-4 ml-1.5" /></>)}
          </Button>
        </div>
      </form>
    </OnboardingShell>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary-600">{title}</p>
        {description && <p className="text-xs text-text-tertiary mt-1">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && !error && <p className="text-[11px] text-text-tertiary">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : 'Terjadi kesalahan'
}
