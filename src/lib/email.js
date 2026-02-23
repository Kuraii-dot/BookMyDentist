// Email sending via Resend API
// Install: npm install resend
// Get your API key from resend.com and add to .env:
// VITE_RESEND_API_KEY=re_xxxxxxxx
// VITE_FROM_EMAIL=noreply@yourdomain.com  (must be a verified domain in Resend)

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'onboarding@resend.dev'
const APP_NAME = 'DentBook'

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('Resend API key not set — skipping email')
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: `${APP_NAME} <${FROM_EMAIL}>`, to, subject, html })
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('Resend error:', err)
    }
  } catch (err) {
    console.error('Email send failed:', err)
  }
}

export async function sendClinicApprovedEmail({ to, clinicName, ownerName }) {
  await sendEmail({
    to,
    subject: `🎉 Your clinic has been approved — ${clinicName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fffbeb; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #d97706; font-size: 32px; margin: 0;">🦷 DentBook</h1>
        </div>
        <h2 style="color: #1c1917; font-size: 24px;">Welcome aboard, ${ownerName}! 🎉</h2>
        <p style="color: #57534e; line-height: 1.6;">
          Great news! Your clinic <strong>${clinicName}</strong> has been approved and is now live on DentBook.
          Patients can now find and book appointments with you.
        </p>
        <p style="color: #57534e; line-height: 1.6;">
          Log in to your dashboard to set up your services and start accepting bookings.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${window.location.origin}/login"
            style="background: #f59e0b; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Go to Dashboard →
          </a>
        </div>
        <p style="color: #a8a29e; font-size: 13px; text-align: center;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    `
  })
}

export async function sendClinicRejectedEmail({ to, clinicName, ownerName, reason }) {
  await sendEmail({
    to,
    subject: `Update on your DentBook clinic application — ${clinicName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fffbeb; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #d97706; font-size: 32px; margin: 0;">🦷 DentBook</h1>
        </div>
        <h2 style="color: #1c1917; font-size: 24px;">Hi ${ownerName},</h2>
        <p style="color: #57534e; line-height: 1.6;">
          Thank you for applying to join DentBook with <strong>${clinicName}</strong>.
          After reviewing your application, we're unable to approve it at this time.
        </p>
        ${reason ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="color: #dc2626; font-weight: bold; margin: 0 0 8px 0;">Reason:</p>
          <p style="color: #7f1d1d; margin: 0;">${reason}</p>
        </div>
        ` : ''}
        <p style="color: #57534e; line-height: 1.6;">
          If you believe this is a mistake or have addressed the issue, feel free to contact us.
        </p>
        <p style="color: #a8a29e; font-size: 13px; text-align: center; margin-top: 32px;">
          — The DentBook Team
        </p>
      </div>
    `
  })
}

export async function sendAppointmentEmail({ to, subject, patientName, clinicName, serviceName, date, time, status, reason }) {
  const statusColors = {
    accepted: '#16a34a',
    rejected: '#dc2626',
    rescheduled: '#2563eb',
    completed: '#7c3aed'
  }
  const color = statusColors[status] || '#d97706'

  await sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fffbeb; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #d97706; font-size: 32px; margin: 0;">🦷 DentBook</h1>
        </div>
        <h2 style="color: #1c1917;">Hi ${patientName},</h2>
        <p style="color: #57534e; line-height: 1.6;">${subject}</p>
        <div style="background: white; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #a8a29e; padding: 6px 0; font-size: 13px;">Clinic</td><td style="color: #1c1917; font-weight: bold;">${clinicName}</td></tr>
            <tr><td style="color: #a8a29e; padding: 6px 0; font-size: 13px;">Service</td><td style="color: #1c1917;">${serviceName}</td></tr>
            <tr><td style="color: #a8a29e; padding: 6px 0; font-size: 13px;">Date</td><td style="color: #1c1917;">${date}</td></tr>
            <tr><td style="color: #a8a29e; padding: 6px 0; font-size: 13px;">Time</td><td style="color: #1c1917;">${time}</td></tr>
          </table>
        </div>
        ${reason ? `
        <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin-top: 16px;">
          <p style="color: #dc2626; font-weight: bold; margin: 0 0 6px;">Reason: </p>
          <p style="color: #7f1d1d; margin: 0;">${reason}</p>
        </div>` : ''}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${window.location.origin}/dashboard/appointments"
            style="background: #f59e0b; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold;">
            View My Appointments →
          </a>
        </div>
        <p style="color: #a8a29e; font-size: 13px; text-align: center;">— The DentBook Team</p>
      </div>
    `
  })
}