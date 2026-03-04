// Supabase Edge Function: send-email
// Sends transactional emails via Resend (https://resend.com)
// Called from: booking confirmations, cancellations, promos

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL       = 'BookMyDentist <noreply@bookmydentist.com>'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { to, subject, html, text } = await req.json()

  if (!to || !subject || (!html && !text)) {
    return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html/text' }), { status: 400 })
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    FROM_EMAIL,
      to:      Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  })

  const result = await resendRes.json()

  if (!resendRes.ok) {
    console.error('Resend error:', result)
    return new Response(JSON.stringify({ error: result.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, id: result.id }), {
    headers: { 'Content-Type': 'application/json' },
  })
})