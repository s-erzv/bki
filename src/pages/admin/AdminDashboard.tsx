import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Routes, Route, Link } from 'react-router-dom'
import { Users, BookOpen, Bell, Search, Trash2, UserPlus, Pencil } from 'lucide-react'
import { AdminCreateUser } from './AdminCreateUser'
import { AdminTeams } from './AdminTeams'
import { EditUserSheet } from './EditUserSheet'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import type { WaStatus, UserRole, Profile, WaNotification } from '@/types/database'

const STATUS_VARIANT: Record<WaStatus, 'success' | 'danger' | 'warning'> = {
  sent: 'success',
  failed: 'danger',
  pending: 'warning',
}

const ROLE_LABELS: Record<UserRole, string> = {
  coach: 'Pembimbing', student: 'Murid', parent: 'Orang Tua', admin: 'Admin',
}

interface AdminStatsData {
  coachCount: number
  studentCount: number
  teamCount: number
  waNotifs: WaNotification[]
}

function AdminStats() {
  const { data: stats, isLoading } = useQuery<AdminStatsData>({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const [coaches, students, teams, waNotifs] = await Promise.all([
        supabase.from('coaches').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('teams').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('wa_notifications').select('*').order('created_at', { ascending: false }).limit(10),
      ])
      return {
        coachCount: coaches.count ?? 0,
        studentCount: students.count ?? 0,
        teamCount: teams.count ?? 0,
        waNotifs: (waNotifs.data ?? []) as WaNotification[],
      }
    },
  })

  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ['admin_recent_profiles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      return (data ?? []) as Profile[]
    },
  })

  const STAT_CARDS = [
    { label: 'Pembimbing', value: stats?.coachCount ?? 0,         icon: Users,    color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Murid Aktif', value: stats?.studentCount ?? 0,      icon: Users,    color: 'text-indigo-600',  bg: 'bg-indigo-50' },
    { label: 'Tim',         value: stats?.teamCount ?? 0,         icon: BookOpen, color: 'text-green-600',   bg: 'bg-green-50' },
    { label: 'Pesan WA',    value: stats?.waNotifs.length ?? 0,   icon: Bell,     color: 'text-amber-600',   bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg}`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-7 w-12 mb-1" /> : <p className="text-2xl font-bold">{s.value}</p>}
                <p className="text-xs text-text-secondary">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pengguna Terbaru</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="users">Lihat Semua</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Nama</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-text-primary">{p.full_name}</td>
                      <td className="px-5 py-3"><Badge variant="secondary">{ROLE_LABELS[p.role]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Log Notifikasi WA
            </CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="notifications">Lihat Semua</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (stats?.waNotifs ?? []).length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-8">Belum ada notifikasi</p>
            ) : (
              (stats?.waNotifs ?? []).map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface-50">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-text-secondary">{n.recipient_phone}</p>
                    <p className="text-xs text-text-tertiary truncate">{n.message.slice(0, 60)}...</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[n.status]}>{n.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminUsers() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['admin_users_list', search, roleFilter],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (search) query = query.ilike('full_name', `%${search}%`)
      if (roleFilter !== 'all') query = query.eq('role', roleFilter)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Profile[]
    },
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>Manajemen Pengguna</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <Input
                placeholder="Cari nama..."
                className="pl-9 w-64 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            >
              <option value="all">Semua Role</option>
              <option value="coach">Pembimbing</option>
              <option value="student">Murid</option>
              <option value="parent">Orang Tua</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Nama</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">No. HP</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Tgl Daftar</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-50">
                    <td className="px-5 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-text-tertiary italic">Tidak ada data ditemukan</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-text-primary">{u.full_name}</td>
                    <td className="px-5 py-3"><Badge variant="outline">{ROLE_LABELS[u.role]}</Badge></td>
                    <td className="px-5 py-3 text-text-secondary font-mono text-xs">{u.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-text-tertiary">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-text-secondary hover:text-primary-700"
                          onClick={() => setEditingProfile(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="text-xs">Edit</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <EditUserSheet
        open={!!editingProfile}
        onOpenChange={(open) => !open && setEditingProfile(null)}
        profile={editingProfile}
      />
    </Card>
  )
}

interface RelationRow {
  id: string
  parent_id: string
  student_id: string
  parents: { profiles: { full_name: string } | null } | null
  students: { profiles: { full_name: string } | null } | null
}

/**
 * Source data for dropdowns. We query `profiles` directly (not `parents`/`students`)
 * because some users complete profile registration but the role-specific row
 * never got created (e.g., onboarding error, manual DB inserts).
 *
 * `parents[0]?.id` / `students[0]?.id` tells us whether the role-row already exists.
 * On link, if it's missing we auto-create it so the FK in parent_students works.
 */
// PostgREST detects the UNIQUE constraint on parents.profile_id / students.profile_id
// and treats the reverse embed as to-one: returns a single object or null, NOT an array.
interface ParentProfileOption {
  id: string             // profiles.id
  full_name: string
  parents: { id: string } | null
}

interface StudentProfileOption {
  id: string             // profiles.id
  full_name: string
  students: { id: string; deleted_at: string | null } | null
}

function AdminRelations() {
  const qc = useQueryClient()
  // Holds profiles.id, NOT parents.id / students.id (which may not exist yet).
  const [selectedParentProfileId, setSelectedParentProfileId] = useState<string>('')
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<string>('')

  const { data: relations = [], isLoading: loadingRel, error: relationsError } = useQuery<RelationRow[]>({
    queryKey: ['admin_relations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_students')
        .select(`
          id, parent_id, student_id,
          parents:parent_id(profiles(full_name)),
          students:student_id(profiles(full_name))
        `)
      if (error) throw error
      return (data ?? []) as unknown as RelationRow[]
    },
  })

  const { data: allParents = [], error: parentsError } = useQuery<ParentProfileOption[]>({
    queryKey: ['admin_all_parents_dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, parents(id)')
        .eq('role', 'parent')
        .order('full_name')
      if (error) throw error
      return (data ?? []) as unknown as ParentProfileOption[]
    },
  })

  const { data: allStudents = [], error: studentsError } = useQuery<StudentProfileOption[]>({
    queryKey: ['admin_all_students_dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, students(id, deleted_at)')
        .eq('role', 'student')
        .order('full_name')
      if (error) throw error
      // Treat soft-deleted students row as if it doesn't exist (will trigger auto-create on link).
      return ((data ?? []) as unknown as StudentProfileOption[]).map((p) => ({
        ...p,
        students: p.students && p.students.deleted_at === null ? p.students : null,
      }))
    },
  })

  const createRelation = useMutation({
    mutationFn: async () => {
      if (!selectedParentProfileId || !selectedStudentProfileId) return

      // 1. Ensure parents row exists for the selected profile.
      const parentOpt = allParents.find((p) => p.id === selectedParentProfileId)
      let parentId = parentOpt?.parents?.id
      if (!parentId) {
        const { data, error } = await supabase
          .from('parents')
          .insert({ profile_id: selectedParentProfileId })
          .select('id')
          .single()
        if (error) throw new Error(`Gagal buat row parents: ${error.message}`)
        parentId = (data as { id: string }).id
      }

      // 2. Ensure students row exists for the selected profile.
      const studentOpt = allStudents.find((s) => s.id === selectedStudentProfileId)
      let studentId = studentOpt?.students?.id
      if (!studentId) {
        const { data, error } = await supabase
          .from('students')
          .insert({ profile_id: selectedStudentProfileId })
          .select('id')
          .single()
        if (error) throw new Error(`Gagal buat row students: ${error.message}`)
        studentId = (data as { id: string }).id
      }

      // 3. Link them.
      const { error } = await supabase.from('parent_students').insert({
        parent_id: parentId,
        student_id: studentId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Relasi berhasil dibuat' })
      qc.invalidateQueries({ queryKey: ['admin_relations'] })
      qc.invalidateQueries({ queryKey: ['admin_all_parents_dropdown'] })
      qc.invalidateQueries({ queryKey: ['admin_all_students_dropdown'] })
      setSelectedParentProfileId('')
      setSelectedStudentProfileId('')
    },
    onError: (err) => toast({ title: 'Gagal', description: err instanceof Error ? err.message : String(err), variant: 'destructive' }),
  })

  const deleteRelation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parent_students').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast({ title: 'Relasi dihapus' })
      qc.invalidateQueries({ queryKey: ['admin_relations'] })
    },
  })

  const loadError = parentsError ?? studentsError ?? relationsError

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm">
          <p className="font-semibold text-danger mb-1">Gagal memuat data relasi</p>
          <p className="text-text-secondary font-mono text-xs whitespace-pre-wrap break-all">
            {loadError instanceof Error ? loadError.message : String(loadError)}
          </p>
          <p className="text-text-tertiary text-xs mt-2">
            Cek RLS policy untuk tabel <code>parents</code> & <code>students</code> di Supabase — admin perlu izin SELECT.
          </p>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Tambah Relasi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-text-tertiary">
                Pilih Orang Tua <span className="text-text-tertiary normal-case font-normal">({allParents.length} tersedia)</span>
              </label>
              <Select value={selectedParentProfileId} onValueChange={setSelectedParentProfileId}>
                <SelectTrigger><SelectValue placeholder={allParents.length === 0 ? 'Belum ada orang tua' : 'Pilih orang tua...'} /></SelectTrigger>
                <SelectContent>
                  {allParents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                      {!p.parents && <span className="text-text-tertiary text-xs ml-1">(auto-create)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-text-tertiary">
                Pilih Murid (Anak) <span className="text-text-tertiary normal-case font-normal">({allStudents.length} tersedia)</span>
              </label>
              <Select value={selectedStudentProfileId} onValueChange={setSelectedStudentProfileId}>
                <SelectTrigger><SelectValue placeholder={allStudents.length === 0 ? 'Belum ada murid' : 'Pilih murid...'} /></SelectTrigger>
                <SelectContent>
                  {allStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                      {!s.students && <span className="text-text-tertiary text-xs ml-1">(auto-create)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={() => createRelation.mutate()}
              disabled={!selectedParentProfileId || !selectedStudentProfileId || createRelation.isPending}
            >
              {createRelation.isPending ? 'Menghubungkan...' : (<><UserPlus className="h-4 w-4 mr-2" /> Hubungkan</>)}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Daftar Relasi Aktif</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50/50 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Orang Tua</th>
                    <th className="text-left px-5 py-3">Murid (Anak)</th>
                    <th className="text-right px-5 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRel ? (
                    Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={3} className="p-5"><Skeleton className="h-4 w-full" /></td></tr>)
                  ) : relations.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-text-tertiary italic">Belum ada relasi terdata</td></tr>
                  ) : (
                    relations.map((r) => (
                      <tr key={r.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-text-primary">{r.parents?.profiles?.full_name ?? '—'}</td>
                        <td className="px-5 py-3 text-text-secondary">{r.students?.profiles?.full_name ?? '—'}</td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { if (confirm('Hapus relasi ini?')) deleteRelation.mutate(r.id) }}
                            className="text-text-tertiary hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// AdminTeams moved to ./AdminTeams.tsx — full CRUD + member management.

function AdminNotifications() {
  const { data: notifications = [], isLoading } = useQuery<WaNotification[]>({
    queryKey: ['admin_notifications_all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('wa_notifications')
        .select('*')
        .order('created_at', { ascending: false })
      return (data ?? []) as WaNotification[]
    },
  })

  return (
    <Card>
      <CardHeader><CardTitle>Log Notifikasi WA</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/50 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                <th className="text-left px-5 py-3">Penerima</th>
                <th className="text-left px-5 py-3">Pesan</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Tgl Kirim</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-50">
                    <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-64" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-32" /></td>
                  </tr>
                ))
              ) : notifications.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-text-tertiary italic">Belum ada riwayat notifikasi</td></tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-text-primary">{n.recipient_phone}</td>
                    <td className="px-5 py-3 text-text-secondary max-w-xs truncate">{n.message}</td>
                    <td className="px-5 py-3"><Badge variant={STATUS_VARIANT[n.status]}>{n.status}</Badge></td>
                    <td className="px-5 py-3 text-text-tertiary">{formatDate(n.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <Routes>
        <Route index element={<AdminStats />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="create-user" element={<AdminCreateUser />} />
        <Route path="relations" element={<AdminRelations />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Routes>
    </DashboardLayout>
  )
}
