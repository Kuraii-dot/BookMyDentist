import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, Lock } from 'lucide-react'
import { useEffect } from 'react'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  // ── Check for suspension/ban and force logout ────────────────────────────
  useEffect(() => {
    if (!loading && profile) {
      if (profile.banned_at) {
        console.log('User is banned, showing ban screen')
        // Don't redirect, just show the ban screen below
      } else if (profile.is_suspended) {
        console.log('User is suspended, showing suspension screen')
        // Don't redirect, just show the suspension screen below
      }
    }
  }, [profile, loading])

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
          <AlertCircle className="w-8 h-8 text-red-600" />
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
          <Lock className="w-8 h-8 text-amber-600" />
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