import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Plus, FileText, ExternalLink, Pencil, Trash2, Printer, Loader2, FolderOpen,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useCoachSessions, useDeleteSession, type SessionWithDetails } from '@/hooks/useSessions'
import { useCoachTeams } from '@/hooks/useTeam'
import { useGoogleDriveAccess } from '@/hooks/useGoogleDriveAccess'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { formatDate, cn } from '@/lib/utils'

export function CoachSessions() {
  const navigate = useNavigate()
  const { data: sessions = [], isLoading } = useCoachSessions()
  const { data: teams = [] } = useCoachTeams()
  const { hasAccess: hasDriveAccess } = useGoogleDriveAccess()
  const { profile } = useAuthStore()
  const deleteSession = useDeleteSession()

  const [deleting, setDeleting] = useState<SessionWithDetails | null>(null)

  /* ── Regenerate PDF for one session ─────────────────────────────────── */
  const regenPdf = useMutation({
    mutationFn: async (session: SessionWithDetails) => {
      if (!hasDriveAccess) throw new Error('Hubungkan Google Drive di dashboard untuk generate PDF.')
      const team = teams.find((t) => t.id === session.team_id)
      const reportData = {
        team_code:           team?.team_code ?? 'TIM',
        team_research_title: team?.research_title ?? null,
        coach_name:          profile?.full_name ?? 'Pembimbing',
        session_date:        session.session_date,
        duration_mins:       session.duration_mins ?? 0,
        media:               session.media,
        location:            session.location,
        topic:               session.topic ?? '',
        achievement:         session.achievement,
        homework:            session.homework,
        evaluation:          session.evaluation,
        students: session.session_student_reports.map((r) => {
          const member = team?.team_members.find((m) => m.student_id === r.student_id)
          return {
            student_name:        member?.students?.profiles?.full_name ?? 'Murid',
            score_discipline:    r.score_discipline    ?? 0,
            score_activeness:    r.score_activeness    ?? 0,
            score_communication: r.score_communication ?? 0,
            score_ethics:        r.score_ethics        ?? 0,
            score_understanding: r.score_understanding ?? 0,
            notes:               r.notes,
          }
        }),
      }
      // Lazy-load PDF lib (same as create flow)
      const { generateReportPdf, blobToBase64 } = await import('@/lib/report-pdf')
      const blob = await generateReportPdf(reportData)
      const base64 = await blobToBase64(blob)
      const { data: resp, error: fnErr } = await supabase.functions.invoke('upload-report-to-drive', {
        body: { sessionId: session.id, pdfBase64: base64 },
      })
      if (fnErr) {
        const ctx = (fnErr as { context?: { response?: Response } }).context
        if (ctx?.response) {
          try {
            const body = await ctx.response.clone().json()
            if (body?.error) throw new Error(body.error)
          } catch { /* fall through */ }
        }
        throw fnErr
      }
      if (resp?.error) throw new Error(resp.error)
      return resp
    },
    onSuccess: () => {
      toast({ title: 'PDF berhasil di-regenerate', description: 'File di Drive sudah di-replace dengan versi terbaru.' })
    },
    onError: (err) => {
      toast({
        title: 'Gagal regen PDF',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    },
  })

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteSession.mutateAsync(deleting.id)
      toast({ title: 'Laporan dihapus' })
      setDeleting(null)
    } catch (err) {
      toast({
        title: 'Gagal hapus',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    }
  }

  return (
    <DashboardLayout
      title="Riwayat Laporan"
      subtitle={`${sessions.length} sesi tercatat`}
      actions={
        <Button onClick={() => navigate('/coach/report')} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Buat Laporan Baru</span>
          <span className="sm:hidden">Baru</span>
        </Button>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={FileText}
                title="Belum ada laporan sesi"
                description="Isi laporan setelah sesi bimbingan selesai. PDF dan notifikasi wali otomatis."
                action={
                  <Button onClick={() => navigate('/coach/report')} size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Buat Laporan
                  </Button>
                }
                size="lg"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isRegenPending = regenPdf.isPending && regenPdf.variables?.id === s.id
              const driveFolder = s.teams?.drive_links?.find((d) => d.link_type === 'team_report')
              return (
                <Card key={s.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Info */}
                      <div className="flex-1 p-4 sm:p-5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={s.media === 'online' ? 'online' : 'offline'}>{s.media}</Badge>
                          {s.teams?.team_code && (
                            <Badge variant="secondary" className="font-mono text-[10px]">{s.teams.team_code}</Badge>
                          )}
                          <span className="text-[11px] text-text-tertiary">
                            {s.session_student_reports.length} murid · {s.session_docs.length} foto
                          </span>
                        </div>
                        <p className="font-bold text-text-primary leading-tight truncate">{s.topic ?? 'Sesi Bimbingan'}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {formatDate(s.session_date)}
                          {s.duration_mins ? ` · ${s.duration_mins} menit` : ''}
                        </p>
                        {driveFolder && (
                          <a
                            href={driveFolder.folder_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary-700 hover:text-primary-900 hover:underline mt-2 font-medium"
                          >
                            <FolderOpen className="h-3 w-3" />
                            {driveFolder.folder_name ?? 'Folder Drive tim'}
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap sm:flex-col gap-2 p-4 sm:p-5 sm:w-48 bg-surface-50/50 sm:border-l border-surface-100">
                        {s.drive_report_url ? (
                          <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                            <a href={s.drive_report_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Lihat PDF
                            </a>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-text-tertiary italic flex-1 sm:text-center py-1.5">PDF belum dibuat</span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          onClick={() => regenPdf.mutate(s)}
                          disabled={isRegenPending || regenPdf.isPending}
                          title={s.drive_report_url ? 'Generate ulang PDF dengan data terbaru' : 'Generate PDF baru'}
                        >
                          {isRegenPending
                            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            : <Printer className="h-3.5 w-3.5 mr-1.5" />}
                          {s.drive_report_url ? 'Cetak Ulang' : 'Cetak PDF'}
                        </Button>
                        <div className="flex gap-1 flex-1 sm:flex-none">
                          <button
                            onClick={() => navigate(`/coach/report?sessionId=${s.id}`)}
                            className={cn(
                              'flex-1 h-8 px-2 inline-flex items-center justify-center rounded-md text-xs font-semibold',
                              'text-text-secondary hover:text-primary-700 hover:bg-primary-50 transition-colors gap-1',
                            )}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleting(s)}
                            className={cn(
                              'flex-1 h-8 px-2 inline-flex items-center justify-center rounded-md text-xs font-semibold',
                              'text-text-secondary hover:text-accent-red hover:bg-red-50 transition-colors gap-1',
                            )}
                          >
                            <Trash2 className="h-3 w-3" /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus laporan sesi?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Laporan <span className="font-semibold text-text-primary">"{deleting?.topic ?? 'Sesi Bimbingan'}"</span> ({deleting && formatDate(deleting.session_date)}) akan ditandai sebagai terhapus.
              Data tetap di database (soft delete) — admin bisa restore manual jika perlu.
            </p>
            <p className="text-xs text-text-tertiary">
              File PDF di Google Drive <strong>tidak otomatis terhapus</strong>. Hapus manual di Drive coach jika perlu.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteSession.isPending}>
                Batal
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteSession.isPending}
                className="bg-accent-red hover:bg-accent-red/90 text-white"
              >
                {deleteSession.isPending ? 'Menghapus…' : 'Hapus laporan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
