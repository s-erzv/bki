//@ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { sessionId, teamId, pdfBase64, fileName } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get team drive folder
    const { data: driveLink } = await supabase
      .from('drive_links')
      .select('url')
      .eq('team_id', teamId)
      .eq('link_type', 'team_report')
      .single()

    // Get coach for this team
    const { data: team } = await supabase
      .from('teams')
      .select('coach_id')
      .eq('id', teamId)
      .single()

    // Get internal profile ID for the coach
    const { data: coachProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', team?.coach_id)
      .single()

    const { data: token } = await supabase
      .from('oauth_tokens')
      .select('access_token')
      .eq('profile_id', coachProfile?.id)
      .eq('scope_level', 'drive_calendar')
      .single()

    if (!token) {
      return new Response(JSON.stringify({ error: 'No drive_calendar token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract folder ID from drive URL
    const folderMatch = driveLink?.url.match(/folders\/([a-zA-Z0-9_-]+)/)
    const folderId = folderMatch?.[1]

    // Upload PDF to Drive
    const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))
    const boundary = '-------boundary'
    const metadata = JSON.stringify({
      name: fileName ?? `laporan-${sessionId}.pdf`,
      mimeType: 'application/pdf',
      ...(folderId ? { parents: [folderId] } : {}),
    })

    const body = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
    ]
    const encoder = new TextEncoder()
    const endBoundary = encoder.encode(`\r\n--${boundary}--`)

    const bodyParts = [encoder.encode(body[0]), encoder.encode(body[1]), pdfBytes, endBoundary]
    const totalLength = bodyParts.reduce((s, p) => s + p.length, 0)
    const fullBody = new Uint8Array(totalLength)
    let offset = 0
    for (const part of bodyParts) { fullBody.set(part, offset); offset += part.length }

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: fullBody,
      }
    )

    if (!uploadResponse.ok) {
      const err = await uploadResponse.text()
      return new Response(JSON.stringify({ error: err }), {
        status: uploadResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { webViewLink } = await uploadResponse.json()

    await supabase
      .from('sessions')
      .update({ drive_report_url: webViewLink })
      .eq('id', sessionId)

    return new Response(JSON.stringify({ url: webViewLink }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
