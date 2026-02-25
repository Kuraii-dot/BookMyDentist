import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
  { to: '/dashboard/profile', label: 'Profile', icon: '👤' },
]

export default function CustomerLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">🦷</span>
            </div>
            <span className="font-display font-bold text-slate-900">DentBook</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-teal-700 font-bold text-sm">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile?.full_name}</span>
              <button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-red-500 transition-colors ml-1">Sign out</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden md:block">
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 sticky top-24">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'} mb-0.5`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            <hr className="my-2 border-slate-100" />
            <NavLink to="/" className="nav-item nav-item-inactive text-teal-600">
              <span>🔍</span>
              <span>Browse Clinics</span>
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex z-40 pb-safe">
        {[...navItems, { to: '/', label: 'Browse', icon: '🔍', end: true }].map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
            <span className="text-xl mb-0.5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}