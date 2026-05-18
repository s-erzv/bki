import { useMemo, useState } from 'react'
import { BookOpen, Video, MapPin, ExternalLink, Users } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useStudentTeam } from '@/hooks/useTeam'
import { useStudentClasses } from '@/hooks/useClasses'
import { cn, formatWIB } from '@/lib/utils'

type Filter = 'upcoming' | 'past'

export function StudentClasses() {
  const [filter, setFilter] = useState<Filter>('upcoming')
  const { data: team } = useStudentTeam()
  const { data: classes = [], isLoading } = useStudentClasses(team?.id)

  const now = Date.now()
  const filtered = useMemo(() => {
    const list = filter === 'upcoming'
      ? classes.filter((c) => new Date(c.scheduled_at).getTime() >= now)
      : classes.filter((c) => new Date(c.scheduled_at).getTime() < now)
    return [...list].sort((a, b) => {
      const av = new Date(a.scheduled_at).getTime()
      const bv = new Date(b.scheduled_at).getTime()
      return filter === 'past' ? bv - av : av - bv
    })
  }, [classes, filter, now])

  const counts = {
    upcoming: classes.filter((c) => new Date(c.scheduled_at).getTime() >= now).length,
    past:     classes.filter((c) => new Date(c.scheduled_at).getTime() < now).length,
  }

  return (
    <DashboardLayout
      title="Daftar Kelas"
      subtitle={team?.team_code ? `Kelas tim ${team.team_code}` : 'Kelas bimbinganmu'}
    >
      <div className="space-y-5">
        <div className="inline-flex items-center gap-1 rounded-xl border border-surface-200 bg-white p-1 shadow-soft">
          {(['upcoming', 'past'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 h-8 rounded-lg text-xs font-bold transition-all',
                filter === f
                  ? 'bg-primary-950 text-white shadow-soft'
                  : 'text-text-secondary hover:bg-surface-50 hover:text-text-primary',
              )}
            >
              {f === 'upcoming' ? 'Mendatang' : 'Selesai'}
              <span className="ml-1.5 text-[10px] opacity-70 tabular-nums">{counts[f]}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={BookOpen}
                title={filter === 'upcoming' ? 'Belum ada kelas terjadwal' : 'Belum ada kelas selesai'}
                description={filter === 'upcoming' ? 'Pembimbing akan menjadwalkan kelas via dashboard.' : 'Kelas yang sudah lewat akan muncul di sini.'}
                size="lg"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const isPast = new Date(c.scheduled_at).getTime() < now
              return (
                <Card key={c.id} className="overflow-hidden hover:shadow-lift transition-all">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className={cn(
                        'flex sm:flex-col items-center justify-center gap-3 sm:gap-1 p-5 sm:w-32 flex-shrink-0',
                        isPast ? 'bg-surface-100 text-text-secondary' : 'bg-gradient-to-br from-accent-teal to-primary-600 text-white',
                      )}>
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">{formatWIB(c.scheduled_at, 'EEE')}</p>
                          <p className="text-3xl font-extrabold tabular-nums leading-tight">{formatWIB(c.scheduled_at, 'd')}</p>
                          <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">{formatWIB(c.scheduled_at, 'MMM yyyy')}</p>
                        </div>
                        <div className="hidden sm:block w-8 h-px bg-white/20" />
                        <p className="text-sm font-bold tabular-nums">{formatWIB(c.scheduled_at, 'HH:mm')}</p>
                      </div>

                      <div className="flex-1 p-5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <Badge variant={c.media === 'online' ? 'success' : 'secondary'} className="gap-1 text-[10px]">
                            {c.media === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            {c.media === 'online' ? 'Online' : 'Tatap Muka'}
                          </Badge>
                          {c.duration_mins && (
                            <span className="text-[11px] text-text-tertiary">{c.duration_mins} menit</span>
                          )}
                          {isPast && <Badge variant="outline" className="text-[10px]">Selesai</Badge>}
                        </div>
                        <h3 className="text-base font-bold text-text-primary leading-snug">{c.topic ?? 'Pertemuan'}</h3>
                        <p className="text-xs text-text-tertiary mt-1">
                          {formatWIB(c.scheduled_at, 'EEEE, d MMMM yyyy · HH:mm')} WIB
                        </p>
                        {c.media === 'offline' && c.location && (
                          <p className="mt-2 text-xs text-text-secondary inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" /> {c.location}
                          </p>
                        )}
                        {team?.team_code && (
                          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-text-tertiary">
                            <Users className="h-3 w-3" />
                            <Badge variant="outline" className="font-mono text-[10px]">{team.team_code}</Badge>
                          </div>
                        )}
                      </div>

                      {!isPast && (
                        <div className="flex sm:flex-col items-stretch justify-end gap-2 p-5 sm:w-40 bg-surface-50/40 sm:border-l border-surface-100">
                          {c.media === 'online' && c.gmeet_link && (
                            <Button asChild className="flex-1 sm:flex-none">
                              <a href={c.gmeet_link} target="_blank" rel="noopener noreferrer">
                                <Video className="h-3.5 w-3.5 mr-1.5" /> Masuk Meet
                              </a>
                            </Button>
                          )}
                          {c.media === 'offline' && c.maps_url && (
                            <Button asChild variant="outline" className="flex-1 sm:flex-none">
                              <a href={c.maps_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Lihat Maps
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
