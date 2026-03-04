// Supabase Edge Function: send-sms
// Triggered server-side to send SMS via Twilio (configured in Supabase)
// Called from: booking confirmations, cancellations, reminders, promos

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER')! // e.g. +14155552671

serve(async (req) => {
  // Only allow POST from our own backend (Supabase DB triggers or webhook)
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { to, message } = await req.json()

  if (!to || !message) {
    return new Response(JSON.stringify({ error: 'Missing to or message' }), { status: 400 })
  }

  // Validate PH number format
  if (!/^\+63\d{10}$/.test(to)) {
    return new Response(JSON.stringify({ error: 'Invalid phone number format. Must be +63XXXXXXXXXX' }), { status: 400 })
  }

  // Send via Twilio REST API
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
  const body = new URLSearchParams({
    To:   to,
    From: TWILIO_FROM_NUMBER,
    Body: message,
  })

  const twilioRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body,
    }
  )

  const result = await twilioRes.json()

  if (!twilioRes.ok) {
    console.error('Twilio error:', result)
    return new Response(JSON.stringify({ error: result.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, sid: result.sid }), {
    headers: { 'Content-Type': 'application/json' },
  })
})