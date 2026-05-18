import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CalendarGrid, type CalendarEvent } from '@/components/shared/CalendarGrid'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import { useParentStudents } from '@/hooks/useTeam'
import { useStudentClasses } from '@/hooks/useClasses'
import { useStudentTasks } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'

export function ParentCalendar() {
  const { data: students = [] } = useParentStudents()
  const [selectedIdx, setSelectedIdx] = useState(0)

  const child = students[selectedIdx] ?? null
  const childTeam = child?.team_members?.[0]?.teams ?? null
  const teamId = childTeam?.id ?? null

  const { data: classes = [] } = useStudentClasses(teamId)
  const { data: tasks = [] } = useStudentTasks(teamId, child?.id ?? null)

  const events: CalendarEvent[] = useMemo(() => [
    ...classes.map((c): CalendarEvent => ({
      id: `class-${c.id}`,
      kind: 'class',
      title: c.topic ?? 'Pertemuan',
      date: c.scheduled_at,
      durationMins: c.duration_mins,
      media: c.media,
    })),
    ...tasks.filter((t) => t.deadline).map((t): CalendarEvent => ({
      id: `task-${t.id}`,
      kind: 'task',
      title: t.title,
      date: t.deadline as string,
    })),
  ], [classes, tasks])

  return (
    <DashboardLayout
      title="Kalender Anak"
      subtitle={child?.profiles?.full_name ? `Jadwal ${child.profiles.full_name.split(' ')[0]}` : 'Pantau jadwal anak'}
    >
      {students.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
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
        <CalendarGrid events={events} accent="purple" />
      )}
    </DashboardLayout>
  )
}
