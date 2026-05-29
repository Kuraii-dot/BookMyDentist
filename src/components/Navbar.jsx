import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { LayoutDashboard, Search, Home, User, LogIn, Calculator } from 'lucide-react'

export default function Navbar({ showNotifications = false }) {
  const { user, profile, loading, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  async function handleSignOut() { await signOut(); navigate('/') }

  const dashboardLink = {
    super_admin:  '/admin',
    clinic_owner: '/clinic',
    customer:     '/dashboard',
  }[profile?.role] || '/dashboard'

  const desktopNavLinks = [
    { to: '/browse', label: 'Browse' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/tools', label: 'Tools' },
  ]

  // Mobile bottom tab items
  const mobileTabs = user
    ? [
        { to: '/',           Icon: Home,          label: 'Home'      },
        { to: '/browse',     Icon: Search,        label: 'Browse'    },
        { to: '/tools',      Icon: Calculator,    label: 'Tools'     },
        { to: dashboardLink, Icon: LayoutDashboard,label: 'Dashboard' },
        { to: '/dashboard/profile', Icon: User,   label: 'Account'   },
      ]
    : [
        { to: '/',          Icon: Home,   label: 'Home'   },
        { to: '/browse',    Icon: Search, label: 'Browse' },
        { to: '/tools',     Icon: Calculator, label: 'Tools' },
        { to: '/login',     Icon: LogIn,  label: 'Sign In'},
      ]

  if (loading) return (
    <>
      {/* Desktop nav skeleton */}
      <nav className="glass-header sticky top-0 z-40 hidden sm:block">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sky-400 text-3xl">Book
            <span className="font-display font-bold text-slate-900 text-3xl">MyDentist</span></span>
          </div>
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
      </nav>
      {/* Mobile bottom bar skeleton */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-slate-200 z-50" />
    </>
  )

  return (
    <>
      {/* ── Desktop navbar (hidden on mobile) ── */}
      <nav className="glass-header sticky top-0 z-40 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center shrink-0">
              <span className="font-display font-bold text-sky-400 text-3xl">Book</span>
              <span className="font-display font-bold text-slate-900 text-3xl">MyDentist</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {desktopNavLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors px-3 py-2 whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                {showNotifications && <NotificationBell />}
                <Link to={dashboardLink}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 text-sky-600">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center ring-1 ring-sky-200 overflow-hidden">
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sky-700 font-bold text-xs">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
                    }
                  </div>
                  <button onClick={handleSignOut}
                    className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors">
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

      {/* ── Mobile bottom tab bar (hidden on sm+) ── */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {mobileTabs.map(({ to, Icon, label }) => {
            const isActive = location.pathname === to ||
              (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link key={to} to={to}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors
                  ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all
                  ${isActive ? 'bg-sky-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                  {/* Notification dot for dashboard when user has unread — placeholder */}
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
          {/* Notification bell as last tab when logged in */}
          {user && showNotifications && (
            <div className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5">
              <NotificationBell />
              <span className="text-[10px] font-semibold text-slate-400">Alerts</span>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer so content doesn't hide behind mobile bottom bar */}
      <div className="sm:hidden h-16" style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }} />
    </>
  )
}
