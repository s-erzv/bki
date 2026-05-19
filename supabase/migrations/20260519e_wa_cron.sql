-- ─────────────────────────────────────────────────────────────────────────
-- Migration: schedule WhatsApp notification sender via pg_cron
--
-- Runs every 15 minutes, calling the send-wa-notifications Edge Function
-- which picks up pending rows from wa_notifications and dispatches via Fonnte.
--
-- ⚠️ PREREQ — enable these extensions FIRST in Supabase Dashboard:
--   Database → Extensions → search & enable:
--     - pg_cron   (schema: pg_catalog, name: pg_cron)
--     - pg_net    (schema: extensions, name: pg_net)
--   Refresh the page after enabling; the cron schema becomes visible.
--
-- After extensions are enabled, run this migration with PLACEHOLDERS replaced:
--   PROJECT_REF        → your Supabase project ref (e.g. 'inxelxvzuuvfoouswrjp')
--   SERVICE_ROLE_KEY   → service_role secret from Project Settings → API
--
-- Idempotent — re-running unschedules + reschedules.
-- ─────────────────────────────────────────────────────────────────────────

-- Safety check: bail out with a friendly error if pg_cron isn't installed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'pg_cron extension is not enabled. Enable it via Supabase Dashboard → Database → Extensions before running this migration.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION 'pg_net extension is not enabled. Enable it via Supabase Dashboard → Database → Extensions before running this migration.';
  END IF;
END $$;

-- Unschedule any previous version of the job (safe to call when job missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'wa-notifications-every-15min') THEN
    PERFORM cron.unschedule('wa-notifications-every-15min');
  END IF;
END $$;

-- Schedule the new job — runs every 15 minutes
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

-- Verify
SELECT jobname, schedule FROM cron.job WHERE jobname = 'wa-notifications-every-15min';
