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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-100 px-4">
        <div className="max-w-md mx-auto h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center"><span className="text-white text-xs">🦷</span></div>
            <span className="font-display font-bold text-slate-900">BookMyDentist</span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-slate-900 text-2xl">Create your account</h1>
            <p className="text-slate-400 mt-1 text-sm">Join BookMyDentist for free</p>
          </div>

          <div className="card p-6">
            {/* Role selector */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
              <button type="button" onClick={() => setRole('customer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === 'customer' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                🙋 I'm a Patient
              </button>
              <button type="button" onClick={() => setRole('clinic_owner')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === 'clinic_owner' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                🦷 I Own a Clinic
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input type="text" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Juan dela Cruz" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@email.com" className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters" className="input" />
              </div>

              {role === 'clinic_owner' && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                  <p className="text-teal-700 text-xs font-medium">
                    🔍 Clinic accounts require admin verification before going live. Usually takes 1-2 business days.
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full mt-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Creating account...</> : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-slate-400 text-sm mt-5">
              Already have an account? <Link to="/login" className="text-sky-600 hover:text-sky-700 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}