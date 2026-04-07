import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Mail, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { num: '1', text: 'Open the email from BookMyDentist' },
  { num: '2', text: 'Click "Confirm your email"' },
  { num: '3', text: "You'll be redirected to login" },
]

export default function VerifyEmail() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const email     = location.state?.email || ''
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
        style={{ background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="font-display font-bold text-sky-400 text-3xl">Book</span>
            <span className="font-display font-bold text-slate-900 text-3xl">MyDentist</span>
          </Link>
        </div>

        <div className="card p-8 text-center">
          {/* Email icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Mail className="w-9 h-9 text-sky-500" />
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
            {STEPS.map(s => (
              <div key={s.num} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {s.num}
                </div>
                <p className="text-slate-600 text-sm">{s.text}</p>
              </div>
            ))}
          </div>

          {/* Resend */}
          {!resent ? (
            <button onClick={handleResend} disabled={resending}
              className="btn btn-secondary btn-md w-full rounded-2xl mb-3 flex items-center justify-center gap-2">
              {resending
                ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />Resending...</>
                : <><RefreshCw className="w-4 h-4" />Resend verification email</>}
            </button>
          ) : (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 mb-3 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-emerald-700 text-sm font-medium">Email resent! Check your inbox again.</p>
            </div>
          )}

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-sky-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}