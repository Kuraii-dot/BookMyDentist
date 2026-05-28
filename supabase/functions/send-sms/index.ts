// Supabase Edge Function: send-sms
// Sends SMS via Twilio with authenticated caller checks.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER') ?? ''

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
const MAX_SMS_PER_HOUR = 30
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

function isMemoryRateLimited(userId: string) {
  const now = Date.now()
  const recent = (rateBucket.get(userId) ?? []).filter((stamp) => now - stamp < HOUR_MS)

  if (recent.length >= MAX_SMS_PER_HOUR) {
    rateBucket.set(userId, recent)
    return true
  }

  recent.push(now)
  rateBucket.set(userId, recent)
  return false
}

async function isRateLimited(userId: string) {
  const bucketKey = `sms:user:${userId}`

  if (adminSupabase) {
    const windowStart = new Date(Math.floor(Date.now() / HOUR_MS) * HOUR_MS).toISOString()
    const { data, error } = await adminSupabase.rpc('increment_rate_limit', {
      p_bucket_key: bucketKey,
      p_window_start: windowStart,
      p_max_requests: MAX_SMS_PER_HOUR,
    })

    if (!error && typeof data === 'boolean') return data
    console.error('Persistent SMS rate limit failed, using memory fallback:', error)
  }

  return isMemoryRateLimited(userId)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, req)
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return json({ error: 'Function environment is not configured' }, 500, req)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401, req)
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return json({ error: 'Invalid or expired auth token' }, 401, req)
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

    if (await isRateLimited(user.id)) {
      return json({ error: 'Too many SMS requests. Please try again later.' }, 429, req, {
        'Retry-After': '3600',
      })
    }

    const { to, message } = await req.json()

    if (typeof to !== 'string' || !/^\+63\d{10}$/.test(to)) {
      return json({ error: 'Invalid phone number format. Use +63XXXXXXXXXX.' }, 400, req)
    }

    if (typeof message !== 'string' || !message.trim()) {
      return json({ error: 'Message is required' }, 400, req)
    }

    if (message.length > 480) {
      return json({ error: 'Message is too long (max 480 chars)' }, 400, req)
    }

    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    const body = new URLSearchParams({
      To: to,
      From: TWILIO_FROM_NUMBER,
      Body: message.trim(),
    })

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    )

    const result = await twilioRes.json()

    if (!twilioRes.ok) {
      console.error('Twilio error:', result)
      return json({ error: result?.message ?? 'SMS provider error' }, 502, req)
    }

    return json({ success: true, sid: result.sid }, 200, req)
  } catch (err) {
    console.error('send-sms function error:', err)
    return json({ error: 'Internal server error' }, 500, req)
  }
})
