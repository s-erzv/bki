//@ts-nocheck
/**
 * Upload a session report PDF to the team's Drive folder.
 *
 * Body: { sessionId: string; pdfBase64: string; fileName?: string }
 *
 * Folder strategy: drive.file scope only lets us touch files we created.
 * If the team has no drive_links.folder_url yet, we auto-create a folder
 * named "BKI · <team_code>" in the coach's root Drive and store the link.
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

async function createDriveFolder(accessToken, name, parentId) {
  const body = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) body.parents = [parentId]

  const resp = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Create folder gagal: ${errText}`)
  }
  const { id } = await resp.json()
  return id
}

/* ── Handler ─────────────────────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { sessionId, pdfBase64, fileName } = await req.json()
    if (!sessionId || !pdfBase64) {
      return json({ error: 'sessionId dan pdfBase64 wajib diisi' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    )

    const { data: session, error: sErr } = await admin
      .from('sessions')
      .select('id, team_id, coach_id, session_date')
      .eq('id', sessionId)
      .maybeSingle()
    if (sErr) throw new Error(`Load session gagal: ${sErr.message}`)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    if (!session.team_id) throw new Error('Session belum punya tim')
    if (!session.coach_id) throw new Error('Session belum punya coach')

    const { data: team, error: tErr } = await admin
      .from('teams')
      .select('id, team_code, research_title')
      .eq('id', session.team_id)
      .maybeSingle()
    if (tErr) throw new Error(`Load team gagal: ${tErr.message}`)
    if (!team) throw new Error('Team not found')

    const profileId = await getCoachProfileId(admin, session.coach_id)
    const accessToken = await getValidGoogleToken(admin, profileId, 'drive_calendar')

    const folderId = await ensureTeamFolder(admin, accessToken, team)

    const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))
    const dateStr = new Date(session.session_date).toISOString().slice(0, 10)
    const name = fileName ?? `Laporan-${team.team_code}-${dateStr}.pdf`

    const webViewLink = await uploadPdfToFolder(accessToken, folderId, name, pdfBytes)

    await admin
      .from('sessions')
      .update({ drive_report_url: webViewLink })
      .eq('id', sessionId)

    return json({ ok: true, url: webViewLink, folder_id: folderId })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 400)
  }
})

async function ensureTeamFolder(admin, accessToken, team) {
  const { data: existing } = await admin
    .from('drive_links')
    .select('folder_url')
    .eq('team_id', team.id)
    .eq('link_type', 'team_report')
    .maybeSingle()

  if (existing?.folder_url) {
    const m = existing.folder_url.match(/folders\/([a-zA-Z0-9_-]+)/)
    if (m?.[1]) return m[1]
  }

  const folderName = `BKI · ${team.team_code}`
  const folderId = await createDriveFolder(accessToken, folderName)
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`

  if (existing) {
    await admin
      .from('drive_links')
      .update({ folder_url: folderUrl, folder_name: folderName })
      .eq('team_id', team.id)
      .eq('link_type', 'team_report')
  } else {
    await admin.from('drive_links').insert({
      team_id: team.id,
      link_type: 'team_report',
      folder_url: folderUrl,
      folder_name: folderName,
    })
  }

  return folderId
}

async function uploadPdfToFolder(accessToken, folderId, name, pdfBytes) {
  const boundary = `bki${Date.now()}`
  const metadata = JSON.stringify({
    name,
    mimeType: 'application/pdf',
    parents: [folderId],
  })

  const encoder = new TextEncoder()
  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
  )
  const tail = encoder.encode(`\r\n--${boundary}--`)

  const body = new Uint8Array(head.length + pdfBytes.length + tail.length)
  body.set(head, 0)
  body.set(pdfBytes, head.length)
  body.set(tail, head.length + pdfBytes.length)

  const resp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Upload PDF gagal (${resp.status}): ${errText}`)
  }
  const { webViewLink } = await resp.json()
  return webViewLink
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
