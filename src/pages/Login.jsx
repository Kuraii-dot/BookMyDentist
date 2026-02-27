import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      const map = { super_admin: '/admin', clinic_owner: '/clinic', customer: '/dashboard' }
      navigate(map[profile.role] || '/')
    }
  }, [profile])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn({ email: form.email, password: form.password })
    if (error) { toast.error('Invalid email or password'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{backgroundColor:'#f0f9ff'}}>
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30"
        style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 70%)'}} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20"
        style={{background:'radial-gradient(circle, #fde68a 0%, transparent 70%)'}} />

      <div className="relative w-full flex flex-col">
        {/* Nav */}
        <nav className="px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm shadow-sky-200">
              <span className="text-white text-sm">🦷</span>
            </div>
            <span className="font-display font-bold text-slate-900">DentBook</span>
          </Link>
        </nav>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-3xl mx-auto mb-5 shadow-lg shadow-sky-200">
                🦷
              </div>
              <h1 className="font-display font-bold text-slate-900 text-3xl">Welcome back</h1>
              <p className="text-slate-400 mt-1.5 text-sm">Sign in to your DentBook account</p>
            </div>

            <div className="bg-white rounded-3xl border border-sky-100 shadow-sm shadow-sky-100 p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Your password" className="input" />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full rounded-2xl mt-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in...</>
                    : 'Sign In →'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-sky-50 text-center">
                <p className="text-slate-400 text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                    Sign up free
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}