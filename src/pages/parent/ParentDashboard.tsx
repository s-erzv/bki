import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ExternalLink } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { ScoreChart } from '@/components/shared/ScoreChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useParentStudents } from '@/hooks/useTeam'
import { useStudentTasks } from '@/hooks/useTasks'
import { useStudentSessions } from '@/hooks/useSessions'
import { useStudentClasses } from '@/hooks/useClasses'
import { formatDate } from '@/lib/utils'

type StudentWithTeam = {
  id: string
  nama: string
  foto_url: string | null
  team_members?: Array<{ team_id: string; teams: { id: string; team_code: string; judul_penelitian: string | null } | null }>
}

export function ParentDashboard() {
  const navigate = useNavigate()
  const { data: students = [], isLoading } = useParentStudents()
  const [selectedIdx, setSelectedIdx] = useState(0)

  const child = (students[selectedIdx] as StudentWithTeam | undefined) ?? null
  const childTeam = child?.team_members?.[0]?.teams ?? null
  const teamId = childTeam?.id

  const { data: tasks = [] } = useStudentTasks(teamId, child?.id)
  const { data: sessions = [] } = useStudentSessions(teamId)
  const { data: classes = [] } = useStudentClasses(teamId)

  const completedTasks = tasks.filter((t) => t.is_completed).length
  const totalTasks = tasks.length
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Average scores across all sessions for this student
  const studentReports = sessions.flatMap((s) =>
    ((s as { session_student_reports?: Array<{ student_id: string; score_penguasaan?: number | null; score_presentasi?: number | null; score_keaktifan?: number | null; score_kedisiplinan?: number | null; score_kreativitas?: number | null }> }).session_student_reports ?? [])
      .filter((r) => r.student_id === child?.id)
  )

  const avg = (key: string) => {
    const vals = studentReports
      .map((r) => (r as unknown as Record<string, number | null>)[key])
      .filter((v): v is number => typeof v === 'number')
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  }

  const avgScores = {
    penguasaan: avg('score_penguasaan'),
    presentasi: avg('score_presentasi'),
    keaktifan: avg('score_keaktifan'),
    kedisiplinan: avg('score_kedisiplinan'),
    kreativitas: avg('score_kreativitas'),
  }

  const nextClass = classes
    .filter((c) => new Date(`${c.date}T${c.time}`) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return (
    <DashboardLayout title="Dashboard">
      {/* Child selector */}
      {students.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {students.map((s, i) => (
            <button
              key={(s as StudentWithTeam).id}
              onClick={() => setSelectedIdx(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                i === selectedIdx ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-text-secondary'
              }`}
            >
              {(s as StudentWithTeam).nama}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : !child ? (
        <div className="text-center py-16 text-text-tertiary">Tidak ada anak yang dipantau.</div>
      ) : (
        <div className="space-y-6">
          {/* Child profile */}
          <Card>
            <CardContent className="p-6 flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                {child.foto_url ? (
                  <img src={child.foto_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-violet-600">{child.nama.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-text-primary">{child.nama}</h2>
                {childTeam && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-text-secondary font-mono bg-surface-100 px-2 py-0.5 rounded">{childTeam.team_code}</span>
                    {childTeam.judul_penelitian && (
                      <span className="text-sm text-text-secondary italic truncate">{childTeam.judul_penelitian}</span>
                    )}
                  </div>
                )}
                <div className="mt-3">
                  <ProgressBar value={progressPct} label={`Tugas: ${completedTasks}/${totalTasks} selesai`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Score chart */}
            <Card>
              <CardHeader><CardTitle>Rata-rata Nilai</CardTitle></CardHeader>
              <CardContent>
                {studentReports.length === 0 ? (
                  <p className="text-sm text-text-tertiary py-4 text-center">Belum ada data nilai</p>
                ) : (
                  <ScoreChart scores={avgScores} size={260} />
                )}
              </CardContent>
            </Card>

            {/* Next class + links */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Kelas Berikutnya</CardTitle></CardHeader>
                <CardContent>
                  {!nextClass ? (
                    <p className="text-sm text-text-tertiary">Tidak ada jadwal kelas</p>
                  ) : (
                    <div>
                      <p className="font-medium text-text-primary">{nextClass.topic ?? 'Pertemuan'}</p>
                      <p className="text-sm text-text-secondary mt-1">{formatDate(nextClass.date)} • {nextClass.time.slice(0, 5)} WIB</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/parent/reports')}>
                  <FileText className="h-4 w-4" />Lihat Laporan Sesi
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <ExternalLink className="h-4 w-4" />Google Drive Anak
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
