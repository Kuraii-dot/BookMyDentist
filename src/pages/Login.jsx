import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Field } from '../components/ui/shared'
import { Eye, EyeOff, Calendar, Star, Shield, MapPin } from 'lucide-react'

const FEATURES = [
  { Icon: MapPin,    text: 'Find verified dental clinics near you'  },
  { Icon: Calendar,  text: 'Book appointments in minutes, 24/7'     },
  { Icon: Star,      text: 'Read real reviews from real patients'    },
  { Icon: Shield,    text: 'Secure & private — your data is yours'  },
]

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [showPw, setShowPw] = useState(false)

  function set(k){ return e => setForm(p=>({...p,[k]:e.target.value})) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email||!form.password){ setError('Please fill in all fields'); return }
    setLoading(true)
    const { data, error:err } = await supabase.auth.signInWithPassword({ email:form.email, password:form.password })
    if (err){ setError(err.message); setLoading(false); return }
    const role = data.user?.user_metadata?.role
    if (role==='clinic_owner') navigate('/clinic')
    else if (role==='super_admin') navigate('/admin')
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{background:'linear-gradient(150deg,#0ea5e9 0%,#0284c7 50%,#0369a1 100%)'}}>

        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)',backgroundSize:'28px 28px'}}/>
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
          style={{background:'radial-gradient(circle,white 0%,transparent 70%)'}}/>
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-15"
          style={{background:'radial-gradient(circle,rgba(251,191,36,0.5) 0%,transparent 70%)'}}/>

        {/* Logo */}
        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-display font-bold text-white text-3xl">BookMyDentist</span>
          </Link>
        </div>

        {/* Main copy */}
        <div className="relative space-y-8">
          <div>
            <h1 className="font-display font-bold text-white text-4xl leading-tight mb-3"
              style={{letterSpacing:'-0.02em'}}>
              Welcome<br/>back!
            </h1>
            <p className="text-sky-100 text-base leading-relaxed max-w-xs">
              Sign in to manage your appointments, find new clinics, and keep your smile on track.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3.5">
            {FEATURES.map(({ Icon, text })=>(
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white"/>
                </div>
                <span className="text-sky-50 text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {['#bae6fd','#7dd3fc','#38bdf8','#0ea5e9','#0284c7'].map((bg,i)=>(
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold"
                  style={{backgroundColor:bg}}>
                  {['J','M','A','R','K'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {[1,2,3,4,5].map(s=>(
                  <svg key={s} className="w-3.5 h-3.5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-sky-100 text-xs">Trusted by patients & clinics</p>
            </div>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative">
          <blockquote className="text-sky-100 text-sm italic leading-relaxed border-l-2 border-white/30 pl-4">
            "Found my dentist in under a minute.<br/>Booked instantly. No calls needed."
          </blockquote>
          <p className="text-sky-200 text-xs mt-2 pl-4">— BookMyDentistPH patient</p>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
            <span className="font-display font-bold text-sky-400 text-3xl">Book
            <span className="font-display font-bold text-slate-900 text-3xl">
              MyDentist
            </span></span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="font-display font-bold text-slate-900 text-2xl" style={{letterSpacing:'-0.02em'}}>
              Sign in to your account
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Don't have one?{' '}
              <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">Create account</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email Address" required>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" className="input" autoFocus/>
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <input type={showPw?'text':'password'} value={form.password} onChange={set('password')}
                  placeholder="••••••••" className="input pr-10"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </Field>

            {error && <Alert type="error">{error}</Alert>}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full mt-2">
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in...</>
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
