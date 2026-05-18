import { ExternalLink, FileText } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useParentStudents } from '@/hooks/useTeam'
import { useStudentSessions } from '@/hooks/useSessions'
import { formatDate } from '@/lib/utils'

export function ParentReports() {
  const { data: students = [], isLoading: studentsLoading } = useParentStudents()
  const child = students[0]
  const teamId = child?.team_members?.[0]?.teams?.id ?? null
  const { data: sessions = [], isLoading: sessionsLoading } = useStudentSessions(teamId)

  const isLoading = studentsLoading || sessionsLoading

  return (
    <DashboardLayout title="Laporan Sesi">
      <div className="space-y-4">
        <p className="text-text-secondary text-sm">{sessions.length} sesi tercatat</p>
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Belum ada laporan sesi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={s.media === 'online' ? 'online' : 'offline'}>{s.media}</Badge>
                    </div>
                    <p className="font-medium text-text-primary">{s.topic ?? 'Sesi Bimbingan'}</p>
                    <p className="text-sm text-text-secondary">{formatDate(s.session_date)}</p>
                  </div>
                  {s.drive_report_url ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={s.drive_report_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> Lihat PDF
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-text-tertiary">PDF belum tersedia</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
