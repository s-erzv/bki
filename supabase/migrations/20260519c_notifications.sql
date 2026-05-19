-- ─────────────────────────────────────────────────────────────────────────
-- Migration: in-app notifications
--
-- Adds:
--   1. notifications table (per-user, with read_at, link to deep-link)
--   2. RLS: each user reads/updates only their own
--   3. Auto-triggers on tasks/class_teams/sessions to materialize notifs
--      for the right recipients
--
-- Run in Supabase Dashboard → SQL Editor. Idempotent.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_profile_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type                 text        NOT NULL,   -- 'task_new', 'class_scheduled', 'session_report', etc
  title                text        NOT NULL,
  body                 text,
  link                 text,                   -- in-app path (e.g., '/student/tasks')
  ref_type             text,                   -- 'task' | 'class' | 'session'
  ref_id               uuid,
  read_at              timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications(recipient_profile_id, read_at, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user reads own notifications"     ON public.notifications;
DROP POLICY IF EXISTS "user updates own notifications"   ON public.notifications;
DROP POLICY IF EXISTS "system inserts notifications"     ON public.notifications;

CREATE POLICY "user reads own notifications"
ON public.notifications
FOR SELECT TO authenticated
USING (
  recipient_profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "user updates own notifications"
ON public.notifications
FOR UPDATE TO authenticated
USING (
  recipient_profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  recipient_profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
  )
);

-- Triggers run as SECURITY DEFINER so they bypass RLS for INSERT.
-- Still allow authenticated inserts for any future server-side flows.
CREATE POLICY "system inserts notifications"
ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (true);

-- ── Triggers ─────────────────────────────────────────────────────────────

-- New task → notify the assigned student, or all team members if not assigned.
CREATE OR REPLACE FUNCTION public.notify_on_new_task()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_team_code text;
BEGIN
  SELECT team_code INTO v_team_code FROM public.teams WHERE id = NEW.team_id;

  IF NEW.assigned_student_id IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_profile_id, type, title, body, link, ref_type, ref_id)
    SELECT s.profile_id, 'task_new',
      'Tugas baru: ' || NEW.title,
      CASE
        WHEN NEW.deadline IS NOT NULL
          THEN 'Deadline ' || to_char(NEW.deadline AT TIME ZONE 'Asia/Jakarta', 'DD Mon · HH24:MI') || ' WIB'
        ELSE 'Tim ' || COALESCE(v_team_code, '—')
      END,
      '/student/tasks', 'task', NEW.id
    FROM public.students s
    WHERE s.id = NEW.assigned_student_id AND s.deleted_at IS NULL;
  ELSE
    INSERT INTO public.notifications (recipient_profile_id, type, title, body, link, ref_type, ref_id)
    SELECT s.profile_id, 'task_new',
      'Tugas baru: ' || NEW.title,
      'Untuk seluruh tim ' || COALESCE(v_team_code, '—'),
      '/student/tasks', 'task', NEW.id
    FROM public.team_members tm
    JOIN public.students s ON s.id = tm.student_id
    WHERE tm.team_id = NEW.team_id AND s.deleted_at IS NULL;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_new_task failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_created ON public.tasks;
CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_task();

-- New class_team link → notify all students in that team about the class.
-- (We fire on class_teams rather than classes because the team mapping
--  comes after the class row is inserted.)
CREATE OR REPLACE FUNCTION public.notify_on_class_scheduled()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_topic text;
  v_date  timestamptz;
  v_team_code text;
BEGIN
  SELECT topic, scheduled_at INTO v_topic, v_date FROM public.classes WHERE id = NEW.class_id;
  SELECT team_code INTO v_team_code FROM public.teams WHERE id = NEW.team_id;

  INSERT INTO public.notifications (recipient_profile_id, type, title, body, link, ref_type, ref_id)
  SELECT s.profile_id, 'class_scheduled',
    'Kelas baru: ' || COALESCE(v_topic, 'Bimbingan'),
    to_char(v_date AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY · HH24:MI') || ' WIB · Tim ' || COALESCE(v_team_code, '—'),
    '/student/classes', 'class', NEW.class_id
  FROM public.team_members tm
  JOIN public.students s ON s.id = tm.student_id
  WHERE tm.team_id = NEW.team_id AND s.deleted_at IS NULL;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_class_scheduled failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_class_team_added ON public.class_teams;
CREATE TRIGGER on_class_team_added
AFTER INSERT ON public.class_teams
FOR EACH ROW EXECUTE FUNCTION public.notify_on_class_scheduled();

-- New session report → notify students + their parents.
CREATE OR REPLACE FUNCTION public.notify_on_session_report()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_team_code text;
BEGIN
  SELECT team_code INTO v_team_code FROM public.teams WHERE id = NEW.team_id;

  -- Parents of team members
  INSERT INTO public.notifications (recipient_profile_id, type, title, body, link, ref_type, ref_id)
  SELECT DISTINCT pr.profile_id, 'session_report',
    'Laporan sesi baru',
    'Tim ' || COALESCE(v_team_code, '—') || ' · ' || COALESCE(NEW.topic, 'Bimbingan'),
    '/parent/reports', 'session', NEW.id
  FROM public.team_members tm
  JOIN public.parent_students ps ON ps.student_id = tm.student_id
  JOIN public.parents          pr ON pr.id = ps.parent_id;

  -- Students themselves
  INSERT INTO public.notifications (recipient_profile_id, type, title, body, link, ref_type, ref_id)
  SELECT s.profile_id, 'session_report',
    'Laporan sesi baru',
    COALESCE(NEW.topic, 'Sesi bimbingan') || ' sudah dicatat pembimbing',
    '/student/classes', 'session', NEW.id
  FROM public.team_members tm
  JOIN public.students s ON s.id = tm.student_id
  WHERE tm.team_id = NEW.team_id AND s.deleted_at IS NULL;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_session_report failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_session_created ON public.sessions;
CREATE TRIGGER on_session_created
AFTER INSERT ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_session_report();
