//@ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

//TODO: FONNTE UYYYY SAMBUNGIN
// Scheduled via Supabase cron: */15 * * * *
// Env vars required: FONNTE_API_KEY

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: pending, error } = await supabase
    .from('wa_notifications')
    .select('*')
    .eq('status', 'pending')
    .limit(50)

  if (error) {
    console.error('Failed to fetch pending notifications:', error)
    return new Response('error', { status: 500 })
  }

  const results = await Promise.allSettled(
    (pending ?? []).map(async (notif) => {
      try {
        const res = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: Deno.env.get('FONNTE_API_KEY')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: notif.recipient_phone,
            message: notif.message,
          }),
        })

        if (!res.ok) {
          const errText = await res.text()
          await supabase
            .from('wa_notifications')
            .update({ status: 'failed', error_msg: errText })
            .eq('id', notif.id)
          return
        }

        await supabase
          .from('wa_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notif.id)
      } catch (err) {
        await supabase
          .from('wa_notifications')
          .update({ status: 'failed', error_msg: String(err) })
          .eq('id', notif.id)
      }
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`WA notifications: ${sent} sent, ${failed} failed`)

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
