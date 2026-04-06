import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Field } from '../components/ui/shared'
import { Eye, EyeOff, CheckCircle2, Star, Shield, Calendar, MapPin } from 'lucide-react'
import {
  checkRateLimit,
  sanitizeName,
  isValidEmail,
  containsSuspiciousContent,
} from '../lib/security'

const PATIENT_PERKS = [
  { Icon: MapPin,       text: 'Find verified dental clinics near you' },
  { Icon: Calendar,     text: 'Book appointments in minutes, 24/7'    },
  { Icon: Star,         text: 'Read real reviews from real patients'   },
  { Icon: Shield,       text: 'Secure & private — your data is yours' },
]

const CLINIC_PERKS = [
  { Icon: Calendar,     text: 'Manage appointments from one dashboard' },
  { Icon: Star,         text: 'Get discovered by patients in your city' },
  { Icon: Shield,       text: 'Admin-verified listing builds trust'    },
  { Icon: CheckCircle2, text: 'Free to list — no setup fees'          },
]

// Password strength score 1-4
function getPasswordStrength(pw) {
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong ✓']
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-amber-400', 'bg-sky-400', 'bg-emerald-400']

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ full_name: '', email: '', password: '', role: 'customer' })
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPw, setShowPw]   = useState(false)
  const [agreed, setAgreed]   = useState(false)
  const mountTime = useRef(Date.now())

  const isClinic  = form.role === 'clinic_owner'
  const perks     = isClinic ? CLINIC_PERKS : PATIENT_PERKS
  const pwStrength = getPasswordStrength(form.password)

  function set(k) { return e => { setForm(p => ({ ...p, [k]: e.target.value })); setFieldErrors(p => ({ ...p, [k]: '' })) } }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Honeypot + timing bot check
    if (honeypot !== '' || Date.now() - mountTime.current < 1500) {
      await new Promise(r => setTimeout(r, 800))
      navigate('/verify-email', { state: { email: form.email } })
      return
    }

    // Rate limit
    const rateCheck = checkRateLimit('register')
    if (!rateCheck.allowed) {
      setError(rateCheck.message)
      return
    }

    // Agreement check
    if (!agreed) {
      setError('Please agree to the Terms of Service to continue')
      return
    }

    // Field validation
    const errors = {}
    const trimmedName = form.full_name.trim()

    if (!trimmedName) {
      errors.full_name = 'Full name is required'
    } else if (trimmedName.length < 2) {
      errors.full_name = 'Name must be at least 2 characters'
    } else if (trimmedName.length > 100) {
      errors.full_name = 'Name is too long'
    } else if (containsSuspiciousContent(trimmedName)) {
      errors.full_name = 'Name contains invalid characters'
    }

    if (!form.email) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!form.password) {
      errors.password = 'Password is required'
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (pwStrength < 2) {
      errors.password = 'Password is too weak. Add uppercase letters and numbers.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    const safeName = sanitizeName(form.full_name.trim(), 100)

    const { error: err } = await supabase.auth.signUp({
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      options:  { data: { full_name: safeName, role: form.role } },
    })

    if (err) {
      // Don't leak whether email exists
      if (err.message?.toLowerCase().includes('already registered') ||
          err.message?.toLowerCase().includes('already exists')) {
        // Navigate anyway — don't confirm if email is taken
        navigate('/verify-email', { state: { email: form.email } })
        return
      }
      setError(err.message)
      setLoading(false)
      return
    }

    navigate('/verify-email', { state: { email: form.email } })
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
              {isClinic ? <>Grow your<br />dental practice</> : <>Your smile<br />deserves the<br />best care</>}
            </h1>
            <p className="text-sky-100 text-base leading-relaxed max-w-xs">
              {isClinic
                ? 'Join BookMyDentistPH and start managing appointments online — reach more patients with zero hassle.'
                : 'Find top-rated dental clinics near you, book instantly, and never miss a visit again.'}
            </p>
          </div>
          <ul className="space-y-3.5">
            {perks.map(({ Icon, text }) => (
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
            "Booking my dental appointment used to take so many calls.<br />Now it's done in 2 minutes."
          </blockquote>
          <p className="text-sky-200 text-xs mt-2 pl-4">— Early BookMyDentistPH user</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="font-display font-bold text-sky-400 text-3xl">Book</span>
              <span className="font-display font-bold text-slate-900 text-3xl">MyDentist</span>
            </Link>
          </div>

          <div className="mb-7">
            <h2 className="font-display font-bold text-slate-900 text-2xl" style={{ letterSpacing: '-0.02em' }}>
              Create your account
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Already have one?{' '}
              <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">Sign in</Link>
            </p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-xl bg-slate-200/60 p-1 mb-6 gap-1">
            {[
              { val: 'customer',     label: "🦷 I'm a Patient" },
              { val: 'clinic_owner', label: "🏥 I'm a Clinic"  },
            ].map(r => (
              <button key={r.val} type="button" onClick={() => setForm(p => ({ ...p, role: r.val }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.role === r.val ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {r.label}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-5 transition-all ${isClinic ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
            <span>{isClinic ? '🏥' : '🦷'}</span>
            {isClinic
              ? 'Your clinic will be reviewed and approved by our admin team before going live.'
              : 'Browse, book, and manage your dental appointments all in one place.'}
          </div>

          {/* Honeypot — visually hidden */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
            <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label={isClinic ? 'Your Full Name' : 'Full Name'} required>
              <input
                value={form.full_name}
                onChange={set('full_name')}
                placeholder={isClinic ? 'Dr. Juan dela Cruz' : 'Juan dela Cruz'}
                maxLength={100}
                className={`input ${fieldErrors.full_name ? 'border-red-300' : ''}`}
                autoFocus
                autoComplete="name"
              />
              {fieldErrors.full_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>}
            </Field>

            <Field label="Email Address" required>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="juan@example.com"
                maxLength={254}
                className={`input ${fieldErrors.email ? 'border-red-300' : ''}`}
                autoComplete="email"
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </Field>

            <Field label="Password" required hint="Min 8 characters with uppercase and numbers">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Create a strong password"
                  maxLength={128}
                  className={`input pr-10 ${fieldErrors.password ? 'border-red-300' : ''}`}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </Field>

            {/* Password strength */}
            {form.password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pwStrength ? STRENGTH_COLORS[pwStrength] : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-400">{STRENGTH_LABELS[pwStrength]}</p>
              </div>
            )}

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed ? 'bg-sky-500 border-sky-500' : 'border-slate-300 group-hover:border-sky-400'}`}
                onClick={() => setAgreed(p => !p)}>
                {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
              <span className="text-xs text-slate-500 leading-relaxed">
                I agree to BookMyDentistPH's{' '}
                <Link to="/terms" className="text-sky-600 hover:underline font-medium">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-sky-600 hover:underline font-medium">Privacy Policy</Link>.
                {' '}I understand this platform connects patients with dental clinics and does not provide medical advice.
              </span>
            </label>

            {error && <Alert type="error">{error}</Alert>}

            <button type="submit" disabled={loading || !agreed} className="btn btn-primary btn-lg w-full mt-2">
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating account...</>
                : isClinic ? 'Create Clinic Account →' : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
            By creating an account you confirm you are at least 18 years old.<br />
            BookMyDentistPH is a booking platform — not a medical provider.
          </p>
        </div>
      </div>
    </div>
  )
}