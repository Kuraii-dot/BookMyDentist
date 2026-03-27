import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Field } from '../components/ui/shared'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name:'', email:'', password:'', role:'customer' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  function set(k){ return e => setForm(p=>({...p,[k]:e.target.value})) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim()||!form.email||!form.password){ setError('Please fill in all fields'); return }
    if (form.password.length<6){ setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error:err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name, role: form.role }}
    })
    if (err){ setError(err.message); setLoading(false); return }
    navigate(form.role==='clinic_owner'?'/clinic':'/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/Logo.png" alt="BookMyDentistPH" className="w-20 h-20 rounded-2xl mx-auto mb-4 object-contain"/>
          <h1 className="font-display font-bold text-slate-900 text-2xl">Create account</h1>
          <p className="text-slate-500 text-sm mt-1">Join BookMyDentistPH today</p>
        </div>

        <div className="card p-6">
          {/* Role toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
            {[{val:'customer',label:'Patient'},{val:'clinic_owner',label:'Clinic'}].map(r=>(
              <button key={r.val} type="button" onClick={()=>setForm(p=>({...p,role:r.val}))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.role===r.val?'bg-white text-sky-600 shadow-sm':'text-slate-500'}`}>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name" required>
              <input value={form.full_name} onChange={set('full_name')}
                placeholder="Your full name" className="input" autoFocus/>
            </Field>
            <Field label="Email" required>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" className="input"/>
            </Field>
            <Field label="Password" required hint="Minimum 6 characters">
              <div className="relative">
                <input type={showPw?'text':'password'} value={form.password} onChange={set('password')}
                  placeholder="••••••••" className="input pr-10"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
            </Field>

            {error && <Alert type="error">{error}</Alert>}

            <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full">
              {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}