import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Field } from '../components/ui/shared'
import { Eye, EyeOff, Calendar, Star, Shield, MapPin } from 'lucide-react'
import { checkRateLimit, isValidEmail } from '../lib/security'

const FEATURES = [
  { Icon: MapPin,   text: 'Find verified dental clinics near you' },
  { Icon: Calendar, text: 'Book appointments in minutes, 24/7'    },
  { Icon: Star,     text: 'Read real reviews from real patients'   },
  { Icon: Shield,   text: 'Secure & private — your data is yours' },
]

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [showPw, setShowPw] = useState(false)

  function set(k) { return e => setForm(p => ({ ...p, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Rate limit login attempts
    const rateCheck = checkRateLimit('login')
    if (!rateCheck.allowed) {
      setError(rateCheck.message)
      return
    }

    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }

    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email:    form.email.trim().toLowerCase(),
      password: form.password,
    })

    if (err) {
      // Generic error — don't confirm whether email exists
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role
    if (role === 'clinic_owner')  navigate('/clinic')
    else if (role === 'super_admin') navigate('/admin')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg,#0ea5e9 0%,#0284c7 50%,#0369a1 100%)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,white 0%,transparent 70%)' }} />

        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-display font-bold text-white text-3xl">BookMyDentist</span>
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="font-display font-bold text-white text-4xl leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
              Welcome<br />back!
            </h1>
            <p className="text-sky-100 text-base leading-relaxed max-w-xs">
              Sign in to manage your appointments, find new clinics, and keep your smile on track.
            </p>
          </div>
          <ul className="space-y-3.5">
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sky-50 text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <blockquote className="text-sky-100 text-sm italic leading-relaxed border-l-2 border-white/30 pl-4">
            "Found my dentist in under a minute.<br />Booked instantly. No calls needed."
          </blockquote>
          <p className="text-sky-200 text-xs mt-2 pl-4">— BookMyDentistPH patient</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md">

          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="font-display font-bold text-sky-400 text-3xl">Book</span>
              <span className="font-display font-bold text-slate-900 text-3xl">MyDentist</span>
            </Link>
          </div>

          <div className="mb-7">
            <h2 className="font-display font-bold text-slate-900 text-2xl" style={{ letterSpacing: '-0.02em' }}>
              Sign in to your account
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Don't have one?{' '}
              <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">Create account</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Email Address" required>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                maxLength={254}
                className="input"
                autoFocus
                autoComplete="email"
              />
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  maxLength={128}
                  className="input pr-10"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {error && <Alert type="error">{error}</Alert>}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-2">
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in...</>
                : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
            By signing in you agree to our{' '}
            <Link to="/terms" className="text-sky-500 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}