import { useState, useMemo } from 'react'
import { CalendarPlus, MapPin, Video, Users, BookOpen, FilePlus2, ExternalLink } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SetKelasForm } from '@/components/shared/SetKelasForm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useCoachClasses } from '@/hooks/useClasses'
import { useNavigate } from 'react-router-dom'
import { cn, formatWIB } from '@/lib/utils'

type Filter = 'upcoming' | 'past' | 'all'

export function CoachClasses() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const { data: classes = [], isLoading } = useCoachClasses()

  const now = Date.now()
  const filtered = useMemo(() => {
    const list = filter === 'upcoming'
      ? classes.filter((c) => new Date(c.scheduled_at).getTime() >= now)
      : filter === 'past'
        ? classes.filter((c) => new Date(c.scheduled_at).getTime() < now)
        : classes
    return [...list].sort((a, b) => {
      const av = new Date(a.scheduled_at).getTime()
      const bv = new Date(b.scheduled_at).getTime()
      return filter === 'past' ? bv - av : av - bv
    })
  }, [classes, filter, now])

  const counts = {
    upcoming: classes.filter((c) => new Date(c.scheduled_at).getTime() >= now).length,
    past:     classes.filter((c) => new Date(c.scheduled_at).getTime() < now).length,
    all:      classes.length,
  }

  return (
    <DashboardLayout
      title="Daftar Kelas"
      subtitle={`${classes.length} kelas total · ${counts.upcoming} mendatang`}
      actions={
        <Button onClick={() => setOpen(true)} className="gap-1.5">
          <CalendarPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Jadwalkan Kelas</span>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Filter tabs */}
        <div className="inline-flex items-center gap-1 rounded-xl border border-surface-200 bg-white p-1 shadow-soft">
          {(['upcoming', 'past', 'all'] as Filter[]).map((f) => (
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
              {f === 'upcoming' ? 'Mendatang' : f === 'past' ? 'Selesai' : 'Semua'}
              <span className="ml-1.5 text-[10px] opacity-70 tabular-nums">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={BookOpen}
                title={filter === 'upcoming' ? 'Belum ada kelas mendatang' : filter === 'past' ? 'Belum ada kelas selesai' : 'Belum ada kelas'}
                description="Jadwalkan kelas baru lewat tombol di kanan atas."
                action={
                  <Button onClick={() => setOpen(true)} size="sm">
                    <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Jadwalkan Kelas
                  </Button>
                }
                size="lg"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const teams = (c.class_teams ?? []).map((ct) => ct.teams).filter(Boolean) as Array<{ team_code: string; research_title: string | null }>
              const isPast = new Date(c.scheduled_at).getTime() < now
              return (
                <Card key={c.id} className={cn('overflow-hidden transition-all hover:shadow-lift', isPast && 'opacity-90')}>
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Date block */}
                      <div className={cn(
                        'flex sm:flex-col items-center justify-center gap-3 sm:gap-1 p-5 sm:w-32 flex-shrink-0',
                        isPast ? 'bg-surface-100 text-text-secondary' : 'bg-primary-950 text-white',
                      )}>
                        <div className="text-center">
                          <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">{formatWIB(c.scheduled_at, 'EEE')}</p>
                          <p className="text-3xl font-extrabold tabular-nums leading-tight">{formatWIB(c.scheduled_at, 'd')}</p>
                          <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">{formatWIB(c.scheduled_at, 'MMM yyyy')}</p>
                        </div>
                        <div className="hidden sm:block w-8 h-px bg-white/20" />
                        <p className="text-sm font-bold tabular-nums">{formatWIB(c.scheduled_at, 'HH:mm')}</p>
                      </div>

                      {/* Main info */}
                      <div className="flex-1 p-5 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              <Badge variant={c.media === 'online' ? 'success' : 'secondary'} className="gap-1 text-[10px]">
                                {c.media === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                {c.media === 'online' ? 'Online' : 'Tatap Muka'}
                              </Badge>
                              {c.duration_mins && (
                                <span className="text-[11px] text-text-tertiary">{c.duration_mins} menit</span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-text-primary leading-snug">{c.topic ?? 'Pertemuan'}</h3>
                            <p className="text-xs text-text-tertiary mt-0.5">
                              {formatWIB(c.scheduled_at, 'EEEE, d MMMM yyyy · HH:mm')} WIB
                            </p>
                          </div>
                        </div>

                        {/* Teams */}
                        {teams.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            <Users className="h-3 w-3 text-text-tertiary" />
                            {teams.map((t, i) => (
                              <Badge key={i} variant="outline" className="font-mono text-[10px]">{t.team_code}</Badge>
                            ))}
                          </div>
                        )}

                        {/* Location / link */}
                        {c.media === 'offline' && c.location && (
                          <p className="mt-2 text-xs text-text-secondary inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" /> {c.location}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-stretch justify-end gap-2 p-5 sm:w-44 bg-surface-50/40 sm:border-l border-surface-100">
                        {!isPast && c.media === 'online' && c.gmeet_link && (
                          <Button asChild size="sm" className="flex-1 sm:flex-none">
                            <a href={c.gmeet_link} target="_blank" rel="noopener noreferrer">
                              <Video className="h-3.5 w-3.5 mr-1.5" /> Masuk Meet
                            </a>
                          </Button>
                        )}
                        {c.media === 'offline' && c.maps_url && (
                          <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
                            <a href={c.maps_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Maps
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => navigate(`/coach/report?classId=${c.id}`)}
                        >
                          <FilePlus2 className="h-3.5 w-3.5 mr-1.5" /> Buat Laporan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <SetKelasForm open={open} onOpenChange={setOpen} />
    </DashboardLayout>
  )
}
