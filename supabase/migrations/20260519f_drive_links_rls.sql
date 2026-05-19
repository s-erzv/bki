-- ─────────────────────────────────────────────────────────────────────────
-- Migration: read RLS for drive_links
--
-- Earlier admin_rls_audit migration only added admin write policy. Without
-- read policies, coach/student/parent queries that embed drive_links via
-- teams will silently return empty arrays (RLS hides rows).
--
-- This adds read access for everyone who has legitimate visibility to the
-- team's folder URL:
--   - The team's coach (any coach attached via team_coaches OR teams.coach_id)
--   - Students who are team members
--   - Parents of team-member students
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.drive_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach read team drive_links"   ON public.drive_links;
DROP POLICY IF EXISTS "student read team drive_links" ON public.drive_links;
DROP POLICY IF EXISTS "parent read kid drive_links"   ON public.drive_links;

-- Coaches: read folder links for any team they're attached to
CREATE POLICY "coach read team drive_links"
ON public.drive_links
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.coaches c
    JOIN public.profiles p ON p.id = c.profile_id
    LEFT JOIN public.team_coaches tc ON tc.coach_id = c.id
    LEFT JOIN public.teams t ON t.coach_id = c.id
    WHERE p.auth_user_id = auth.uid()
      AND (tc.team_id = drive_links.team_id OR t.id = drive_links.team_id)
  )
);

-- Students: read folder links for their team
CREATE POLICY "student read team drive_links"
ON public.drive_links
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.students s ON s.id = tm.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.auth_user_id = auth.uid()
      AND tm.team_id = drive_links.team_id
  )
);

-- Parents: read folder links for any team their kids are in
CREATE POLICY "parent read kid drive_links"
ON public.drive_links
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parent_students ps
    JOIN public.parents pr ON pr.id = ps.parent_id
    JOIN public.profiles p ON p.id = pr.profile_id
    JOIN public.team_members tm ON tm.student_id = ps.student_id
    WHERE p.auth_user_id = auth.uid()
      AND tm.team_id = drive_links.team_id
  )
);
