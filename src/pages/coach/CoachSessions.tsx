import { useNavigate } from 'react-router-dom'
import { Plus, FileText, ExternalLink } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCoachSessions } from '@/hooks/useSessions'
import { formatDate } from '@/lib/utils'

export function CoachSessions() {
  const navigate = useNavigate()
  const { data: sessions = [], isLoading } = useCoachSessions()

  return (
    <DashboardLayout title="Laporan Sesi">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-text-secondary text-sm">{sessions.length} sesi tercatat</p>
          <Button onClick={() => navigate('/coach/report')}>
            <Plus className="h-4 w-4" />Isi Laporan Baru
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Belum ada laporan sesi.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={s.media === 'online' ? 'online' : 'offline'}>{s.media}</Badge>
                      {s.teams?.team_code && <Badge variant="secondary">{s.teams.team_code}</Badge>}
                    </div>
                    <p className="font-medium text-text-primary truncate">{s.topic ?? 'Sesi'}</p>
                    <p className="text-sm text-text-secondary">
                      {formatDate(s.session_date)}
                      {s.duration_mins ? ` • ${s.duration_mins} menit` : ''}
                    </p>
                  </div>
                  {s.drive_report_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={s.drive_report_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />PDF
                      </a>
                    </Button>
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
