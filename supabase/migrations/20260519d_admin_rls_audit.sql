-- ─────────────────────────────────────────────────────────────────────────
-- Migration: admin RLS audit — ensure admin can CRUD everywhere
--
-- Earlier migrations added admin policies for parents, students, teams,
-- team_members, team_coaches, parent_students, class_teams, coaches.
-- This adds the rest: tasks, task_refs, classes, sessions, session_docs,
-- session_student_reports, drive_links, coach_skills, schools.
--
-- Also adds a sensible default policy for tables that students/coaches
-- should READ but only their own rows. This is for tables where I noticed
-- silent empty results in earlier QA.
--
-- Idempotent. Run in Supabase Dashboard → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

-- Helper: check if current auth user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
$$;

-- ── Tables that need admin "for all" ─────────────────────────────────────

DO $$
DECLARE
  t text;
  admin_tables text[] := ARRAY[
    'tasks', 'task_refs',
    'classes',
    'sessions', 'session_docs', 'session_student_reports',
    'drive_links',
    'coach_skills',
    'schools'
  ];
BEGIN
  FOREACH t IN ARRAY admin_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin manage %s" ON public.%I;', t, t);
    EXECUTE format($p$
      CREATE POLICY "admin manage %s"
      ON public.%I
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    $p$, t, t);
  END LOOP;
END $$;

-- ── Coach: read+write tasks/classes/sessions for their own teams ─────────

DROP POLICY IF EXISTS "coach manage own tasks" ON public.tasks;
CREATE POLICY "coach manage own tasks"
ON public.tasks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND c.id = tasks.created_by_coach_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND c.id = tasks.created_by_coach_id
  )
);

DROP POLICY IF EXISTS "coach manage own classes" ON public.classes;
CREATE POLICY "coach manage own classes"
ON public.classes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND c.id = classes.coach_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND c.id = classes.coach_id
  )
);

DROP POLICY IF EXISTS "coach manage own sessions" ON public.sessions;
CREATE POLICY "coach manage own sessions"
ON public.sessions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND c.id = sessions.coach_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND c.id = sessions.coach_id
  )
);

DROP POLICY IF EXISTS "coach manage session_student_reports" ON public.session_student_reports;
CREATE POLICY "coach manage session_student_reports"
ON public.session_student_reports
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.coaches c ON c.id = s.coach_id
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND s.id = session_student_reports.session_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.coaches c ON c.id = s.coach_id
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND s.id = session_student_reports.session_id
  )
);

DROP POLICY IF EXISTS "coach manage session_docs" ON public.session_docs;
CREATE POLICY "coach manage session_docs"
ON public.session_docs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.coaches c ON c.id = s.coach_id
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND s.id = session_docs.session_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.coaches c ON c.id = s.coach_id
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND s.id = session_docs.session_id
  )
);

DROP POLICY IF EXISTS "coach manage task_refs" ON public.task_refs;
CREATE POLICY "coach manage task_refs"
ON public.task_refs
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.coaches c ON c.id = t.created_by_coach_id
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND t.id = task_refs.task_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.coaches c ON c.id = t.created_by_coach_id
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND t.id = task_refs.task_id
  )
);

DROP POLICY IF EXISTS "coach manage own coach_skills" ON public.coach_skills;
CREATE POLICY "coach manage own coach_skills"
ON public.coach_skills
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND c.id = coach_skills.coach_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    WHERE p.auth_user_id = auth.uid() AND c.id = coach_skills.coach_id
  )
);

-- ── Students: read tasks/classes/sessions for their team ─────────────────

DROP POLICY IF EXISTS "team member read tasks" ON public.tasks;
CREATE POLICY "team member read tasks"
ON public.tasks
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid() AND tm.team_id = tasks.team_id
  )
);

-- Students can mark their own tasks as completed (toggle).
DROP POLICY IF EXISTS "team member update task completion" ON public.tasks;
CREATE POLICY "team member update task completion"
ON public.tasks
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid() AND tm.team_id = tasks.team_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid() AND tm.team_id = tasks.team_id
  )
);

DROP POLICY IF EXISTS "team member read task_refs" ON public.task_refs;
CREATE POLICY "team member read task_refs"
ON public.task_refs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.team_members tm ON tm.team_id = t.team_id
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid() AND t.id = task_refs.task_id
  )
);

DROP POLICY IF EXISTS "team member read classes" ON public.classes;
CREATE POLICY "team member read classes"
ON public.classes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.class_teams ct
    JOIN public.team_members tm ON tm.team_id = ct.team_id
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid() AND ct.class_id = classes.id
  )
);

DROP POLICY IF EXISTS "team member read class_teams" ON public.class_teams;
CREATE POLICY "team member read class_teams"
ON public.class_teams
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid() AND tm.team_id = class_teams.team_id
  )
);

DROP POLICY IF EXISTS "team member read sessions" ON public.sessions;
CREATE POLICY "team member read sessions"
ON public.sessions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid() AND tm.team_id = sessions.team_id
  )
);

DROP POLICY IF EXISTS "team member read session_docs" ON public.session_docs;
CREATE POLICY "team member read session_docs"
ON public.session_docs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions sess
    JOIN public.team_members tm ON tm.team_id = sess.team_id
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid() AND sess.id = session_docs.session_id
  )
);

-- ── Parents: read sessions/reports of their kids ─────────────────────────

DROP POLICY IF EXISTS "parent read kid sessions" ON public.sessions;
CREATE POLICY "parent read kid sessions"
ON public.sessions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parent_students ps
    JOIN public.parents pr ON pr.id = ps.parent_id
    JOIN public.profiles p ON p.id = pr.profile_id
    JOIN public.team_members tm ON tm.student_id = ps.student_id
    WHERE p.auth_user_id = auth.uid() AND tm.team_id = sessions.team_id
  )
);

DROP POLICY IF EXISTS "parent read kid session_student_reports" ON public.session_student_reports;
CREATE POLICY "parent read kid session_student_reports"
ON public.session_student_reports
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parent_students ps
    JOIN public.parents pr ON pr.id = ps.parent_id
    JOIN public.profiles p ON p.id = pr.profile_id
    WHERE p.auth_user_id = auth.uid() AND ps.student_id = session_student_reports.student_id
  )
);

-- ── Schools: everyone can read (lookup), only admin can write ────────────

DROP POLICY IF EXISTS "all read schools" ON public.schools;
CREATE POLICY "all read schools"
ON public.schools
FOR SELECT TO authenticated
USING (true);
