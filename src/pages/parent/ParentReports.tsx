import { useState } from 'react'
import { ExternalLink, FileText, Heart } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useParentStudents } from '@/hooks/useTeam'
import { useStudentSessions } from '@/hooks/useSessions'
import { cn, formatDate } from '@/lib/utils'

export function ParentReports() {
  const { data: students = [], isLoading: studentsLoading } = useParentStudents()
  const [selectedIdx, setSelectedIdx] = useState(0)

  const child = students[selectedIdx] ?? null
  const teamId = child?.team_members?.[0]?.teams?.id ?? null
  const { data: sessions = [], isLoading: sessionsLoading } = useStudentSessions(teamId)

  const isLoading = studentsLoading || sessionsLoading

  return (
    <DashboardLayout
      title="Laporan Sesi"
      subtitle={child?.profiles?.full_name ? `Laporan ${child.profiles.full_name.split(' ')[0]}` : 'Pantau laporan anak'}
    >
      <div className="space-y-5">
        {/* Multi-child selector */}
        {students.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary mr-2">Pilih anak:</span>
            {students.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all border',
                  i === selectedIdx
                    ? 'bg-primary-950 text-white border-primary-950 shadow-soft'
                    : 'bg-white text-text-secondary border-surface-200 hover:border-primary-300 hover:text-text-primary',
                )}
              >
                {s.profiles?.full_name?.split(' ')[0] ?? 'Anak'}
              </button>
            ))}
          </div>
        )}

        {!child ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Heart}
                title="Belum ada anak yang dipantau"
                description="Hubungi admin BKI untuk menghubungkan akun ini ke murid."
                size="lg"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-text-secondary">{sessions.length} sesi tercatat</p>

            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState
                    icon={FileText}
                    title="Belum ada laporan sesi"
                    description="Pembimbing belum mengirim laporan. Laporan akan muncul di sini begitu sesi selesai."
                    size="lg"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Badge variant={s.media === 'online' ? 'online' : 'offline'}>{s.media}</Badge>
                          {s.teams?.team_code && <Badge variant="secondary" className="font-mono text-[10px]">{s.teams.team_code}</Badge>}
                        </div>
                        <p className="font-bold text-text-primary leading-tight">{s.topic ?? 'Sesi Bimbingan'}</p>
                        <p className="text-sm text-text-secondary mt-0.5">{formatDate(s.session_date)}</p>
                      </div>
                      {s.drive_report_url ? (
                        <Button size="sm" variant="outline" asChild className="flex-shrink-0">
                          <a href={s.drive_report_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1.5" /> Lihat PDF
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-text-tertiary italic flex-shrink-0">PDF belum tersedia</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
