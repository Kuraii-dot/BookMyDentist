import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-amber-700 font-medium">Loading...</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  // ── Account banned ────────────────────────────────────────────────────────
  if (profile?.banned_at) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5 border border-red-200">
          <span className="text-3xl">🚫</span>
        </div>
        <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Account Banned</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Your account has been permanently banned from BookMyDentistPH.
          If you believe this is a mistake, please contact our support team.
        </p>
        <a href="mailto:hello@bookmydentistph.com"
          className="btn btn-secondary btn-md inline-flex">
          Contact Support
        </a>
      </div>
    </div>
  )

  // ── Account suspended ─────────────────────────────────────────────────────
  if (profile?.is_suspended) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-5 border border-amber-200">
          <span className="text-3xl">⏸️</span>
        </div>
        <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Account Suspended</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Your account has been temporarily suspended.
          Please contact our support team for more information.
        </p>
        <a href="mailto:hello@bookmydentistph.com"
          className="btn btn-secondary btn-md inline-flex">
          Contact Support
        </a>
      </div>
    </div>
  )

  // ── Role mismatch ─────────────────────────────────────────────────────────
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    const redirectMap = {
      super_admin:   '/admin',
      clinic_owner:  '/clinic',
      customer:      '/dashboard',
    }
    return <Navigate to={redirectMap[profile.role] || '/'} replace />
  }

  return children
}