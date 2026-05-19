//@ts-nocheck
/**
 * Send queued WhatsApp notifications via Fonnte.
 *
 * Can be invoked two ways:
 *   1. Scheduled cron (Supabase): no body → process all `pending` (default).
 *   2. Manual trigger from client: POST with body
 *      { retryFailed?: boolean; ids?: string[] }
 *
 * Returns { sent, failed, results: [...] } so the admin UI can show progress.
 *
 * Env vars: FONNTE_TOKEN (preferred) or FONNTE_API_KEY (legacy).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Parse optional body (cron invokes without body)
    let opts: { retryFailed?: boolean; ids?: string[] } = {}
    try {
      const ct = req.headers.get('content-type') ?? ''
      if (ct.includes('application/json')) {
        opts = await req.json()
      }
    } catch { /* empty body is fine */ }

    const fonnteToken = Deno.env.get('FONNTE_TOKEN') || Deno.env.get('FONNTE_API_KEY')
    if (!fonnteToken) {
      return json({
        error: 'FONNTE_TOKEN (atau FONNTE_API_KEY) belum diset di Edge Function secrets. Dashboard → Edge Functions → Manage secrets.',
      }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    )

    // Build query — pending always included, optionally also failed
    let q = supabase
      .from('wa_notifications')
      .select('id, recipient_phone, message, status')
      .limit(100)

    if (opts.ids && opts.ids.length > 0) {
      q = q.in('id', opts.ids)
    } else if (opts.retryFailed) {
      q = q.in('status', ['pending', 'failed'])
    } else {
      q = q.eq('status', 'pending')
    }

    const { data: queue, error: qErr } = await q
    if (qErr) return json({ error: `Fetch queue gagal: ${qErr.message}` }, 500)

    if (!queue || queue.length === 0) {
      return json({ sent: 0, failed: 0, queued: 0, results: [], message: 'Tidak ada notifikasi yang perlu dikirim.' })
    }

    // Send each notification serially via fetch + update row status.
    // Parallel would be faster but Fonnte tends to rate-limit, so we keep
    // it simple/serial here.
    const results: Array<{ id: string; status: 'sent' | 'failed'; error?: string }> = []
    let sentCount = 0
    let failedCount = 0

    for (const notif of queue) {
      try {
        const resp = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: fonnteToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: notif.recipient_phone,
            message: notif.message,
          }),
        })

        const respText = await resp.text()
        let respJson: any = null
        try { respJson = JSON.parse(respText) } catch { /* not json */ }

        // Fonnte returns 200 even on logical failures — also check `status: false`
        const ok = resp.ok && (respJson?.status !== false)

        if (ok) {
          await supabase
            .from('wa_notifications')
            .update({ status: 'sent', sent_at: new Date().toISOString(), error_msg: null })
            .eq('id', notif.id)
          results.push({ id: notif.id, status: 'sent' })
          sentCount++
        } else {
          const err = respJson?.reason ?? respJson?.message ?? respText.slice(0, 500)
          await supabase
            .from('wa_notifications')
            .update({ status: 'failed', error_msg: err })
            .eq('id', notif.id)
          results.push({ id: notif.id, status: 'failed', error: err })
          failedCount++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await supabase
          .from('wa_notifications')
          .update({ status: 'failed', error_msg: msg })
          .eq('id', notif.id)
        results.push({ id: notif.id, status: 'failed', error: msg })
        failedCount++
      }
    }

    return json({
      sent: sentCount,
      failed: failedCount,
      queued: queue.length,
      results,
    })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
