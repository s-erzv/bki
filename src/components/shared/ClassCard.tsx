import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Video, MapPin, Clock, ExternalLink, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import type { Class } from '@/types/database'

interface ClassCardProps {
  cls: Class & { class_teams?: { teams: { team_code: string; nama_tim: string | null } | null }[] }
  showReportBtn?: boolean
  showJoinBtn?: boolean
}

export function ClassCard({ cls, showReportBtn = false, showJoinBtn = false }: ClassCardProps) {
  const navigate = useNavigate()

  const dateStr = format(new Date(cls.date), 'EEEE, dd MMMM yyyy', { locale: localeId })

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={cls.media === 'online' ? 'online' : 'offline'}>
                {cls.media === 'online' ? 'Online' : 'Offline'}
              </Badge>
              {cls.class_teams?.map((ct) => ct.teams && (
                <Badge key={ct.teams.team_code} variant="secondary">
                  {ct.teams.team_code}
                </Badge>
              ))}
            </div>
            <h3 className="font-semibold text-text-primary mb-1">{cls.topic ?? 'Pertemuan'}</h3>
            <p className="text-sm text-text-secondary">{dateStr}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="h-3.5 w-3.5" />
                {cls.time.slice(0, 5)} WIB
                {cls.duration_minutes && ` • ${cls.duration_minutes} menit`}
              </span>
              {cls.media === 'offline' && cls.location && (
                <span className="flex items-center gap-1 text-xs text-text-tertiary">
                  <MapPin className="h-3.5 w-3.5" />
                  {cls.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {showJoinBtn && cls.media === 'online' && cls.gmeet_link && (
              <Button size="sm" asChild>
                <a href={cls.gmeet_link} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4" />
                  Masuk Kelas
                </a>
              </Button>
            )}
            {showJoinBtn && cls.media === 'offline' && cls.maps_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={cls.maps_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Lihat Lokasi
                </a>
              </Button>
            )}
            {showReportBtn && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/coach/report?classId=${cls.id}`)}
              >
                <FileText className="h-4 w-4" />
                Isi Laporan
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
