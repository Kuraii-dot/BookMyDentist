import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
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
      // Give a clearer message for unconfirmed emails
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        toast.error('Please verify your email first. Check your inbox!')
        navigate('/verify-email', { state: { email: form.email } })
      } else {
        toast.error('Invalid email or password')
      }
      return
    }

    // Extra guard: check email_confirmed_at from Supabase user object
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !user.email_confirmed_at) {
      await supabase.auth.signOut()
      toast.error('Please verify your email before logging in.')
      navigate('/verify-email', { state: { email: form.email } })
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30"
        style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 70%)'}} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20"
        style={{background:'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)'}} />

      <div className="relative w-full flex flex-col">
        <nav className="px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">🦷</span>
            </div>
            <span className="font-display font-bold text-slate-900">BookMyDentist</span>
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-3xl mx-auto mb-5">
                🦷
              </div>
              <h1 className="font-display font-bold text-slate-900 text-3xl">Welcome back</h1>
              <p className="text-slate-400 mt-1.5 text-sm">Sign in to your BookMyDentist account</p>
            </div>

            <div className="card p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="juan@gmail.com" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <input type="password" required value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="Your password" className="input" />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full rounded-2xl mt-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in...</>
                    : 'Sign In →'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-sky-50 text-center space-y-2">
                <p className="text-slate-400 text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">Sign up free</Link>
                </p>
                <p className="text-slate-400 text-xs">
                  Didn't get the verification email?{' '}
                  <Link to="/verify-email" className="text-sky-500 hover:text-sky-600 transition-colors">Resend it</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}