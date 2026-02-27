import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import PendingApproval from './PendingApproval'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/clinic',               label: 'Dashboard',    icon: '📊', end: true },
  { to: '/clinic/appointments',  label: 'Appointments', icon: '📅' },
  { to: '/clinic/services',      label: 'Services',     icon: '🔧' },
  { to: '/clinic/availability',  label: 'Availability', icon: '🕐' },
  { to: '/clinic/profile',       label: 'Clinic Profile',icon: '🏥' },
  { to: '/clinic/account',       label: 'Account',      icon: '👤' },
]

function Header({ profile, badge, onSignOut }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-sky-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm shadow-sky-200">
            <span className="text-white text-sm">🦷</span>
          </div>
          <span className="font-display font-bold text-slate-900">DentBook</span>
          {badge && <span className="ml-1 badge badge-teal hidden sm:inline-flex">{badge}</span>}
        </div>
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
            <button onClick={onSignOut} className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-1 hidden sm:block">Sign out</button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function ClinicLayout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [clinic, setClinic] = useState(undefined)
  const [clinicLoading, setClinicLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => { setClinic(data); setClinicLoading(false) })
  }, [user])

  async function handleSignOut() { await signOut(); toast.success('Signed out'); navigate('/') }

  if (clinicLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#f0f9ff'}}>
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}} />
    </div>
  )

  // No clinic yet — setup flow
  if (clinic === null) {
    const isSetupRoute = ['/clinic/profile', '/clinic/account'].includes(location.pathname)
    if (isSetupRoute) return (
      <div className="min-h-screen flex flex-col" style={{backgroundColor:'#f0f9ff'}}>
        <Header profile={profile} badge="Setup" onSignOut={handleSignOut} />
        <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
          <Outlet context={{ onClinicCreated: () =>
            supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
              .then(({ data }) => setClinic(data))
          }} />
        </div>
      </div>
    )

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{backgroundColor:'#f0f9ff'}}>
        {/* ambient glow */}
        <div className="pointer-events-none fixed top-0 right-0 w-96 h-96 rounded-full opacity-30"
          style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 70%)'}} />
        <div className="pointer-events-none fixed bottom-0 left-0 w-64 h-64 rounded-full opacity-20"
          style={{background:'radial-gradient(circle, #fde68a 0%, transparent 70%)'}} />

        <div className="relative w-full max-w-sm text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-sky-200">
            <span className="text-4xl">🦷</span>
          </div>
          <h1 className="font-display font-bold text-slate-900 text-2xl mb-2">Set Up Your Clinic</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">Complete your clinic profile to submit for admin review. Usually approved within 1–2 business days.</p>
          <button onClick={() => navigate('/clinic/profile')} className="btn btn-primary btn-lg rounded-2xl w-full">
            Complete Profile →
          </button>
          <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-red-400 transition-colors mt-4 block mx-auto">Sign out</button>
        </div>
      </div>
    )
  }

  if (clinic && clinic.verification_status !== 'approved') {
    return <PendingApproval status={clinic.verification_status} reason={clinic.rejection_reason} />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:'#f0f9ff'}}>
      <Header profile={profile} badge="Clinic" onSignOut={handleSignOut} />

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

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-sky-100 flex z-40">
        {navItems.slice(0, 5).map(item => (
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