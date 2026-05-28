// Supabase Edge Function: send-email
// Sends transactional emails via Resend

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'BookMyDentistPH <hello@bookmydentistph.com>'

const DEFAULT_ALLOWED_ORIGINS = [
  'https://bookmydentistph.com',
  'https://www.bookmydentistph.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const ALLOWED_ORIGINS = configuredOrigins.length ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS
const MAX_EMAILS_PER_HOUR = 20
const MAX_RECIPIENTS = 5
const HOUR_MS = 60 * 60 * 1000
const rateBucket = new Map<string, number[]>()
const adminSupabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

function json(body: unknown, status: number, req: Request, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  })
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isMemoryRateLimited(bucketKey: string, maxRequests: number, windowMs: number) {
  const now = Date.now()
  const recent = (rateBucket.get(bucketKey) ?? []).filter((stamp) => now - stamp < windowMs)

  if (recent.length >= maxRequests) {
    rateBucket.set(bucketKey, recent)
    return true
  }

  recent.push(now)
  rateBucket.set(bucketKey, recent)
  return false
}

async function isRateLimited(bucketKey: string, maxRequests: number, windowMs: number) {
  if (adminSupabase) {
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString()
    const { data, error } = await adminSupabase.rpc('increment_rate_limit', {
      p_bucket_key: bucketKey,
      p_window_start: windowStart,
      p_max_requests: maxRequests,
    })

    if (!error && typeof data === 'boolean') return data
    console.error('Persistent email rate limit failed, using memory fallback:', error)
  }

  return isMemoryRateLimited(bucketKey, maxRequests, windowMs)
}

serve(async (req) => {
  const headers = corsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, req)
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !RESEND_API_KEY) {
    return json({ error: 'Function environment is not configured' }, 500, req)
  }

  try {
    const { to, subject, html, text } = await req.json()

    const recipients = (Array.isArray(to) ? to : [to])
      .filter((entry) => typeof entry === 'string')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)

    if (!recipients.length || recipients.length > MAX_RECIPIENTS) {
      return json({ error: 'Invalid recipients' }, 400, req)
    }

    if (!recipients.every(isValidEmail)) {
      return json({ error: 'Invalid email format in recipients' }, 400, req)
    }

    if (typeof subject !== 'string' || !subject.trim() || subject.length > 200) {
      return json({ error: 'Invalid subject' }, 400, req)
    }

    if ((!html && !text) || (typeof html !== 'string' && typeof text !== 'string')) {
      return json({ error: 'Missing required body content' }, 400, req)
    }

    if (typeof html === 'string' && html.length > 120000) {
      return json({ error: 'HTML content too large' }, 400, req)
    }

    if (typeof text === 'string' && text.length > 10000) {
      return json({ error: 'Text content too large' }, 400, req)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401, req)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return json({ error: 'Unauthorized' }, 401, req)
    }

    const user = authData.user

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_suspended, banned_at')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return json({ error: 'Forbidden' }, 403, req)
    }

    const allowedRoles = ['customer', 'clinic_owner', 'super_admin']
    if (!allowedRoles.includes(profile.role) || profile.is_suspended || profile.banned_at) {
      return json({ error: 'Forbidden' }, 403, req)
    }

    if (await isRateLimited(`email:user:${user.id}`, MAX_EMAILS_PER_HOUR, HOUR_MS)) {
      return json({ error: 'Too many email requests. Please try again later.' }, 429, req, {
        'Retry-After': '3600',
      })
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        subject: subject.trim(),
        html,
        text,
      }),
    })

    const result = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend error:', result)
      return json({ error: result?.message ?? 'Email provider error' }, 502, req)
    }

    return json({ success: true, id: result.id }, 200, req)
  } catch (err) {
    console.error('send-email function error:', err)
    return json({ error: 'Internal server error' }, 500, req)
  }
})
