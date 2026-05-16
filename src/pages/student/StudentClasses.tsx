import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ClassCard } from '@/components/shared/ClassCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentTeam } from '@/hooks/useTeam'
import { useStudentClasses } from '@/hooks/useClasses'

export function StudentClasses() {
  const { data: team } = useStudentTeam()
  const teamId = (team as { id?: string } | null)?.id
  const { data: classes = [], isLoading } = useStudentClasses(teamId)

  return (
    <DashboardLayout title="Daftar Kelas">
      <div className="space-y-4">
        <p className="text-text-secondary text-sm">{classes.length} kelas</p>
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary">Belum ada kelas terjadwal.</div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls) => (
              <ClassCard key={cls.id} cls={cls as Parameters<typeof ClassCard>[0]['cls']} showJoinBtn />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
