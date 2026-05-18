//@ts-nocheck
/**
 * Admin-only: create a new user (auth + profile + role row) in one transaction.
 *
 * Requires service_role to:
 *   - Create the auth user with email_confirm=true (so user can log in immediately)
 *   - Bypass RLS when inserting profile + role row
 *
 * Auth: caller must be an admin (verified by checking profiles.role = 'admin').
 *
 * On failure mid-way through role-row insert, rolls back by deleting the auth user.
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
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401)

    const body = await req.json()
    const {
      email,
      password,
      full_name,
      role,
      phone,
      // Coach
      division,
      work_email,
      // Student
      nisn,
      grade,
      major,
      npsn,
      age,
      interests,
      info_email,
    } = body ?? {}

    // ── Validation ───────────────────────────────────────
    if (!email || !password || !full_name || !role) {
      return json({ error: 'email, password, full_name, role wajib diisi' }, 400)
    }
    if (!['coach', 'student', 'parent', 'admin'].includes(role)) {
      return json({ error: `role tidak valid: ${role}` }, 400)
    }
    if (role === 'coach' && !division) {
      return json({ error: 'Coach wajib pilih division' }, 400)
    }
    if (role === 'coach' && !['admin', 'research', 'paper', 'presentation', 'marketing', 'intern'].includes(division)) {
      return json({ error: `division tidak valid: ${division}` }, 400)
    }
    if (password.length < 6) {
      return json({ error: 'Password minimal 6 karakter' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // ── Verify caller is admin ───────────────────────────
    // Pass JWT explicitly: avoids header-casing collisions where supabase-js's
    // own `Authorization: Bearer <anon-key>` would overwrite the global header
    // and cause /auth/v1/user to be called with the anon key (→ null user).
    const jwt = authHeader.replace(/^Bearer\s+/i, '')
    const admin = createClient(supabaseUrl, serviceKey)
    const { data: { user: caller }, error: callerErr } = await admin.auth.getUser(jwt)
    if (callerErr || !caller) {
      return json({ error: `Not authenticated: ${callerErr?.message ?? 'no user resolved from JWT'}` }, 401)
    }
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('auth_user_id', caller.id)
      .maybeSingle()
    if (!callerProfile || callerProfile.role !== 'admin') {
      return json({ error: 'Forbidden — admin only' }, 403)
    }

    // ── 1. Create auth user (email pre-confirmed) ───────
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name },
    })
    if (createErr) return json({ error: `Gagal create auth user: ${createErr.message}` }, 400)
    const newUser = created.user!

    // ── 2. Create profile + role row (with rollback on failure) ──
    try {
      // UPSERT: a `handle_new_user` trigger on auth.users may already have created
      // a profile row from user_metadata. Override with the values we want either way.
      const { data: profileRow, error: pErr } = await admin
        .from('profiles')
        .upsert(
          {
            auth_user_id: newUser.id,
            full_name,
            phone: phone || null,
            role,
          },
          { onConflict: 'auth_user_id' },
        )
        .select('id')
        .single()
      if (pErr) throw new Error(`Upsert profile gagal: ${pErr.message}`)
      const profileId = profileRow.id

      // UPSERT role-specific rows too — handle_new_user trigger may auto-create
      // these based on role, so we'd hit duplicate-key on profile_id otherwise.
      if (role === 'coach') {
        const { error } = await admin.from('coaches').upsert(
          {
            profile_id: profileId,
            division,
            work_email: work_email || null,
          },
          { onConflict: 'profile_id' },
        )
        if (error) throw new Error(`Upsert coach gagal: ${error.message}`)
      } else if (role === 'student') {
        const { error } = await admin.from('students').upsert(
          {
            profile_id: profileId,
            nisn: nisn || null,
            grade: grade || null,
            major: major || null,
            npsn: npsn || null,
            age: age || null,
            interests: interests || null,
            info_email: info_email || null,
          },
          { onConflict: 'profile_id' },
        )
        if (error) throw new Error(`Upsert student gagal: ${error.message}`)
      } else if (role === 'parent') {
        const { error } = await admin.from('parents').upsert(
          { profile_id: profileId },
          { onConflict: 'profile_id' },
        )
        if (error) throw new Error(`Upsert parent gagal: ${error.message}`)
      }
      // role === 'admin': no extra row needed

      return json({ success: true, user_id: newUser.id, profile_id: profileId, email })
    } catch (err) {
      // Rollback the auth user so we don't leave orphans.
      await admin.auth.admin.deleteUser(newUser.id)
      return json({ error: String(err instanceof Error ? err.message : err) }, 400)
    }
  } catch (error) {
    return json({ error: String(error instanceof Error ? error.message : error) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
