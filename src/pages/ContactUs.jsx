import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Mail, MessageSquare, Building2, CheckCircle2, AlertCircle, Loader } from 'lucide-react'
import { Field, Alert } from '../components/ui/shared'
import { sendEmail } from '../lib/email'
import {
  checkRateLimit,
  sanitizeText,
  sanitizeName,
  isValidEmail,
  validateContactForm,
  isHoneypotTriggered,
  containsSuspiciousContent,
} from '../lib/security'

const CONTACTS = [
  { Icon: Mail,          label: 'Email Us',    value: 'hello@bookmydentistph.com', note: 'We reply within 24 hours' },
  { Icon: Building2,     label: 'For Clinics', value: 'hello@bookmydentistph.com', note: 'Clinic partnerships & onboarding' },
  { Icon: MessageSquare, label: 'Support',     value: 'hello@bookmydentistph.com', note: 'Technical issues & support' },
]

const SUBJECT_LABELS = {
  general:  'General Inquiry',
  clinic:   'Clinic Partnership',
  support:  'Technical Support',
  feedback: 'Feedback',
  report:   'Report an Issue',
}

export default function ContactUs() {
  const [form, setForm]           = useState({ name: '', email: '', subject: 'general', message: '' })
  const [honeypot, setHoneypot]   = useState('')   // hidden field — bots fill this
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const submitTimeRef = useRef(Date.now())          // track how fast form is submitted

  function set(k) { return e => { setForm(p => ({ ...p, [k]: e.target.value })); setFieldErrors(p => ({ ...p, [k]: '' })) } }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // ── Honeypot check ────────────────────────────────────────────────────────
    if (isHoneypotTriggered(honeypot)) {
      // Silently "succeed" so bots don't know they were caught
      setSubmitted(true)
      return
    }

    // ── Timing check: if form submitted in under 2 seconds, likely a bot ──────
    const elapsed = Date.now() - submitTimeRef.current
    if (elapsed < 2000) {
      setSubmitted(true)
      return
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const rateCheck = checkRateLimit('contact_form')
    if (!rateCheck.allowed) {
      setError(rateCheck.message)
      return
    }

    // ── Input validation ──────────────────────────────────────────────────────
    const { valid, errors } = validateContactForm(form)
    if (!valid) {
      setFieldErrors(errors)
      return
    }

    // ── Suspicious content check ──────────────────────────────────────────────
    if (
      containsSuspiciousContent(form.name) ||
      containsSuspiciousContent(form.message)
    ) {
      setError('Your message contains invalid content. Please remove any special characters or code.')
      return
    }

    // ── Email validation ──────────────────────────────────────────────────────
    if (!isValidEmail(form.email)) {
      setFieldErrors({ email: 'Please enter a valid email address' })
      return
    }

    setLoading(true)

    // ── Sanitize all inputs before sending ────────────────────────────────────
    const safeName    = sanitizeName(form.name, 100)
    const safeEmail   = form.email.trim().toLowerCase().slice(0, 254)
    const safeSubject = SUBJECT_LABELS[form.subject] || 'General Inquiry'
    const safeMessage = sanitizeText(form.message, 2000)

    try {
      await sendEmail({
        to: 'hello@bookmydentistph.com',
        subject: `[Contact Form] ${safeSubject} — from ${safeName}`,
        html: `
          <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f0f9ff;padding:0;border-radius:20px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:32px 40px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">🦷 BookMyDentistPH</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">New Contact Form Submission</p>
            </div>
            <div style="padding:32px 40px;background:white;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px;width:100px;">From</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;font-weight:600;">${safeName}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px;">Email</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0ea5e9;font-size:13px;">${safeEmail}</td></tr>
                <tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:13px;">Subject</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;font-weight:600;">${safeSubject}</td></tr>
              </table>
              <div style="margin-top:20px;">
                <p style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Message</p>
                <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap;">${safeMessage}</div>
              </div>
              <div style="margin-top:20px;background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:12px 16px;">
                <p style="color:#854d0e;font-size:12px;margin:0;">Reply directly to this email to respond to ${safeName} at ${safeEmail}</p>
              </div>
            </div>
            <div style="padding:16px 40px;text-align:center;border-top:1px solid #e0f2fe;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">Submitted via BookMyDentistPH contact form</p>
            </div>
          </div>
        `,
      })

      // Send auto-reply to the user
      await sendEmail({
        to: safeEmail,
        subject: `We received your message — BookMyDentistPH`,
        html: `
          <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f0f9ff;padding:0;border-radius:20px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);padding:32px 40px;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">🦷 BookMyDentistPH</h1>
            </div>
            <div style="padding:32px 40px;background:white;">
              <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px;">Thanks for reaching out, ${safeName}! 👋</h2>
              <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
                We've received your message and will get back to you within 24 hours on business days.
              </p>
              <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
                <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Your message</p>
                <p style="color:#334155;font-size:13px;line-height:1.6;margin:0;white-space:pre-wrap;">${safeMessage}</p>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin:0;">If this is urgent, you can also reach us directly at hello@bookmydentistph.com</p>
            </div>
            <div style="padding:16px 40px;text-align:center;border-top:1px solid #e0f2fe;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">— The BookMyDentistPH Team</p>
            </div>
          </div>
        `,
      })

      setSubmitted(true)
    } catch (err) {
      console.error('Contact form error:', err)
      setError('Failed to send your message. Please try again or email us directly at hello@bookmydentistph.com')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="section-label mb-3">Get in Touch</p>
          <h1 className="font-display font-bold text-slate-900 text-3xl sm:text-4xl mb-3">Contact Us</h1>
          <p className="text-slate-500 text-base max-w-lg mx-auto">Have a question or just want to say hi? We'd love to hear from you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-3">
            {CONTACTS.map(c => (
              <div key={c.label} className="card p-4 flex gap-3 items-start">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                  <c.Icon className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{c.label}</p>
                  <a href={`mailto:${c.value}`} className="text-sky-600 text-sm font-medium hover:underline">{c.value}</a>
                  <p className="text-slate-400 text-xs mt-0.5">{c.note}</p>
                </div>
              </div>
            ))}
            <div className="card p-4">
              <p className="section-label mb-2">Quick Links</p>
              <div className="space-y-2">
                {[
                  { to: '/about',               label: 'About BookMyDentistPH' },
                  { to: '/register?role=clinic', label: 'List your clinic' },
                  { to: '/register',             label: 'Book an appointment' },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300 shrink-0" />{l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-xl mb-2">Message Sent!</h3>
                  <p className="text-slate-500 text-sm mb-2">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                  <p className="text-slate-400 text-xs mb-6">A confirmation has been sent to your email.</p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: 'general', message: '' }); submitTimeRef.current = Date.now() }}
                    className="btn btn-secondary btn-md"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                  {/* Honeypot — hidden from real users, bots fill it */}
                  <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                    <input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={e => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Your Name" required>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={set('name')}
                        placeholder="Juan dela Cruz"
                        maxLength={100}
                        className={`input ${fieldErrors.name ? 'border-red-300 focus:border-red-400' : ''}`}
                        autoComplete="name"
                      />
                      {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                    </Field>
                    <Field label="Email" required>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={set('email')}
                        placeholder="juan@gmail.com"
                        maxLength={254}
                        className={`input ${fieldErrors.email ? 'border-red-300 focus:border-red-400' : ''}`}
                        autoComplete="email"
                      />
                      {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                    </Field>
                  </div>

                  <Field label="Subject">
                    <select value={form.subject} onChange={set('subject')} className="input">
                      <option value="general">General Inquiry</option>
                      <option value="clinic">Clinic Partnership</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="report">Report an Issue</option>
                    </select>
                  </Field>

                  <Field label="Message" required>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={set('message')}
                      placeholder="Tell us how we can help..."
                      maxLength={2000}
                      className={`input resize-none ${fieldErrors.message ? 'border-red-300 focus:border-red-400' : ''}`}
                    />
                    <div className="flex justify-between mt-1">
                      {fieldErrors.message
                        ? <p className="text-red-500 text-xs">{fieldErrors.message}</p>
                        : <span />
                      }
                      <p className="text-xs text-slate-400">{form.message.length}/2000</p>
                    </div>
                  </Field>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full">
                    {loading
                      ? <><Loader className="w-4 h-4 animate-spin" /> Sending...</>
                      : 'Send Message →'}
                  </button>

                  <p className="text-slate-400 text-xs text-center">
                    We typically respond within 24 hours on business days.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="btn btn-secondary btn-md">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}