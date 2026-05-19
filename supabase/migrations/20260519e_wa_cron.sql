-- ─────────────────────────────────────────────────────────────────────────
-- Migration: schedule WhatsApp notification sender via pg_cron
--
-- Runs every 15 minutes, calling the send-wa-notifications Edge Function
-- which picks up pending rows from wa_notifications and dispatches them
-- through Fonnte.
--
-- Prereqs (enable in Supabase Dashboard → Database → Extensions):
--   - pg_cron
--   - pg_net  (for HTTP POST from Postgres)
--
-- Idempotent. Re-running unschedules + reschedules.
-- ─────────────────────────────────────────────────────────────────────────

-- Unschedule any previous version of the job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'wa-notifications-every-15min') THEN
    PERFORM cron.unschedule('wa-notifications-every-15min');
  END IF;
END $$;

-- ⚠️ IMPORTANT: replace BOTH placeholders below before running:
--   1. PROJECT_REF  →  your Supabase project ref (e.g. 'inxelxvzuuvfoouswrjp')
--   2. SERVICE_ROLE_KEY  →  your service_role JWT
--      (Supabase Dashboard → Project Settings → API → service_role secret)
--
-- For security, after running this you can revoke the secret if needed —
-- pg_cron stores the SQL by value so the key is in the job definition.
-- An alternative is to store it in a separate config table and look up at
-- call time; for MVP this inline approach is fine.

SELECT cron.schedule(
  'wa-notifications-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://PROJECT_REF.supabase.co/functions/v1/send-wa-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SERVICE_ROLE_KEY'
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verify it was scheduled
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'wa-notifications-every-15min';
