import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database, Task, TaskRef } from '@/types/database'

type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskRefInsert = Database['public']['Tables']['task_refs']['Insert']

export interface TaskWithRefs extends Task {
  task_refs: TaskRef[]
  students: { id: string; nama: string } | null
  teams: { id: string; team_code: string; nama_tim: string | null } | null
}

export function useCoachTasks() {
  const userId = useAuthStore((s) => s.user?.id)

  return useQuery<TaskWithRefs[]>({
    queryKey: ['tasks', 'coach', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', userId)
        .is('deleted_at', null)

      const teamIds = ((teams ?? []) as Array<{ id: string }>).map((t) => t.id)
      if (teamIds.length === 0) return []

      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_refs(*), students(id, nama), teams(id, team_code, nama_tim)')
        .in('team_id', teamIds)
        .is('deleted_at', null)
        .order('deadline', { ascending: true })
      if (error) throw error
      return (data ?? []) as TaskWithRefs[]
    },
    enabled: !!userId,
  })
}

export function useStudentTasks(teamId: string | null | undefined, studentId: string | null | undefined) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'student', teamId, studentId],
    queryFn: async () => {
      if (!teamId && !studentId) return []
      let query = supabase
        .from('tasks')
        .select('*, task_refs(*)')
        .is('deleted_at', null)
        .order('deadline', { ascending: true })

      if (teamId && studentId) {
        query = query.or(`team_id.eq.${teamId},student_id.eq.${studentId}`)
      } else if (teamId) {
        query = query.eq('team_id', teamId)
      } else if (studentId) {
        query = query.eq('student_id', studentId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Task[]
    },
    enabled: !!(teamId || studentId),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: async ({
      task,
      refs,
    }: {
      task: Omit<TaskInsert, 'created_by'>
      refs: Omit<TaskRefInsert, 'task_id'>[]
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, created_by: userId })
        .select()
        .single()
      if (error) throw error

      const newTask = data as Task
      if (refs.length > 0) {
        const { error: refsError } = await supabase
          .from('task_refs')
          .insert(refs.map((r) => ({ ...r, task_id: newTask.id })))
        if (refsError) throw refsError
      }
      return newTask
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useToggleTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: isCompleted })
        .eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
