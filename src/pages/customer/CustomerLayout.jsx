import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',              label: 'Dashboard',      icon: '🏠', end: true },
  { to: '/dashboard/appointments', label: 'Appointments',   icon: '📅' },
  { to: '/dashboard/browse',       label: 'Browse Clinics', icon: '🔍' },
  { to: '/dashboard/profile',      label: 'Profile',        icon: '👤' },
]

export default function CustomerLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut(); toast.success('Signed out'); navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#eef7ff' }}>

      {/* Ambient background glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-25 -z-10"
        style={{ background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 -z-10"
        style={{ background: 'radial-gradient(circle, #a5f3fc 0%, transparent 70%)' }} />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/60"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-[0_4px_12px_rgba(14,165,233,0.35)]">
              <span className="text-white text-base">🦷</span>
            </div>
            <span className="font-bold text-slate-900 tracking-tight">BookMyDentist<span className="text-sky-500">PH</span></span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* Avatar + name */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-sky-100">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-sky-200 to-cyan-200 flex items-center justify-center ring-2 ring-white shadow-sm">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                  : <span className="text-sky-700 font-bold text-sm">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
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

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="p-2 sticky top-24 rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(14,165,233,0.08)]"
            style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

            {/* Profile mini card */}
            <div className="px-3 py-3 mb-2 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-100/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-sky-200 to-cyan-200 flex items-center justify-center ring-2 ring-white shrink-0">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                    : <span className="text-sky-700 font-bold text-xs">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{profile?.full_name}</p>
                  <p className="text-[0.65rem] text-sky-500 font-medium">Patient</p>
                </div>
              </div>
            </div>

            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mb-0.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-400 to-cyan-400 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3)]'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                  }`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div className="mt-3 pt-3 border-t border-sky-100/60">
              <button onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200">
                <span className="text-base">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-white/60"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-semibold transition-colors ${
                isActive ? 'text-sky-500' : 'text-slate-400'
              }`}>
            <span className="text-xl">{item.icon}</span>
            <span>{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}