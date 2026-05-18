import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Database, Task, TaskRef } from '@/types/database'

type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']
type TaskRefInsert = Database['public']['Tables']['task_refs']['Insert']

export interface TaskWithRefs extends Task {
  task_refs: TaskRef[]
  teams: { id: string; team_code: string; research_title: string | null } | null
  students: { id: string; profiles: { full_name: string } | null } | null
}

/* ─── Queries ───────────────────────────────────────────── */

export function useCoachTasks() {
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))

  return useQuery<TaskWithRefs[]>({
    queryKey: ['tasks', 'coach', coachId],
    queryFn: async () => {
      if (!coachId) return []
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_refs(*),
          teams(id, team_code, research_title),
          students:assigned_student_id(id, profiles(full_name))
        `)
        .eq('created_by_coach_id', coachId)
        .order('deadline', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as unknown as TaskWithRefs[]
    },
    enabled: !!coachId,
  })
}

export function useStudentTasks(teamId: string | null | undefined, studentId: string | null | undefined) {
  return useQuery<TaskWithRefs[]>({
    queryKey: ['tasks', 'student', teamId, studentId],
    queryFn: async () => {
      if (!teamId && !studentId) return []
      let q = supabase
        .from('tasks')
        .select(`
          *,
          task_refs(*),
          teams(id, team_code, research_title),
          students:assigned_student_id(id, profiles(full_name))
        `)
        .order('deadline', { ascending: true, nullsFirst: false })

      if (teamId && studentId) {
        // Team tasks (no specific assignee) OR tasks assigned to this student.
        q = q.or(`assigned_student_id.is.null,assigned_student_id.eq.${studentId}`).eq('team_id', teamId)
      } else if (teamId) {
        q = q.eq('team_id', teamId)
      } else if (studentId) {
        q = q.eq('assigned_student_id', studentId)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as TaskWithRefs[]
    },
    enabled: !!(teamId || studentId),
  })
}

/* ─── Mutations ─────────────────────────────────────────── */

export function useCreateTask() {
  const qc = useQueryClient()
  const coachId = useAuthStore((s) => (s.profile?.role === 'coach' ? s.roleId : null))

  return useMutation({
    mutationFn: async ({
      task, refs,
    }: {
      task: Omit<TaskInsert, 'created_by_coach_id'>
      refs: Omit<TaskRefInsert, 'task_id'>[]
    }) => {
      if (!coachId) throw new Error('Akun pembimbing belum lengkap')
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, created_by_coach_id: coachId })
        .select()
        .single()
      if (error) throw error
      const created = data as Task
      if (refs.length > 0) {
        const { error: rErr } = await supabase
          .from('task_refs')
          .insert(refs.map((r) => ({ ...r, task_id: created.id })))
        if (rErr) throw rErr
      }
      return created
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useToggleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskId, task, refs,
    }: {
      taskId: string
      task: Omit<TaskUpdate, 'id' | 'created_by_coach_id'>
      refs: Omit<TaskRefInsert, 'task_id'>[]
    }) => {
      const { error } = await supabase.from('tasks').update(task).eq('id', taskId)
      if (error) throw error
      // Refs: replace-all strategy. Delete existing, then insert the new set.
      const { error: delErr } = await supabase.from('task_refs').delete().eq('task_id', taskId)
      if (delErr) throw delErr
      if (refs.length > 0) {
        const { error: insErr } = await supabase
          .from('task_refs')
          .insert(refs.map((r) => ({ ...r, task_id: taskId })))
        if (insErr) throw insErr
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      // No ON DELETE CASCADE on task_refs.task_id, so we delete refs first.
      const { error: rErr } = await supabase.from('task_refs').delete().eq('task_id', taskId)
      if (rErr) throw rErr
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useSubmitTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, submissionUrl }: { taskId: string; submissionUrl: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update({
          submission_url: submissionUrl,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
