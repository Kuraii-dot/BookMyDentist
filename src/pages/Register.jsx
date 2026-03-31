import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Field } from '../components/ui/shared'
import { Eye, EyeOff, CheckCircle2, Star, Shield, Calendar, MapPin } from 'lucide-react'

const PATIENT_PERKS = [
  { Icon: MapPin,       text: 'Find verified dental clinics near you' },
  { Icon: Calendar,     text: 'Book appointments in minutes, 24/7'    },
  { Icon: Star,         text: 'Read real reviews from real patients'   },
  { Icon: Shield,       text: 'Secure & private — your data is yours'  },
]

const CLINIC_PERKS = [
  { Icon: Calendar,     text: 'Manage appointments from one dashboard' },
  { Icon: Star,         text: 'Get discovered by patients in your city'},
  { Icon: Shield,       text: 'Admin-verified listing builds trust'    },
  { Icon: CheckCircle2, text: 'Free to list — no setup fees'          },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ full_name:'', email:'', password:'', role:'customer' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const isClinic = form.role === 'clinic_owner'
  const perks    = isClinic ? CLINIC_PERKS : PATIENT_PERKS

  function set(k){ return e => setForm(p=>({...p,[k]:e.target.value})) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!agreed) { setError('Please agree to the Terms of Service to continue'); return }
    if (!form.full_name.trim()||!form.email||!form.password) { setError('Please fill in all fields'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error:err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name, role: form.role } }
    })
    if (err) { setError(err.message); setLoading(false); return }
    navigate(isClinic ? '/clinic' : '/dashboard')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — brand / perks ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{background:'linear-gradient(150deg,#0ea5e9 0%,#0284c7 50%,#0369a1 100%)'}}>

        {/* Subtle grid pattern */}
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
            <img src="Logo.png" alt="BookMyDentistPH" className="w-20 h-20 object-contain"/>
            <span className="font-display font-bold text-white text-xl">BookMyDentistPH</span>
          </Link>
        </div>

        {/* Main copy — shifts based on role */}
        <div className="relative space-y-8">
          <div>
            <h1 className="font-display font-bold text-white text-4xl leading-tight mb-3"
              style={{letterSpacing:'-0.02em'}}>
              {isClinic
                ? <>Grow your<br/>dental practice</>
                : <>Your smile<br/>deserves the<br/>best care</>
              }
            </h1>
            <p className="text-sky-100 text-base leading-relaxed max-w-xs">
              {isClinic
                ? 'Join BookMyDentistPH and start managing appointments online — reach more patients with zero hassle.'
                : 'Find top-rated dental clinics near you, book instantly, and never miss a visit again.'
              }
            </p>
          </div>

          {/* Perks list */}
          <ul className="space-y-3.5">
            {perks.map(({ Icon, text }) => (
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
              <p className="text-sky-100 text-xs">Trusted by early patients & clinics</p>
            </div>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative">
          <blockquote className="text-sky-100 text-sm italic leading-relaxed border-l-2 border-white/30 pl-4">
            "Booking my dental appointment used to take so many calls.<br/>
            Now it's done in 2 minutes."
          </blockquote>
          <p className="text-sky-200 text-xs mt-2 pl-4">— Early BookMyDentistPH user</p>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/Logo.png" alt="BookMyDentist" className="w-17 h-15 object-contain"/>
              <span className="font-display font-bold text-slate-900">BookMyDentist</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="font-display font-bold text-slate-900 text-2xl" style={{letterSpacing:'-0.02em'}}>
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
              { val:'customer',     label:'🦷 I\'m a Patient' },
              { val:'clinic_owner', label:'🏥 I\'m a Clinic'  },
            ].map(r=>(
              <button key={r.val} type="button" onClick={()=>setForm(p=>({...p,role:r.val}))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  form.role===r.val
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Role description pill */}
          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-5 transition-all ${
            isClinic
              ? 'bg-violet-50 text-violet-700 border border-violet-200'
              : 'bg-sky-50 text-sky-700 border border-sky-200'
          }`}>
            <span>{isClinic ? '🏥' : '🦷'}</span>
            {isClinic
              ? 'Your clinic will be reviewed and approved by our admin team before going live.'
              : 'Browse, book, and manage your dental appointments all in one place.'
            }
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label={isClinic ? 'Your Full Name' : 'Full Name'} required>
              <input value={form.full_name} onChange={set('full_name')}
                placeholder={isClinic ? 'Dr. Juan dela Cruz' : 'Juan dela Cruz'}
                className="input" autoFocus/>
            </Field>

            <Field label="Email Address" required>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="juan@example.com" className="input"/>
            </Field>

            <Field label="Password" required hint="Minimum 6 characters">
              <div className="relative">
                <input type={showPw?'text':'password'} value={form.password} onChange={set('password')}
                  placeholder="Create a strong password" className="input pr-10"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </Field>

            {/* Password strength indicator */}
            {form.password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i=>{
                    const strength =
                      form.password.length >= 12 ? 4 :
                      form.password.length >= 8  ? 3 :
                      form.password.length >= 6  ? 2 : 1
                    return (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                        i <= strength
                          ? strength >= 4 ? 'bg-emerald-400'
                          : strength >= 3 ? 'bg-sky-400'
                          : strength >= 2 ? 'bg-amber-400'
                          : 'bg-red-400'
                          : 'bg-slate-200'
                      }`}/>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-400">
                  {form.password.length < 6  ? 'Too short'  :
                   form.password.length < 8  ? 'Weak'       :
                   form.password.length < 12 ? 'Good'       : 'Strong ✓'}
                </p>
              </div>
            )}

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                agreed ? 'bg-sky-500 border-sky-500' : 'border-slate-300 group-hover:border-sky-400'
              }`} onClick={()=>setAgreed(p=>!p)}>
                {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3}/>}
              </div>
              <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="sr-only"/>
              <span className="text-xs text-slate-500 leading-relaxed">
                I agree to BookMyDentistPH's{' '}
                <Link to="/terms" className="text-sky-600 hover:underline font-medium">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-sky-600 hover:underline font-medium">Privacy Policy</Link>.
                {' '}I understand this platform connects patients with dental clinics and does not provide medical advice.
              </span>
            </label>

            {error && <Alert type="error">{error}</Alert>}

            <button type="submit" disabled={loading||!agreed}
              className="btn btn-primary btn-lg w-full mt-2">
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating account...</>
                : isClinic ? 'Create Clinic Account →' : 'Create Account →'
              }
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
            By creating an account you confirm you are at least 18 years old.<br/>
            BookMyDentistPH is a booking platform — not a medical provider.
          </p>
        </div>
      </div>
    </div>
  )
}