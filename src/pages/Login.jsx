import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const { signIn, profile }   = useAuth()
  const navigate              = useNavigate()

  useEffect(() => {
    if (profile) {
      const map = { super_admin: '/admin', clinic_owner: '/clinic', customer: '/dashboard' }
      navigate(map[profile.role] || '/')
    }
  }, [profile])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await signIn({ email: form.email, password: form.password })
    setLoading(false)

    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        toast.error('Please verify your email first. Check your inbox!')
        navigate('/verify-email', { state: { email: form.email } })
      } else {
        toast.error('Invalid email or password')
      }
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user && !user.email_confirmed_at) {
      await supabase.auth.signOut()
      toast.error('Please verify your email before logging in.')
      navigate('/verify-email', { state: { email: form.email } })
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#eef7ff' }}>

      {/* ── Ambient background glows ── */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)' }} />
      <div className="pointer-events-none fixed top-1/2 left-1/4 w-64 h-64 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #a5f3fc 0%, transparent 70%)' }} />

      <div className="relative w-full flex flex-col">

        {/* ── Top nav ── */}
        <nav className="px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-[0_4px_12px_rgba(14,165,233,0.35)]">
              <span className="text-white text-base">🦷</span>
            </div>
            <span className="font-bold text-slate-900 tracking-tight">
              BookMyDentist<span className="text-sky-500">PH</span>
            </span>
          </Link>
        </nav>

        {/* ── Form center ── */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm animate-fade-in">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl
                bg-gradient-to-br from-sky-400 to-cyan-500 shadow-[0_12px_32px_rgba(14,165,233,0.4)]">
                🦷
              </div>
              <h1 className="font-bold text-slate-900 text-3xl tracking-tight">Welcome back</h1>
              <p className="text-slate-400 mt-1.5 text-sm">Sign in to your BookMyDentistPH account</p>
            </div>

            {/* Glass card */}
            <div className="rounded-3xl border border-white/90 p-7 shadow-[0_8px_32px_rgba(14,165,233,0.10)]"
              style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-base pointer-events-none">
                      ✉️
                    </span>
                    <input
                      type="email" required value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="juan@gmail.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sky-200/80 bg-white/70 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-base pointer-events-none">
                      🔒
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'} required value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Your password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-sky-200/80 bg-white/70 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-medium">
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm mt-2 flex items-center justify-center gap-2
                    bg-gradient-to-r from-sky-400 to-cyan-400
                    shadow-[0_4px_15px_rgba(14,165,233,0.4)]
                    hover:shadow-[0_6px_20px_rgba(14,165,233,0.5)]
                    hover:-translate-y-0.5
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
                    transition-all duration-200">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Signing in...</>
                    : 'Sign In →'}
                </button>
              </form>

              {/* Footer links */}
              <div className="mt-6 pt-5 border-t border-sky-100/60 text-center space-y-2">
                <p className="text-slate-400 text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-bold text-sky-500 hover:text-sky-600 transition-colors">
                    Sign up free
                  </Link>
                </p>
                <p className="text-slate-400 text-xs">
                  Didn't get the verification email?{' '}
                  <Link to="/verify-email" className="text-sky-400 hover:text-sky-500 transition-colors">
                    Resend it
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mascot placeholder (bottom-right, fixed) ── */}
      <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-xl border-2 border-sky-200/60 shadow-[0_8px_24px_rgba(14,165,233,0.2)] flex items-center justify-center">
          {/* TODO: replace with 3D mascot image */}
          <span className="text-2xl">🦷</span>
        </div>
      </div>
    </div>
  )
}