import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',              label: 'Dashboard',     icon: '🏠', end: true },
  { to: '/dashboard/appointments', label: 'Appointments',  icon: '📅' },
  { to: '/dashboard/browse',       label: 'Browse Clinics',icon: '🔍' },
  { to: '/dashboard/profile',      label: 'Profile',       icon: '👤' },
]

export default function CustomerLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut(); toast.success('Signed out'); navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:'#f0f9ff'}}>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-sky-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm shadow-sky-200">
              <span className="text-white text-sm">🦷</span>
            </div>
            <span className="font-display font-bold text-slate-900">DentBook</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center ring-2 ring-sky-200">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                  : <span className="text-sky-600 font-bold text-sm">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">{profile?.full_name}</span>
              <button onClick={handleSignOut}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-1 hidden sm:block">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="bg-white rounded-2xl border border-sky-100 shadow-sm shadow-sky-50 p-2 sticky top-24">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) =>
                  `nav-item mb-0.5 ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div className="mt-3 pt-3 border-t border-sky-50">
              <button onClick={handleSignOut}
                className="nav-item nav-item-inactive w-full text-red-400 hover:bg-red-50 hover:text-red-500">
                <span className="text-base">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-sky-100 flex z-40">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-semibold transition-colors ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
            <span className="text-xl">{item.icon}</span>
            <span>{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}