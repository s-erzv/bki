import { useMemo, useState } from 'react'
import { CalendarPlus, ClipboardList } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CalendarGrid, type CalendarEvent } from '@/components/shared/CalendarGrid'
import { SetKelasForm } from '@/components/shared/SetKelasForm'
import { SetTugasForm } from '@/components/shared/SetTugasForm'
import { Button } from '@/components/ui/button'
import { useCoachClasses } from '@/hooks/useClasses'
import { useCoachTasks } from '@/hooks/useTasks'
import { formatWIB } from '@/lib/utils'

export function CoachCalendar() {
  const [openKelas, setOpenKelas] = useState(false)
  const [openTugas, setOpenTugas] = useState(false)
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined)

  const { data: classes = [] } = useCoachClasses()
  const { data: tasks = [] } = useCoachTasks()

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
  ], [classes, tasks])

  return (
    <DashboardLayout
      title="Kalender Bimbingan"
      subtitle="Semua kelas, deadline tugas & reminder WhatsApp"
    >
      <CalendarGrid
        events={events}
        accent="primary"
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
