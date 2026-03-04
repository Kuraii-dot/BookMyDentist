import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [searchParams] = useSearchParams()
  // SECURITY FIX: whitelist allowed roles — 'super_admin' cannot be self-registered
  const rawRole = searchParams.get('role')
  const defaultRole = rawRole === 'clinic' || rawRole === 'clinic_owner' ? 'clinic_owner' : 'customer'

  const [role, setRole]     = useState(defaultRole)
  const [form, setForm]     = useState({ fullName: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { signUp }          = useAuth()
  const navigate            = useNavigate()

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('09') && digits.length === 11) return '+63' + digits.slice(1)
    if (digits.startsWith('639') && digits.length === 12) return '+' + digits
    return raw
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName.trim())    { toast.error('Please enter your full name'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.phone && !/^(\+63|09)\d{9,10}$/.test(form.phone.replace(/\s/g, ''))) {
      toast.error('Enter a valid PH mobile number (e.g. 09XX XXX XXXX)'); return
    }

    setLoading(true)
    const { error } = await signUp({
      email:    form.email,
      password: form.password,
      fullName: form.fullName,
      phone:    form.phone ? formatPhone(form.phone) : '',
      role,
    })
    setLoading(false)

    if (error) { toast.error(error.message); return }
    navigate('/verify-email', { state: { email: form.email } })
  }

  const strength = form.password.length === 0 ? 0
    : form.password.length < 8 ? 1
    : form.password.length < 12 ? 2
    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3

  const strengthLabel = ['', 'Too short', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-sky-400', 'bg-emerald-400']

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

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm animate-fade-in">
            <div className="text-center mb-7">
              <h1 className="font-display font-bold text-slate-900 text-3xl">Create account</h1>
              <p className="text-slate-400 mt-1.5 text-sm">Join BookMyDentist for free</p>
            </div>

            <div className="card p-7">
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
                    placeholder="juan@gmail.com" className="input" />
                  <p className="text-slate-400 text-xs mt-1">📧 A verification link will be sent to this email.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Mobile Number <span className="text-slate-400 font-normal">(optional — for SMS alerts)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">🇵🇭</span>
                    <input type="tel" value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="09XX XXX XXXX" className="input pl-9" />
                  </div>
                  <p className="text-slate-400 text-xs mt-1">Verify your number later in Profile settings.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <input type="password" required value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="At least 8 characters" className="input" />
                  {form.password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : 'bg-slate-100'}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-sky-500' : 'text-emerald-500'}`}>
                        {strengthLabel[strength]}
                      </p>
                    </div>
                  )}
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

const rawRole = searchParams.get('role') || 'customer'
const role = ['customer', 'clinic_owner'].includes(rawRole) ? rawRole : 'customer'
// 'super_admin' is now impossible to self-register