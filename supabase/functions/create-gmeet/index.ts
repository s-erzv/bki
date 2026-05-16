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
    const { classId, teamId, date, time, duration, topic } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get coach OAuth token
    const { data: classes } = await supabase
      .from('classes')
      .select('created_by')
      .eq('id', classId)
      .single()

    const { data: token } = await supabase
      .from('oauth_tokens')
      .select('access_token')
      .eq('user_id', classes?.created_by)
      .eq('scope_level', 'drive_calendar')
      .single()

    if (!token) {
      return new Response(JSON.stringify({ error: 'No drive_calendar token' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const startDateTime = `${date}T${time}:00+07:00`
    const endMs = new Date(startDateTime).getTime() + duration * 60 * 1000
    const endDateTime = new Date(endMs).toISOString()

    const calEvent = {
      summary: topic ?? `BKI — Tim ${teamId}`,
      start: { dateTime: startDateTime, timeZone: 'Asia/Jakarta' },
      end: { dateTime: endDateTime, timeZone: 'Asia/Jakarta' },
      conferenceData: {
        createRequest: {
          requestId: `bki-${classId}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    }

    const calResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calEvent),
      }
    )

    if (!calResponse.ok) {
      const err = await calResponse.text()
      return new Response(JSON.stringify({ error: err }), {
        status: calResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const calData = await calResponse.json()
    const gmeetLink = calData.conferenceData?.entryPoints?.[0]?.uri ?? null
    const gcalEventId = calData.id

    await supabase
      .from('classes')
      .update({ gmeet_link: gmeetLink, gcal_event_id: gcalEventId })
      .eq('id', classId)

    return new Response(JSON.stringify({ gmeetLink, gcalEventId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
