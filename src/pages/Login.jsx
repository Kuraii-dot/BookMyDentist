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
            <h1 className="font-display font-bold text-slate-900 text-2xl">Welcome back</h1>
            <p className="text-slate-400 mt-1 text-sm">Sign in to your BookMyDentist account</p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@email.com" className="input" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                </div>
                <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password" className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full mt-2">
                {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in...</> : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-slate-400 text-sm mt-5">
              Don't have an account? <Link to="/register" className="text-sky-600 hover:text-sky-700 font-semibold">Sign up free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}