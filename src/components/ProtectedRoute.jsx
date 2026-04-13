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
  if (profile?.banned_at) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm p-8">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Account Banned</h2>
        <p className="text-slate-500 text-sm">Your account has been permanently banned. Contact support if you believe this is a mistake.</p>
      </div>
    </div>
  )
}

if (profile?.is_suspended) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm p-8">
        <div className="text-4xl mb-4">⏸️</div>
        <h2 className="font-display font-bold text-slate-900 text-xl mb-2">Account Suspended</h2>
        <p className="text-slate-500 text-sm">Your account has been temporarily suspended. Contact support for more information.</p>
      </div>
    </div>
  )
}

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    const redirectMap = {
      super_admin: '/admin',
      clinic_owner: '/clinic',
      customer: '/dashboard'
    }
    return <Navigate to={redirectMap[profile.role] || '/'} replace />
  }

  return children
}