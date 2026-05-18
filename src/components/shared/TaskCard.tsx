import { Calendar, Users, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import { useToggleTask } from '@/hooks/useTasks'
import type { Task } from '@/types/database'

interface TaskCardProps {
  task: Task & {
    students?: { id: string; profiles: { full_name: string } | null } | null
    teams?: { team_code: string; research_title: string | null } | null
  }
  canComplete?: boolean
}

export function TaskCard({ task, canComplete = false }: TaskCardProps) {
  const toggleTask = useToggleTask()

  const isOverdue = !!task.deadline && new Date(task.deadline) < new Date() && !task.is_completed
  const assignee: 'individual' | 'team' = task.assigned_student_id ? 'individual' : 'team'

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border transition-all duration-200',
        task.is_completed
          ? 'border-surface-100 bg-surface-50'
          : isOverdue
            ? 'border-red-200 bg-red-50'
            : 'border-surface-200 bg-white hover:shadow-sm',
      )}
    >
      {canComplete && (
        <input
          type="checkbox"
          checked={task.is_completed}
          onChange={(e) => toggleTask.mutate({ taskId: task.id, isCompleted: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            task.is_completed ? 'line-through text-text-tertiary' : 'text-text-primary',
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {task.deadline && (
            <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-danger' : 'text-text-tertiary')}>
              <Calendar className="h-3 w-3" />
              {formatDate(task.deadline)}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-text-tertiary">
            {assignee === 'team' ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {assignee === 'team'
              ? task.teams?.team_code ?? 'Tim'
              : task.students?.profiles?.full_name ?? 'Individu'}
          </span>
        </div>
      </div>
      <Badge variant={task.is_completed ? 'success' : isOverdue ? 'danger' : 'secondary'}>
        {task.is_completed ? 'Selesai' : isOverdue ? 'Terlambat' : 'Aktif'}
      </Badge>
    </div>
  )
}
