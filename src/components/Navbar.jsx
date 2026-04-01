import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { LayoutDashboard } from 'lucide-react'

export default function Navbar({ showNotifications = false }) {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() { await signOut(); navigate('/') }

  const dashboardLink = {
    super_admin:   '/admin',
    clinic_owner:  '/clinic',
    customer:      '/dashboard',
  }[profile?.role] || '/dashboard'

  if (loading) return (
    <nav className="glass-header sticky top-0 z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
        <span className="font-display font-bold text-sky-400 text-3xl">
      Book
    </span>
    <span className="font-display font-bold text-slate-900 text-3xl">
      MyDentist
    </span>
        </div>
        <div className="skeleton h-8 w-24 rounded-lg"/>
      </div>
    </nav>
  )

  return (
    <nav className="glass-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
<div className="flex items-center">
    <div className="w-20 h-20 flex items-center justify-center">
    </div>
        <span className="font-display font-bold text-sky-400 text-3xl">
      Book
    </span>
    <span className="font-display font-bold text-slate-900 text-3xl">
      MyDentist
    </span>
  </div>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {showNotifications && <NotificationBell/>}
              <Link to={dashboardLink}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 text-sky-600">
                <LayoutDashboard className="w-3.5 h-3.5"/> Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center ring-1 ring-sky-200 overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                    : <span className="text-sky-700 font-bold text-xs">{profile?.full_name?.[0]?.toUpperCase()||'?'}</span>
                  }
                </div>
                <button onClick={handleSignOut}
                  className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors hidden sm:block">
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"
                className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}