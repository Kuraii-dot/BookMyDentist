// Calls our deployed send-email Edge Function
// Used for: new booking alerts to clinic, status change alerts to customer

import { supabase } from './supabase'

export async function sendEmail({ to, subject, html }, options = {}) {
  const { bestEffort = true } = options
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    })

    if (error) {
      throw new Error(error.message || 'Email function returned an error')
    }

    return data
  } catch (err) {
    if (!bestEffort) throw err
    console.warn('Email send failed:', err)
    return null
  }
}

// ── Email Templates ──────────────────────────────────────────────────────────

function emailWrapper(content) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f0f9ff;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;">🦷</span>
        <h1 style="color:#0ea5e9;font-size:20px;margin:6px 0 0;">BookMyDentist</h1>
      </div>
      <div style="background:white;border-radius:12px;padding:24px 28px;">
        ${content}
      </div>
      <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:16px;">
        © ${new Date().getFullYear()} BookMyDentist · You're receiving this because you have an account with us.
      </p>
    </div>
  `
}

function row(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;">
      <span style="color:#94a3b8;font-size:13px;">${label}</span>
      <span style="color:#0f172a;font-size:13px;font-weight:600;">${value}</span>
    </div>
  `
}

function btn(text, href) {
  return `
    <div style="text-align:center;margin-top:20px;">
      <a href="${href}" style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
        ${text}
      </a>
    </div>
  `
}

// ── To clinic owner: new booking received ────────────────────────────────────
export function newBookingEmailToClinic({ clinicName, patientName, patientEmail, serviceName, date, time }) {
  return {
    subject: `📅 New Booking Request — ${patientName}`,
    html: emailWrapper(`
      <h2 style="color:#0f172a;font-size:18px;margin:0 0 4px;">New Appointment Request</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Someone just booked at <strong>${clinicName}</strong>. Review and confirm below.</p>
      ${row('Patient', patientName)}
      ${row('Email', patientEmail)}
      ${row('Service', serviceName)}
      ${row('Date', date)}
      ${row('Time', time)}
      ${btn('View Appointment →', 'https://bookmydentistph.com/clinic/appointments')}
    `)
  }
}

// ── To customer: booking confirmed ───────────────────────────────────────────
export function bookingConfirmedEmail({ patientName, clinicName, serviceName, date, time }) {
  return {
    subject: `✅ Appointment Confirmed — ${clinicName}`,
    html: emailWrapper(`
      <h2 style="color:#0f172a;font-size:18px;margin:0 0 4px;">Your appointment is confirmed! 🎉</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Hi ${patientName}, see you at your appointment.</p>
      ${row('Clinic', clinicName)}
      ${row('Service', serviceName)}
      ${row('Date', date)}
      ${row('Time', time)}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;margin-top:16px;">
        <p style="color:#166534;font-size:13px;margin:0;">💡 Please arrive 5–10 minutes early. Contact the clinic if you need to reschedule.</p>
      </div>
      ${btn('View My Appointments →', 'https://bookmydentistph.com/dashboard/appointments')}
    `)
  }
}

// ── To customer: booking declined ────────────────────────────────────────────
export function bookingDeclinedEmail({ patientName, clinicName, serviceName, date, reason }) {
  return {
    subject: `❌ Appointment Declined — ${clinicName}`,
    html: emailWrapper(`
      <h2 style="color:#0f172a;font-size:18px;margin:0 0 4px;">Appointment Not Available</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Hi ${patientName}, unfortunately your request could not be accommodated.</p>
      ${row('Clinic', clinicName)}
      ${row('Service', serviceName)}
      ${row('Date', date)}
      ${reason ? row('Reason', reason) : ''}
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin-top:16px;">
        <p style="color:#991b1b;font-size:13px;margin:0;">You can book a different time slot at your convenience.</p>
      </div>
      ${btn('Book Again →', 'https://bookmydentistph.com/dashboard/browse')}
    `)
  }
}

// ── To customer: booking rescheduled ─────────────────────────────────────────
export function bookingRescheduledEmail({ patientName, clinicName, serviceName, newDate, newTime }) {
  return {
    subject: `🔄 Appointment Rescheduled — ${clinicName}`,
    html: emailWrapper(`
      <h2 style="color:#0f172a;font-size:18px;margin:0 0 4px;">New Time Proposed</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Hi ${patientName}, the clinic has proposed a new time for your appointment.</p>
      ${row('Clinic', clinicName)}
      ${row('Service', serviceName)}
      ${row('New Date', newDate)}
      ${row('New Time', newTime)}
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin-top:16px;">
        <p style="color:#1e40af;font-size:13px;margin:0;">Please log in to accept or decline this new schedule.</p>
      </div>
      ${btn('View & Respond →', 'https://bookmydentistph.com/dashboard/appointments')}
    `)
  }
}

// ── To customer: appointment completed ───────────────────────────────────────
export function bookingCompletedEmail({ patientName, clinicName, serviceName, date }) {
  return {
    subject: `🏆 Visit Complete — ${clinicName}`,
    html: emailWrapper(`
      <h2 style="color:#0f172a;font-size:18px;margin:0 0 4px;">Thanks for your visit!</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 20px;">Hi ${patientName}, we hope your appointment went well.</p>
      ${row('Clinic', clinicName)}
      ${row('Service', serviceName)}
      ${row('Date', date)}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;margin-top:16px;">
        <p style="color:#166534;font-size:13px;margin:0;">⭐ Leave a review to help other patients find great dental care!</p>
      </div>
      ${btn('Leave a Review →', 'https://bookmydentistph.com/dashboard/appointments')}
    `)
  }
}

// ── Sent to CUSTOMER when they submit a booking request ──
export async function sendBookingRequestedEmail({ to, patientName, clinicName, serviceName, date, time }) {
  await sendEmail({
    to,
    subject: `📅 Booking Request Sent — ${clinicName}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f0f9ff;padding:0;border-radius:20px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:36px 40px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🦷 BookMyDentistPH</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your dental booking platform</p>
        </div>
        <!-- Body -->
        <div style="padding:40px;">
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;font-weight:700;">Booking Request Sent! 🎉</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">
            Hi <strong>${patientName}</strong>, your appointment request has been sent to <strong>${clinicName}</strong>.
            You'll receive a notification once the clinic confirms.
          </p>
          <!-- Details card -->
          <div style="background:white;border-radius:16px;padding:24px;border:1px solid #e0f2fe;margin-bottom:28px;">
            <p style="color:#0ea5e9;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">Appointment Details</p>
            ${[
              ['🏥', 'Clinic',   clinicName],
              ['🦷', 'Service',  serviceName],
              ['📅', 'Date',     date],
              ['🕐', 'Time',     time],
            ].map(([icon, label, value]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f9ff;">
                <span style="color:#94a3b8;font-size:13px;">${icon} ${label}</span>
                <span style="color:#0f172a;font-size:13px;font-weight:600;">${value}</span>
              </div>
            `).join('')}
          </div>
          <!-- Status badge -->
          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:12px;padding:14px 18px;margin-bottom:28px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">⏳</span>
            <p style="margin:0;color:#854d0e;font-size:13px;font-weight:500;">
              Status: <strong>Pending Confirmation</strong> — the clinic will review and respond shortly.
            </p>
          </div>
          <!-- CTA -->
          <div style="text-align:center;">
            <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://bookmydentistph.com'}/dashboard/appointments"
              style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(14,165,233,0.35);">
              View My Appointments →
            </a>
          </div>
        </div>
        <!-- Footer -->
        <div style="padding:20px 40px;text-align:center;border-top:1px solid #e0f2fe;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">— The BookMyDentistPH Team</p>
        </div>
      </div>
    `
  })
}

// ── Sent to CLINIC OWNER when a new booking request arrives ──
export async function sendNewBookingAlertEmail({ to, ownerName, clinicName, patientName, serviceName, date, time }) {
  await sendEmail({
    to,
    subject: `📅 New Appointment Request — ${patientName}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f0f9ff;padding:0;border-radius:20px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:36px 40px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🦷 BookMyDentistPH</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Clinic Dashboard Notification</p>
        </div>
        <!-- Body -->
        <div style="padding:40px;">
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;font-weight:700;">New Booking Request 🔔</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">
            Hi <strong>${ownerName}</strong>, a patient has requested an appointment at <strong>${clinicName}</strong>.
            Please review and respond as soon as possible.
          </p>
          <!-- Details card -->
          <div style="background:white;border-radius:16px;padding:24px;border:1px solid #e0f2fe;margin-bottom:28px;">
            <p style="color:#0ea5e9;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">Request Details</p>
            ${[
              ['👤', 'Patient',  patientName],
              ['🦷', 'Service',  serviceName],
              ['📅', 'Date',     date],
              ['🕐', 'Time',     time],
            ].map(([icon, label, value]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f9ff;">
                <span style="color:#94a3b8;font-size:13px;">${icon} ${label}</span>
                <span style="color:#0f172a;font-size:13px;font-weight:600;">${value}</span>
              </div>
            `).join('')}
          </div>
          <!-- Urgency note -->
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 18px;margin-bottom:28px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">⚡</span>
            <p style="margin:0;color:#9a3412;font-size:13px;font-weight:500;">
              Respond promptly — patients are more likely to follow through when confirmed quickly.
            </p>
          </div>
          <!-- CTA -->
          <div style="text-align:center;">
            <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://bookmydentistph.com'}/clinic/appointments"
              style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(14,165,233,0.35);">
              Review Request →
            </a>
          </div>
        </div>
        <!-- Footer -->
        <div style="padding:20px 40px;text-align:center;border-top:1px solid #e0f2fe;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">— The BookMyDentistPH Team</p>
        </div>
      </div>
    `
  })
}

export async function sendClinicApprovedEmail({ to, clinicName, ownerName }) {
  await sendEmail({
    to,
    subject: `🎉 Your clinic has been approved — ${clinicName}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f0f9ff;padding:0;border-radius:20px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:36px 40px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">🦷 BookMyDentistPH</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 12px;">Welcome aboard, ${ownerName}! 🎉</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your clinic <strong>${clinicName}</strong> has been approved and is now live on BookMyDentistPH.
            Patients can now find and book appointments with you.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="https://bookmydentistph.com/clinic"
              style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
              Go to Dashboard →
            </a>
          </div>
        </div>
        <div style="padding:20px 40px;text-align:center;border-top:1px solid #e0f2fe;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">— The BookMyDentistPH Team</p>
        </div>
      </div>
    `
  })
}

export async function sendClinicRejectedEmail({ to, clinicName, ownerName, reason }) {
  await sendEmail({
    to,
    subject: `Update on your BookMyDentistPH application — ${clinicName}`,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f0f9ff;padding:0;border-radius:20px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:36px 40px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">🦷 BookMyDentistPH</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 12px;">Hi ${ownerName},</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Thank you for applying with <strong>${clinicName}</strong>. Unfortunately we're unable to approve it at this time.
          </p>
          ${reason ? `
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;">
            <p style="color:#dc2626;font-weight:700;margin:0 0 6px;">Reason:</p>
            <p style="color:#7f1d1d;margin:0;">${reason}</p>
          </div>` : ''}
          <p style="color:#64748b;font-size:14px;">If you believe this is a mistake, please contact our support team.</p>
        </div>
        <div style="padding:20px 40px;text-align:center;border-top:1px solid #e0f2fe;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">— The BookMyDentistPH Team</p>
        </div>
      </div>
    `
  })
}

export async function sendAppointmentEmail({ to, subject, patientName, clinicName, serviceName, date, time, status, reason }, options = {}) {
  await sendEmail({
    to,
    subject,
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f0f9ff;padding:0;border-radius:20px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:36px 40px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">🦷 BookMyDentistPH</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#0f172a;font-size:22px;margin:0 0 12px;">Hi ${patientName},</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">${subject}</p>
          <div style="background:white;border-radius:16px;padding:24px;border:1px solid #e0f2fe;margin-bottom:24px;">
            ${[['Clinic',clinicName],['Service',serviceName],['Date',date],['Time',time]].map(([l,v])=>`
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f9ff;">
                <span style="color:#94a3b8;font-size:13px;">${l}</span>
                <span style="color:#0f172a;font-size:13px;font-weight:600;">${v}</span>
              </div>`).join('')}
          </div>
          ${reason ? `
          <div style="background:#fef2f2;border-radius:12px;padding:16px;margin-bottom:24px;">
            <p style="color:#dc2626;font-weight:700;margin:0 0 6px;">Reason:</p>
            <p style="color:#7f1d1d;margin:0;">${reason}</p>
          </div>` : ''}
          <div style="text-align:center;">
            <a href="https://bookmydentistph.com/dashboard/appointments"
              style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:white;padding:14px 36px;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
              View My Appointments →
            </a>
          </div>
        </div>
        <div style="padding:20px 40px;text-align:center;border-top:1px solid #e0f2fe;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">— The BookMyDentistPH Team</p>
        </div>
      </div>
    `
  }, options)
}