import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Mail, MessageSquare, Building2, CheckCircle2 } from 'lucide-react'
import { Field, Alert } from '../components/ui/shared'

const CONTACTS = [
  { Icon:Mail,          label:'Email Us',     value:'hello@bookmydentistph.com',   note:'We reply within 24 hours' },
  { Icon:Building2,     label:'For Clinics',  value:'clinics@bookmydentistph.com', note:'Partnership & onboarding' },
  { Icon:MessageSquare, label:'Support',      value:'support@bookmydentistph.com', note:'Technical issues & help' },
]

export default function ContactUs() {
  const [form, setForm]         = useState({name:'',email:'',subject:'general',message:''})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]   = useState(false)

  function set(k){ return e => setForm(p=>({...p,[k]:e.target.value})) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()||!form.email.trim()||!form.message.trim()) return
    setLoading(true)
    await new Promise(r=>setTimeout(r,800))
    setLoading(false); setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar/>
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
            {CONTACTS.map(c=>(
              <div key={c.label} className="card p-4 flex gap-3 items-start">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                  <c.Icon className="w-4 h-4 text-sky-500"/>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{c.label}</p>
                  <p className="text-sky-600 text-sm font-medium">{c.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{c.note}</p>
                </div>
              </div>
            ))}
            <div className="card p-4">
              <p className="section-label mb-2">Quick Links</p>
              <div className="space-y-2">
                {[
                  {to:'/about',              label:'About BookMyDentistPH'},
                  {to:'/register?role=clinic',label:'List your clinic'},
                  {to:'/register',           label:'Book an appointment'},
                ].map(l=>(
                  <Link key={l.to} to={l.to} className="flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300 shrink-0"/>{l.label}
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
                    <CheckCircle2 className="w-8 h-8 text-emerald-500"/>
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-xl mb-2">Message Sent!</h3>
                  <p className="text-slate-500 text-sm mb-6">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                  <button onClick={()=>{setSubmitted(false);setForm({name:'',email:'',subject:'general',message:''})}}
                    className="btn btn-secondary btn-md">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Your Name" required>
                      <input type="text" required value={form.name} onChange={set('name')}
                        placeholder="Juan dela Cruz" className="input"/>
                    </Field>
                    <Field label="Email" required>
                      <input type="email" required value={form.email} onChange={set('email')}
                        placeholder="juan@gmail.com" className="input"/>
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
                    <textarea required rows={5} value={form.message} onChange={set('message')}
                      placeholder="Tell us how we can help..." className="input resize-none"/>
                  </Field>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full">
                    {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending...</> : 'Send Message →'}
                  </button>
                  <p className="text-slate-400 text-xs text-center">We typically respond within 24 hours on business days.</p>
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