import { useMemo, useState } from 'react'
import { CalendarPlus, ClipboardList } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CalendarGrid, type CalendarEvent } from '@/components/shared/CalendarGrid'
import { SetKelasForm } from '@/components/shared/SetKelasForm'
import { SetTugasForm } from '@/components/shared/SetTugasForm'
import { Button } from '@/components/ui/button'
import { useCoachClasses } from '@/hooks/useClasses'
import { useCoachTasks } from '@/hooks/useTasks'
import { useGoogleCalendarEvents } from '@/hooks/useGoogleCalendarEvents'
import { useGoogleDriveAccess } from '@/hooks/useGoogleDriveAccess'
import { formatWIB } from '@/lib/utils'

export function CoachCalendar() {
  const [openKelas, setOpenKelas] = useState(false)
  const [openTugas, setOpenTugas] = useState(false)
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined)

  const { data: classes = [] } = useCoachClasses()
  const { data: tasks = [] } = useCoachTasks()
  const { data: gcalEvents = [], isFetching: gcalFetching, error: gcalError } = useGoogleCalendarEvents()
  const { hasAccess: hasGoogleAccess } = useGoogleDriveAccess()

  // BKI classes that already exist in Google Calendar — dedupe so the same
  // event doesn't render twice (once as 'class', once as 'gcal').
  const bkiGcalIds = useMemo(
    () => new Set(classes.map((c) => c.gcal_event_id).filter(Boolean) as string[]),
    [classes],
  )

  const events: CalendarEvent[] = useMemo(() => [
    ...classes.map((c): CalendarEvent => ({
      id: `class-${c.id}`,
      kind: 'class',
      title: c.topic ?? 'Pertemuan',
      date: c.scheduled_at,
      durationMins: c.duration_mins,
      media: c.media,
      teamCode: c.class_teams?.[0]?.teams?.team_code ?? null,
    })),
    ...tasks.filter((t) => t.deadline).map((t): CalendarEvent => ({
      id: `task-${t.id}`,
      kind: 'task',
      title: t.title,
      date: t.deadline as string,
      teamCode: t.teams?.team_code ?? null,
    })),
    ...gcalEvents
      .filter((e) => !bkiGcalIds.has(e.id))
      .map((e): CalendarEvent => ({
        id: `gcal-${e.id}`,
        kind: 'gcal',
        title: e.summary,
        date: e.start,
        allDay: e.isAllDay,
        href: e.htmlLink ?? undefined,
      })),
  ], [classes, tasks, gcalEvents, bkiGcalIds])

  return (
    <DashboardLayout
      title="Kalender Bimbingan"
      subtitle={
        hasGoogleAccess
          ? 'Kelas BKI + jadwal Google Calendar coach untuk hindari bentrok'
          : 'Hubungkan Google Calendar di dashboard untuk lihat jadwal pribadi di sini'
      }
    >
      {gcalError && (
        <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/5 px-4 py-3 text-sm text-accent-red">
          Gagal load Google Calendar: {gcalError instanceof Error ? gcalError.message : String(gcalError)}
        </div>
      )}
      {hasGoogleAccess && gcalFetching && (
        <p className="mb-3 text-xs text-text-tertiary inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
          Sync Google Calendar…
        </p>
      )}

      <CalendarGrid
        events={events}
        accent="primary"
        onEventClick={(e) => {
          if (e.kind === 'gcal' && e.href) {
            window.open(e.href, '_blank', 'noopener,noreferrer')
          }
        }}
        onDayClick={(d) => { setDefaultDate(formatWIB(d.toISOString(), 'yyyy-MM-dd')); setOpenKelas(true) }}
        toolbar={
          <>
            <Button variant="outline" onClick={() => setOpenTugas(true)} className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Berikan Tugas</span>
              <span className="sm:hidden">Tugas</span>
            </Button>
            <Button onClick={() => { setDefaultDate(undefined); setOpenKelas(true) }} className="gap-1.5">
              <CalendarPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Jadwalkan Kelas</span>
              <span className="sm:hidden">Kelas</span>
            </Button>
          </>
        }
      />

      <SetKelasForm open={openKelas} onOpenChange={setOpenKelas} defaultDate={defaultDate} />
      <SetTugasForm open={openTugas} onOpenChange={setOpenTugas} />
    </DashboardLayout>
  )
}
