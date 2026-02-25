import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

export default function Navbar({ showNotifications = false }) {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const dashboardLink = {
    super_admin: '/admin',
    clinic_owner: '/clinic',
    customer: '/dashboard'
  }[profile?.role] || '/dashboard'

  // Don't render auth buttons until we know the auth state
  if (loading) return (
    <nav className="bg-white border-b border-amber-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🦷</span>
            </div>
            <span className="font-bold text-stone-800 text-lg tracking-tight">BookMyDentist</span>
          </Link>
          <div className="w-20 h-8 bg-amber-100 rounded-full animate-pulse" />
        </div>
      </div>
    </nav>
  )

  return (
    <nav className="bg-white border-b border-amber-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🦷</span>
            </div>
            <span className="font-bold text-stone-800 text-lg tracking-tight">BookMyDentist</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {showNotifications && <NotificationBell />}
                <Link to={dashboardLink} className="text-sm text-stone-600 hover:text-amber-700 font-medium transition-colors">
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-700 font-semibold text-sm">
                      {profile?.full_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-stone-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-stone-600 hover:text-amber-700 font-medium transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}