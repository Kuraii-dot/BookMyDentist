import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Field } from '../components/ui/shared'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🦷</span>
          </div>
          <h1 className="font-display font-bold text-slate-900 text-2xl">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to BookMyDentistPH</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" required>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" className="input" autoFocus/>
            </Field>

            <Field label="Password" required>
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
              {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700">Sign up</Link>
        </p>
      </div>
    </div>
  )
}