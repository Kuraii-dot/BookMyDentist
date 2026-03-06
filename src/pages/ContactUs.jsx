import { useState } from 'react'
import { Link } from 'react-router-dom'

const ToothIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.5 2 7 4 7 6.5c0 1.5.5 2.8 1 4 .6 1.4.8 2.8.8 4.2 0 1.5.3 5.3 1.7 5.3.9 0 1.2-1.3 1.5-3 .3-1.7.5-3 1-3s.7 1.3 1 3c.3 1.7.6 3 1.5 3 1.4 0 1.7-3.8 1.7-5.3 0-1.4.2-2.8.8-4.2.5-1.2 1-2.5 1-4C18 4 15.5 2 12 2z"/>
  </svg>
)
const MailIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
)
const MessageIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const BuildingIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
  </svg>
)
const CheckCircleIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const LOGO = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-md">
      <ToothIcon className="w-4 h-4 text-white" />
    </div>
    <span className="font-display font-bold text-slate-900 text-lg">BookMyDentist</span>
  </div>
)

export default function ContactUs() {
  const [form, setForm]       = useState({ name: '', email: '', subject: 'general', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    setLoading(true)
    // Simulate send — replace with actual email/form service when ready
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setSubmitted(true)
  }

  const contacts = [
    { Icon: MailIcon,     label: 'Email Us',       value: 'hello@bookmydentist.com',   note: 'We reply within 24 hours' },
    { Icon: BuildingIcon, label: 'For Clinics',     value: 'clinics@bookmydentist.com', note: 'Partnership & onboarding' },
    { Icon: MessageIcon,  label: 'Support',         value: 'support@bookmydentist.com', note: 'Technical issues & help' },
  ]

  return (
    <div className="min-h-screen" style={{fontFamily:"'DM Sans', sans-serif"}}>
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20" style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 70%)'}}/>
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15" style={{background:'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)'}}/>

      <nav className="glass-header fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><LOGO /></Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors px-3 py-2">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-md">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="relative pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{background:'rgba(14,165,233,0.1)', border:'1px solid rgba(186,230,253,0.6)', color:'#0369a1'}}>
              Get in Touch
            </div>
            <h1 className="font-display font-bold text-slate-900 text-4xl sm:text-5xl mb-4" style={{letterSpacing:'-0.02em'}}>
              Contact <span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg, #0ea5e9, #06b6d4)'}}>Us</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">Have a question, concern, or just want to say hi? We'd love to hear from you.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Left — contact info */}
            <div className="lg:col-span-2 space-y-4">
              {contacts.map(c => (
                <div key={c.label} className="card p-5 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{background:'rgba(224,242,254,0.8)'}}>
                    <c.Icon className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{c.label}</p>
                    <p className="text-sky-600 text-sm font-medium">{c.value}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{c.note}</p>
                  </div>
                </div>
              ))}

              <div className="card p-5">
                <p className="font-semibold text-slate-800 text-sm mb-2">Quick Links</p>
                <div className="space-y-2">
                  <Link to="/about" className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300"/>About BookMyDentist
                  </Link>
                  <Link to="/register?role=clinic" className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300"/>List your clinic
                  </Link>
                  <Link to="/register" className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300"/>Book an appointment
                  </Link>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3">
              <div className="card p-7">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{background:'rgba(240,253,244,0.9)', border:'1px solid #bbf7d0'}}>
                      <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-xl mb-2">Message Sent!</h3>
                    <p className="text-slate-500 text-sm mb-6">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                    <button onClick={() => { setSubmitted(false); setForm({ name:'', email:'', subject:'general', message:'' }) }}
                      className="btn btn-secondary btn-md">Send another message</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Name *</label>
                        <input type="text" required value={form.name}
                          onChange={e => setForm({...form, name: e.target.value})}
                          placeholder="Juan dela Cruz" className="input" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                        <input type="email" required value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          placeholder="juan@gmail.com" className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                      <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input">
                        <option value="general">General Inquiry</option>
                        <option value="clinic">Clinic Partnership</option>
                        <option value="support">Technical Support</option>
                        <option value="feedback">Feedback</option>
                        <option value="report">Report an Issue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message *</label>
                      <textarea required rows={5} value={form.message}
                        onChange={e => setForm({...form, message: e.target.value})}
                        placeholder="Tell us how we can help..."
                        className="input resize-none" />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full rounded-2xl">
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending...</>
                        : 'Send Message →'}
                    </button>
                    <p className="text-slate-400 text-xs text-center">We typically respond within 24 hours on business days.</p>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link to="/" className="btn btn-secondary btn-md">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}