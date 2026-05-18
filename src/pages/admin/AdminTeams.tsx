import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Users, Pencil, Trash2, UserPlus, Search,
  Microscope, ChevronRight, X, Hash,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import type { Team } from '@/types/database'

interface TeamRow extends Team {
  coaches: { id: string; profiles: { full_name: string } | null } | null
  team_members: Array<{
    id: string
    student_id: string
    students: { id: string; profiles: { full_name: string; photo_url: string | null } | null } | null
  }>
}

interface CoachOption { id: string; profiles: { full_name: string } | null }
interface StudentOption { id: string; profiles: { full_name: string; photo_url: string | null } | null; nisn: string | null; grade: string | null }

/* ─────────────────────────────────────────────────────── */

const createSchema = z.object({
  research_title: z.string().optional(),
  coach_id: z.string().min(1, 'Pilih pembimbing'),
})
type CreateFormData = z.infer<typeof createSchema>

const editSchema = z.object({
  research_title: z.string().optional(),
  coach_id: z.string().optional(),
})
type EditFormData = z.infer<typeof editSchema>

export function AdminTeams() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)

  /* ── Queries ───────────────────────────────────────── */
  const { data: teams = [], isLoading } = useQuery<TeamRow[]>({
    queryKey: ['admin_teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          coaches(id, profiles(full_name)),
          team_members(id, student_id, students(id, profiles(full_name, photo_url)))
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as TeamRow[]
    },
  })

  const { data: coaches = [] } = useQuery<CoachOption[]>({
    queryKey: ['admin_coach_options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select('id, profiles!inner(full_name, role)')
        .eq('profiles.role', 'coach')
      if (error) throw error
      return (data ?? []) as unknown as CoachOption[]
    },
  })

  /* ── Mutations ─────────────────────────────────────── */
  const createTeam = useMutation({
    mutationFn: async (data: CreateFormData) => {
      const { error } = await supabase.from('teams').insert({
        research_title: data.research_title || null,
        coach_id: data.coach_id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Tim dibuat' })
      qc.invalidateQueries({ queryKey: ['admin_teams'] })
      setCreateOpen(false)
    },
    onError: (err) => toast({ title: 'Gagal buat tim', description: errMsg(err), variant: 'destructive' }),
  })

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Tim dihapus' })
      qc.invalidateQueries({ queryKey: ['admin_teams'] })
    },
    onError: (err) => toast({ title: 'Gagal hapus', description: errMsg(err), variant: 'destructive' }),
  })

  const filtered = useMemo(() => {
    if (!search) return teams
    const q = search.toLowerCase()
    return teams.filter((t) =>
      t.team_code?.toLowerCase().includes(q) ||
      t.research_title?.toLowerCase().includes(q) ||
      t.coaches?.profiles?.full_name?.toLowerCase().includes(q),
    )
  }, [teams, search])

  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? null

  return (
    <div className="space-y-5">
      {/* ── Toolbar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-text-primary">Manajemen Tim</h2>
          <Badge variant="outline" className="text-[10px]">{teams.length} tim aktif</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tim / coach / judul…"
              className="pl-9 h-9 w-60 bg-white shadow-soft"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Tambah Tim
          </Button>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title={search ? 'Tidak ada hasil' : 'Belum ada tim'}
              description={search ? `Coba kata kunci lain` : 'Bikin tim pertamamu lewat tombol di kanan atas.'}
              action={!search ? (
                <Button onClick={() => setCreateOpen(true)} size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Bikin Tim
                </Button>
              ) : undefined}
              size="lg"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onOpen={() => setActiveTeamId(team.id)}
              onDelete={() => {
                if (confirm(`Hapus tim ${team.team_code}? Ini soft-delete, bisa di-restore manual.`)) {
                  deleteTeam.mutate(team.id)
                }
              }}
            />
          ))}
        </div>
      )}

      {/* ── Create slide-over ────────────────────────── */}
      <CreateTeamSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        coaches={coaches}
        onSubmit={(data) => createTeam.mutate(data)}
        submitting={createTeam.isPending}
      />

      {/* ── Detail slide-over ────────────────────────── */}
      <TeamDetailSheet
        open={!!activeTeamId}
        onOpenChange={(open) => !open && setActiveTeamId(null)}
        team={activeTeam}
        coaches={coaches}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────────────── */
/* Team card                                               */
/* ─────────────────────────────────────────────────────── */

interface TeamCardProps {
  team: TeamRow
  onOpen: () => void
  onDelete: () => void
}
function TeamCard({ team, onOpen, onDelete }: TeamCardProps) {
  const members = team.team_members ?? []
  const memberCount = members.length
  return (
    <Card className="group hover:shadow-lift transition-all cursor-pointer overflow-hidden" onClick={onOpen}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary-950 text-white px-2 py-0.5 text-[11px] font-mono font-bold tracking-wider">
            <Hash className="h-3 w-3 opacity-60" />
            {team.team_code}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-text-tertiary hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Hapus tim"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-[3rem]">
          {team.research_title ? (
            <p className="font-bold text-text-primary leading-snug line-clamp-2">{team.research_title}</p>
          ) : (
            <p className="text-sm italic text-text-tertiary">Belum ada judul penelitian</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Microscope className="h-3 w-3 text-text-tertiary" />
          <span className="font-medium truncate">{team.coaches?.profiles?.full_name ?? 'Belum ada pembimbing'}</span>
        </div>

        <div className="pt-3 border-t border-surface-100 flex items-center justify-between">
          <div className="flex items-center -space-x-1.5">
            {members.slice(0, 4).map((m, i) => (
              <div
                key={m.id}
                className="h-7 w-7 rounded-full border-2 border-white shadow-soft"
                style={{ zIndex: 10 - i }}
              >
                {m.students?.profiles?.photo_url ? (
                  <img src={m.students.profiles.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-accent-teal to-primary-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(m.students?.profiles?.full_name ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {memberCount > 4 && (
              <div className="h-7 w-7 rounded-full border-2 border-white bg-surface-100 flex items-center justify-center text-[10px] font-bold text-text-secondary shadow-soft">
                +{memberCount - 4}
              </div>
            )}
            {memberCount === 0 && (
              <span className="text-xs text-text-tertiary italic">Belum ada anggota</span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary tabular-nums">
            {memberCount} murid
          </p>
        </div>

        <div className="pt-1 text-[10px] text-text-tertiary flex items-center justify-between">
          <span>Dibuat {formatDate(team.created_at)}</span>
          <ChevronRight className="h-3 w-3 text-text-tertiary group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </CardContent>
    </Card>
  )
}

/* ─────────────────────────────────────────────────────── */
/* Create slide-over                                       */
/* ─────────────────────────────────────────────────────── */

interface CreateTeamSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coaches: CoachOption[]
  onSubmit: (data: CreateFormData) => void
  submitting: boolean
}
function CreateTeamSheet({ open, onOpenChange, coaches, onSubmit, submitting }: CreateTeamSheetProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
  })
  const coachId = watch('coach_id')

  const submit = (data: CreateFormData) => {
    onSubmit(data)
    reset()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Bikin Tim Baru</SheetTitle>
          <p className="text-xs text-text-tertiary mt-1">Kode tim akan auto-generate oleh sistem.</p>
        </SheetHeader>
        <SheetBody>
          <form id="create-team-form" onSubmit={handleSubmit(submit)} className="space-y-5">
            <Field label="Pembimbing" error={errors.coach_id?.message}>
              <Select value={coachId ?? ''} onValueChange={(v) => setValue('coach_id', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Pilih pembimbing…" /></SelectTrigger>
                <SelectContent>
                  {coaches.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-text-tertiary italic">Belum ada coach</div>
                  ) : coaches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.profiles?.full_name ?? 'Coach'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Judul penelitian (opsional)" hint="Bisa diisi nanti oleh tim murid.">
              <Input placeholder="Misal: Bioplastik dari kulit pisang" {...register('research_title')} />
            </Field>
            <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-3 text-xs text-text-secondary leading-relaxed">
              Anggota tim ditambahkan setelah tim dibuat — klik tim di list untuk manage members.
            </div>
          </form>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" form="create-team-form" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'Bikin Tim'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* ─────────────────────────────────────────────────────── */
/* Detail slide-over                                       */
/* ─────────────────────────────────────────────────────── */

interface TeamDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: TeamRow | null
  coaches: CoachOption[]
}
function TeamDetailSheet({ open, onOpenChange, team, coaches }: TeamDetailSheetProps) {
  const qc = useQueryClient()
  const [memberSearch, setMemberSearch] = useState('')
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, setValue, watch, reset } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  // Available students (not already in this team).
  const { data: candidates = [] } = useQuery<StudentOption[]>({
    queryKey: ['admin_student_candidates', memberSearch],
    queryFn: async () => {
      let q = supabase
        .from('students')
        .select('id, nisn, grade, profiles!inner(full_name, photo_url, role)')
        .eq('profiles.role', 'student')
        .is('deleted_at', null)
        .limit(8)
      if (memberSearch.length >= 2) {
        q = q.ilike('profiles.full_name', `%${memberSearch}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as StudentOption[]
    },
    enabled: open,
  })

  const updateTeam = useMutation({
    mutationFn: async (data: EditFormData) => {
      if (!team) return
      const { error } = await supabase.from('teams').update({
        research_title: data.research_title || null,
        coach_id: data.coach_id || null,
      }).eq('id', team.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Tim diperbarui' })
      qc.invalidateQueries({ queryKey: ['admin_teams'] })
      setEditing(false)
    },
    onError: (err) => toast({ title: 'Gagal update', description: errMsg(err), variant: 'destructive' }),
  })

  const addMember = useMutation({
    mutationFn: async (studentId: string) => {
      if (!team) return
      const { error } = await supabase.from('team_members').insert({
        team_id: team.id,
        student_id: studentId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Anggota ditambah' })
      qc.invalidateQueries({ queryKey: ['admin_teams'] })
    },
    onError: (err) => toast({ title: 'Gagal tambah', description: errMsg(err), variant: 'destructive' }),
  })

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Anggota dihapus' })
      qc.invalidateQueries({ queryKey: ['admin_teams'] })
    },
    onError: (err) => toast({ title: 'Gagal hapus', description: errMsg(err), variant: 'destructive' }),
  })

  if (!team) return null

  const memberIds = new Set(team.team_members.map((m) => m.student_id))
  const filteredCandidates = candidates.filter((s) => !memberIds.has(s.id))

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setEditing(false); reset() } }}>
      <SheetContent className="!max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary-950 text-white px-2 py-0.5 text-[11px] font-mono font-bold tracking-wider">
              <Hash className="h-3 w-3 opacity-60" />
              {team.team_code}
            </span>
            <Badge variant="outline" className="text-[10px]">{team.team_members.length} murid</Badge>
          </div>
          <SheetTitle>{team.research_title ?? 'Tim tanpa judul penelitian'}</SheetTitle>
          <p className="text-xs text-text-tertiary mt-1">
            Pembimbing: {team.coaches?.profiles?.full_name ?? '—'}
          </p>
        </SheetHeader>
        <SheetBody className="space-y-6">
          {/* ── Edit info ─────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-text-tertiary">Detail Tim</p>
              {!editing ? (
                <button onClick={() => {
                  setEditing(true)
                  setValue('research_title', team.research_title ?? '')
                  setValue('coach_id', team.coaches?.id ?? '')
                }} className="text-xs font-semibold text-primary-600 hover:underline inline-flex items-center gap-1">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              ) : (
                <button onClick={() => { setEditing(false); reset() }} className="text-xs font-semibold text-text-tertiary hover:text-text-primary">
                  Batal
                </button>
              )}
            </div>

            {editing ? (
              <form id="edit-team-form" onSubmit={handleSubmit((d) => updateTeam.mutate(d))} className="space-y-3">
                <Field label="Pembimbing">
                  <Select value={watch('coach_id') ?? ''} onValueChange={(v) => setValue('coach_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih pembimbing…" /></SelectTrigger>
                    <SelectContent>
                      {coaches.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.profiles?.full_name ?? 'Coach'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Judul penelitian">
                  <Input {...register('research_title')} placeholder="Judul penelitian tim…" />
                </Field>
                <Button type="submit" size="sm" disabled={updateTeam.isPending}>
                  {updateTeam.isPending ? 'Menyimpan…' : 'Simpan perubahan'}
                </Button>
              </form>
            ) : (
              <div className="rounded-xl border border-surface-200 p-3 text-sm space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-text-tertiary text-xs">Pembimbing</span>
                  <span className="font-semibold text-text-primary text-right">{team.coaches?.profiles?.full_name ?? '—'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-tertiary text-xs">Penelitian</span>
                  <span className="font-semibold text-text-primary text-right line-clamp-2">{team.research_title ?? '—'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-tertiary text-xs">Dibuat</span>
                  <span className="text-text-secondary text-right tabular-nums">{formatDate(team.created_at)}</span>
                </div>
              </div>
            )}
          </section>

          {/* ── Members list ──────────────────────────── */}
          <section>
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-text-tertiary mb-3">
              Anggota Tim · {team.team_members.length}
            </p>
            {team.team_members.length === 0 ? (
              <EmptyState icon={Users} title="Belum ada anggota" description="Tambahkan murid lewat search di bawah." size="sm" />
            ) : (
              <ul className="space-y-2">
                {team.team_members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-xl border border-surface-200 p-2.5">
                    {m.students?.profiles?.photo_url ? (
                      <img src={m.students.profiles.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent-teal to-primary-600 text-white flex items-center justify-center text-xs font-bold">
                        {(m.students?.profiles?.full_name ?? '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <p className="flex-1 text-sm font-semibold text-text-primary truncate">
                      {m.students?.profiles?.full_name ?? 'Murid'}
                    </p>
                    <button
                      onClick={() => { if (confirm('Hapus dari tim?')) removeMember.mutate(m.id) }}
                      className="text-text-tertiary hover:text-danger transition-colors"
                      aria-label="Hapus anggota"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Add member ────────────────────────────── */}
          <section>
            <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-text-tertiary mb-3">Tambah Anggota</p>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Cari nama murid…"
                className="pl-9 h-9"
              />
            </div>
            {filteredCandidates.length === 0 ? (
              <p className="text-xs text-text-tertiary italic">
                {memberSearch.length < 2 ? 'Ketik 2+ huruf untuk cari murid' : 'Tidak ada hasil'}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {filteredCandidates.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl border border-surface-200 p-2.5 hover:border-primary-300 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-accent-teal/15 text-accent-teal flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(s.profiles?.full_name ?? '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{s.profiles?.full_name ?? 'Murid'}</p>
                      <p className="text-[10px] text-text-tertiary">{s.grade ? `Kelas ${s.grade}` : 'Tanpa kelas'} · NISN {s.nisn ?? '—'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => addMember.mutate(s.id)}
                      disabled={addMember.isPending}
                    >
                      <UserPlus className="h-3 w-3 mr-1" /> Tambah
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Tutup</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/* ─────────────────────────────────────────────────────── */

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className={cn('text-xs', error && 'text-danger')}>{label}</Label>
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
