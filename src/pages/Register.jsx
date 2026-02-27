import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'clinic' ? 'clinic_owner' : 'customer'
  const [role, setRole] = useState(defaultRole)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName.trim()) { toast.error('Please enter your full name'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await signUp({ email: form.email, password: form.password, fullName: form.fullName, role })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Account created! Please sign in.')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex" style={{backgroundColor:'#f0f9ff'}}>
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30"
        style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 70%)'}} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20"
        style={{background:'radial-gradient(circle, #fde68a 0%, transparent 70%)'}} />

      <div className="relative w-full flex flex-col">
        <nav className="px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm shadow-sky-200">
              <span className="text-white text-sm">🦷</span>
            </div>
            <span className="font-display font-bold text-slate-900">BookMyDentist</span>
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm animate-fade-in">
            <div className="text-center mb-7">
              <h1 className="font-display font-bold text-slate-900 text-3xl">Create account</h1>
              <p className="text-slate-400 mt-1.5 text-sm">Join BookMyDentist for free</p>
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm shadow-sky-100 p-7">
              {/* Role toggle */}
              <div className="flex bg-sky-50 rounded-2xl p-1 mb-6 border border-sky-100">
                <button type="button" onClick={() => setRole('customer')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${role === 'customer' ? 'bg-white text-slate-800 shadow-sm border border-sky-100' : 'text-slate-400 hover:text-slate-600'}`}>
                  🙋 Patient
                </button>
                <button type="button" onClick={() => setRole('clinic_owner')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${role === 'clinic_owner' ? 'bg-white text-slate-800 shadow-sm border border-sky-100' : 'text-slate-400 hover:text-slate-600'}`}>
                  🦷 Clinic Owner
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" required value={form.fullName}
                    onChange={e => setForm({...form, fullName: e.target.value})}
                    placeholder="Juan dela Cruz" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="juan@email.com" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <input type="password" required value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="At least 6 characters" className="input" />
                </div>

                {role === 'clinic_owner' && (
                  <div className="rounded-2xl p-3 bg-amber-50 border border-amber-100">
                    <p className="text-amber-700 text-xs font-medium">
                      🔍 Clinic accounts require admin verification before going live. Usually 1–2 business days.
                    </p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full rounded-2xl mt-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating...</>
                    : 'Create Account →'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-sky-50 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}