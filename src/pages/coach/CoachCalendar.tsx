import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useCoachClasses } from '@/hooks/useClasses'
import { useCoachTasks } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'

export function CoachCalendar() {
  const [current, setCurrent] = useState(new Date())
  const { data: classes = [] } = useCoachClasses()
  const { data: tasks = [] } = useCoachTasks()

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const prev = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1))
  const next = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1))

  const getClassesForDay = (day: Date) =>
    classes.filter((c) => isSameDay(new Date(c.date), day))

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), day))

  const WEEK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  return (
    <DashboardLayout title="Kalender">
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {format(current, 'MMMM yyyy', { locale: localeId })}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrent(new Date())}>Hari ini</Button>
            <Button variant="outline" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500 block" />Kelas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />Tugas</span>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          {/* Week headers */}
          <div className="grid grid-cols-7 border-b border-surface-200">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-text-tertiary">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayClasses = getClassesForDay(day)
              const dayTasks = getTasksForDay(day)
              const hasEvents = dayClasses.length > 0 || dayTasks.length > 0

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
                    isToday(day) ? 'bg-primary-600 text-white font-bold' : 'text-text-primary',
                    !isSameMonth(day, current) && 'text-text-tertiary',
                  )}>
                    {format(day, 'd')}
                  </div>
                  {hasEvents && (
                    <div className="space-y-0.5">
                      {dayClasses.slice(0, 2).map((cls) => (
                        <div key={cls.id} className="text-xs bg-primary-100 text-primary-700 rounded px-1.5 py-0.5 truncate">
                          {cls.time.slice(0, 5)} {cls.topic ?? 'Kelas'}
                        </div>
                      ))}
                      {dayTasks.slice(0, 2).map((task) => (
                        <div key={task.id} className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 truncate">
                          {task.title}
                        </div>
                      ))}
                      {(dayClasses.length + dayTasks.length) > 2 && (
                        <div className="text-xs text-text-tertiary px-1">+{dayClasses.length + dayTasks.length - 2} lagi</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
