import { useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CalendarGrid, type CalendarEvent } from '@/components/shared/CalendarGrid'
import { useStudentTeam } from '@/hooks/useTeam'
import { useStudentTasks } from '@/hooks/useTasks'
import { useStudentClasses } from '@/hooks/useClasses'
import { useAuthStore } from '@/stores/authStore'

export function StudentCalendar() {
  const studentId = useAuthStore((s) => (s.profile?.role === 'student' ? s.roleId : null))
  const { data: team } = useStudentTeam()
  const teamId = team?.id ?? null

  const { data: classes = [] } = useStudentClasses(teamId)
  const { data: tasks = [] } = useStudentTasks(teamId, studentId)

  const events: CalendarEvent[] = useMemo(() => [
    ...classes.map((c): CalendarEvent => ({
      id: `class-${c.id}`,
      kind: 'class',
      title: c.topic ?? 'Pertemuan',
      date: c.scheduled_at,
      durationMins: c.duration_mins,
      media: c.media,
    })),
    ...tasks.filter((t) => t.deadline && !t.is_completed).map((t): CalendarEvent => ({
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
      subtitle={team?.team_code ? `Tim ${team.team_code} · Kelas & deadline tugas` : 'Kelas & deadline tugas'}
    >
      <CalendarGrid events={events} accent="teal" />
    </DashboardLayout>
  )
}
