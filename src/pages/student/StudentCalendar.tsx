import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay, subDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useStudentTeam } from '@/hooks/useTeam'
import { useStudentTasks } from '@/hooks/useTasks'
import { useStudentClasses } from '@/hooks/useClasses'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export function StudentCalendar() {
  const [current, setCurrent] = useState(new Date())
  const { user } = useAuthStore()
  const { data: team } = useStudentTeam()
  const teamId = (team as { id?: string } | null)?.id

  const { data: classes = [] } = useStudentClasses(teamId)
  const { data: tasks = [] } = useStudentTasks(teamId, user?.id)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const WEEK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  return (
    <DashboardLayout title="Kalender">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {format(current, 'MMMM yyyy', { locale: localeId })}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrent(new Date())}>Hari ini</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" />Kelas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />Deadline</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />H-2 Reminder</span>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-surface-200">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-text-tertiary">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayClasses = classes.filter((c) => isSameDay(new Date(c.date), day))
              const dayTasks = tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), day))
              // H-2 reminder: tasks due in 2 days
              const reminderTasks = tasks.filter((t) => t.deadline && isSameDay(subDays(new Date(t.deadline), 2), day) && !t.is_completed)

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'min-h-[90px] p-2 border-b border-r border-surface-100 last:border-r-0',
                    !isSameMonth(day, current) && 'bg-surface-50',
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1',
                    isToday(day) ? 'bg-indigo-600 text-white font-bold' : 'text-text-primary',
                    !isSameMonth(day, current) && 'text-text-tertiary',
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayClasses.slice(0, 1).map((cls) => (
                      <div key={cls.id} className="text-xs bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5 truncate">
                        {cls.time.slice(0, 5)} {cls.topic ?? 'Kelas'}
                      </div>
                    ))}
                    {dayTasks.slice(0, 1).map((task) => (
                      <div key={task.id} className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 truncate">
                        {task.title}
                      </div>
                    ))}
                    {reminderTasks.length > 0 && (
                      <div className="text-xs bg-red-100 text-red-600 rounded px-1.5 py-0.5">
                        H-2: {reminderTasks[0].title}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
