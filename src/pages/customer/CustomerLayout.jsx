import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', label: 'Find Clinics', icon: '🏥', end: true },
  { to: '/dashboard/appointments', label: 'My Appointments', icon: '📅' },
  { to: '/dashboard/profile', label: 'My Profile', icon: '👤' },
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
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-sm">🦷</span>
            </div>
            <span className="font-black text-stone-800">DentBook</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-bold text-sm">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <span className="text-sm font-medium text-stone-700 hidden sm:block">{profile?.full_name}</span>
              <button onClick={handleSignOut} className="text-xs text-stone-400 hover:text-rose-500 transition-colors ml-1">Sign out</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden md:block">
          <nav className="bg-white rounded-2xl border border-amber-100 shadow-sm p-2 sticky top-24">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${isActive ? 'bg-amber-100 text-amber-700' : 'text-stone-600 hover:bg-amber-50 hover:text-amber-600'}`
                }
              >
                <span>{item.icon}</span> {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 flex z-40">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${isActive ? 'text-amber-600' : 'text-stone-400'}`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}