//@ts-nocheck
/**
 * List events from the coach's primary Google Calendar within a time range.
 *
 * Body: { coachId: string; timeMin?: ISO; timeMax?: ISO }
 *
 * Self-contained — no _shared/ imports.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

/* ── Inline helpers (kept in sync with _shared/google-oauth.ts) ──────── */

async function getValidGoogleToken(admin, profileId, requiredScope = 'drive_calendar') {
  const { data, error } = await admin
    .from('oauth_tokens')
    .select('access_token, refresh_token, expires_at, scope_level')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw new Error(`Token lookup failed: ${error.message}`)
  if (!data) throw new Error('User belum menghubungkan akun Google. Klik "Hubungkan Google Drive & Calendar" di dashboard.')
  if (requiredScope === 'drive_calendar' && data.scope_level !== 'drive_calendar') {
    throw new Error('Akses Drive/Calendar belum diizinkan. Klik "Hubungkan Google Drive & Calendar" di dashboard.')
  }

  const now = Date.now()
  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0
  if (expiresAt > now + 60_000) return data.access_token

  if (!data.refresh_token) {
    throw new Error('Token Google expired dan tidak ada refresh_token. Mohon reconnect Google.')
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET tidak diset di Edge Function secrets.')
  }

  const refreshResp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!refreshResp.ok) {
    const errText = await refreshResp.text()
    throw new Error(`Token refresh gagal: ${errText}`)
  }
  const { access_token, expires_in } = await refreshResp.json()
  const newExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString()
  await admin
    .from('oauth_tokens')
    .update({ access_token, expires_at: newExpiresAt })
    .eq('profile_id', profileId)
  return access_token
}

async function getCoachProfileId(admin, coachId) {
  const { data, error } = await admin
    .from('coaches')
    .select('profile_id')
    .eq('id', coachId)
    .maybeSingle()
  if (error) throw new Error(`Coach lookup failed: ${error.message}`)
  if (!data) throw new Error(`Coach ${coachId} not found`)
  return data.profile_id
}

/* ── Handler ─────────────────────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { coachId, timeMin, timeMax } = await req.json()
    if (!coachId) return json({ error: 'coachId wajib' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    )

    const profileId = await getCoachProfileId(admin, coachId)
    const accessToken = await getValidGoogleToken(admin, profileId, 'drive_calendar')

    const now = Date.now()
    const params = new URLSearchParams({
      timeMin: timeMin ?? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      timeMax: timeMax ?? new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    })

    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`Calendar API error (${resp.status}): ${errText}`)
    }

    const data = await resp.json()

    const items = (data.items ?? [])
      .filter((e) => e.status !== 'cancelled')
      .map((e) => ({
        id:           e.id,
        summary:      e.summary ?? '(tanpa judul)',
        description:  e.description ?? null,
        location:     e.location ?? null,
        start:        e.start?.dateTime ?? e.start?.date ?? null,
        end:          e.end?.dateTime   ?? e.end?.date   ?? null,
        hangoutLink:  e.hangoutLink ?? null,
        htmlLink:     e.htmlLink ?? null,
        isAllDay:     !e.start?.dateTime,
      }))
      .filter((e) => e.start)

    return json({ events: items })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 400)
  }
})

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
