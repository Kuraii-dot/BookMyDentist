import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const location    = useLocation()
  const navigate    = useNavigate()
  const email       = location.state?.email || ''
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)

  async function handleResend() {
    if (!email) { toast.error('No email found. Please register again.'); return }
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (error) { toast.error(error.message); return }
    setResent(true)
    toast.success('Verification email resent!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-25"
        style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 70%)'}} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-20"
        style={{background:'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)'}} />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">🦷</span>
            </div>
            <span className="font-display font-bold text-slate-900">BookMyDentist</span>
          </Link>
        </div>

        <div className="card p-8 text-center">
          {/* Email illustration */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
            📧
          </div>

          <h1 className="font-display font-bold text-slate-900 text-2xl mb-2">Check your email</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-1">
            We sent a verification link to:
          </p>
          {email && (
            <p className="font-semibold text-sky-600 text-sm mb-5 break-all">{email}</p>
          )}
          <p className="text-slate-400 text-sm leading-relaxed mb-7">
            Click the link in that email to activate your account. Check your spam folder if you don't see it within a minute.
          </p>

          {/* Steps */}
          <div className="bg-sky-50 rounded-2xl p-4 mb-7 text-left space-y-3">
            {[
              { icon: '1️⃣', text: 'Open the email from BookMyDentist' },
              { icon: '2️⃣', text: 'Click "Confirm your email"' },
              { icon: '3️⃣', text: 'You\'ll be redirected to login' },
            ].map(s => (
              <div key={s.icon} className="flex items-center gap-3">
                <span className="text-base">{s.icon}</span>
                <p className="text-slate-600 text-sm">{s.text}</p>
              </div>
            ))}
          </div>

          {/* Resend */}
          {!resent ? (
            <button onClick={handleResend} disabled={resending}
              className="btn btn-secondary btn-md w-full rounded-2xl mb-3">
              {resending
                ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/>Resending...</>
                : '🔄 Resend verification email'}
            </button>
          ) : (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 mb-3">
              <p className="text-emerald-700 text-sm font-medium">✅ Email resent! Check your inbox again.</p>
            </div>
          )}

          <Link to="/login" className="text-sm text-slate-400 hover:text-sky-600 transition-colors">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}