import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TaskCard } from '@/components/shared/TaskCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentTeam } from '@/hooks/useTeam'
import { useStudentTasks } from '@/hooks/useTasks'
import { useAuthStore } from '@/stores/authStore'

export function StudentTasks() {
  const { user } = useAuthStore()
  const { data: team } = useStudentTeam()
  const teamId = (team as { id?: string } | null)?.id
  const { data: tasks = [], isLoading } = useStudentTasks(teamId, user?.id)

  const pending = tasks.filter((t) => !t.is_completed)
  const done = tasks.filter((t) => t.is_completed)

  return (
    <DashboardLayout title="Daftar Tugas">
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <>
            {pending.length > 0 && (
              <section>
                <h3 className="font-semibold text-text-primary mb-3">Belum Selesai ({pending.length})</h3>
                <div className="space-y-2">
                  {pending.map((task) => <TaskCard key={task.id} task={task} canComplete />)}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section>
                <h3 className="font-semibold text-text-primary mb-3">Sudah Selesai ({done.length})</h3>
                <div className="space-y-2">
                  {done.map((task) => <TaskCard key={task.id} task={task} canComplete />)}
                </div>
              </section>
            )}
            {tasks.length === 0 && (
              <div className="text-center py-16 text-text-tertiary">Belum ada tugas.</div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
