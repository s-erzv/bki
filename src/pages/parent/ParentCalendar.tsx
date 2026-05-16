import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useParentStudents } from '@/hooks/useTeam'
import { useStudentClasses } from '@/hooks/useClasses'
import { useStudentTasks } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'

type StudentWithTeam = { id: string; team_members?: Array<{ team_id: string; teams: { id: string } | null }> }

export function ParentCalendar() {
  const [current, setCurrent] = useState(new Date())
  const { data: students = [] } = useParentStudents()
  const child = (students[0] as StudentWithTeam | undefined)
  const teamId = child?.team_members?.[0]?.teams?.id

  const { data: classes = [] } = useStudentClasses(teamId)
  const { data: tasks = [] } = useStudentTasks(teamId, child?.id)

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
          <h2 className="text-lg font-semibold">{format(current, 'MMMM yyyy', { locale: localeId })}</h2>
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
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-surface-200">
            {WEEK_DAYS.map((d) => <div key={d} className="py-3 text-center text-xs font-semibold text-text-tertiary">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayClasses = classes.filter((c) => isSameDay(new Date(c.date), day))
              const dayTasks = tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), day))
              return (
                <div key={day.toString()} className={cn('min-h-[80px] p-2 border-b border-r border-surface-100', !isSameMonth(day, current) && 'bg-surface-50')}>
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1', isToday(day) ? 'bg-violet-600 text-white font-bold' : 'text-text-primary', !isSameMonth(day, current) && 'text-text-tertiary')}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayClasses.map((c) => <div key={c.id} className="text-xs bg-violet-100 text-violet-700 rounded px-1 py-0.5 truncate">{c.topic ?? 'Kelas'}</div>)}
                    {dayTasks.map((t) => <div key={t.id} className="text-xs bg-amber-100 text-amber-700 rounded px-1 py-0.5 truncate">{t.title}</div>)}
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
