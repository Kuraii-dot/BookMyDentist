import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import PendingApproval from './PendingApproval'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/clinic',               label: 'Dashboard',     icon: '📊', end: true },
  { to: '/clinic/appointments',  label: 'Appointments',  icon: '📅' },
  { to: '/clinic/services',      label: 'Services',      icon: '🔧' },
  { to: '/clinic/availability',  label: 'Availability',  icon: '🕐' },
  { to: '/clinic/profile',       label: 'Clinic Profile',icon: '🏥' },
  { to: '/clinic/account',       label: 'Account',       icon: '👤' },
]

function Header({ profile, clinicName, badge, onSignOut }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60"
      style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-[0_4px_12px_rgba(14,165,233,0.35)]">
            <span className="text-white text-base">🦷</span>
          </div>
          <span className="font-bold text-slate-900 tracking-tight">
            BookMyDentist<span className="text-sky-500">PH</span>
          </span>
          {badge && (
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200 hidden sm:inline-flex">
              {badge}
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="flex items-center gap-2.5 pl-3 border-l border-sky-100">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-sky-200 to-cyan-200 flex items-center justify-center ring-2 ring-white shadow-sm">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                : <span className="text-sky-700 font-bold text-sm">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
              }
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 leading-none">{profile?.full_name}</p>
              {clinicName && <p className="text-xs text-sky-500 font-medium mt-0.5">{clinicName}</p>}
            </div>
            <button onClick={onSignOut}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-1 hidden sm:block">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function ClinicLayout() {
  const { user, profile, signOut } = useAuth()
  const navigate        = useNavigate()
  const location        = useLocation()
  const [clinic, setClinic]               = useState(undefined)
  const [clinicLoading, setClinicLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => { setClinic(data); setClinicLoading(false) })
  }, [user])

  async function handleSignOut() { await signOut(); toast.success('Signed out'); navigate('/') }

  if (clinicLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#eef7ff' }}>
      <div className="w-10 h-10 rounded-full border-4 border-sky-100 border-t-sky-400 animate-spin" />
    </div>
  )

  // ── No clinic yet: setup flow ──
  if (clinic === null) {
    const isSetupRoute = ['/clinic/profile', '/clinic/account'].includes(location.pathname)

    if (isSetupRoute) return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#eef7ff' }}>
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#eef7ff' }}>
        {/* Ambient glows */}
        <div className="pointer-events-none fixed top-0 right-0 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)' }} />
        <div className="pointer-events-none fixed bottom-0 left-0 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fde68a 0%, transparent 70%)' }} />

        <div className="relative w-full max-w-sm text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-[0_12px_32px_rgba(14,165,233,0.35)]">
            <span className="text-4xl">🦷</span>
          </div>
          <h1 className="font-bold text-slate-900 text-2xl mb-2">Set Up Your Clinic</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Complete your clinic profile to submit for admin review. Usually approved within 1–2 business days.
          </p>
          <button onClick={() => navigate('/clinic/profile')}
            className="w-full py-3 rounded-2xl font-bold text-white text-sm bg-gradient-to-r from-sky-400 to-cyan-400 shadow-[0_4px_16px_rgba(14,165,233,0.4)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 transition-all duration-200">
            Complete Profile →
          </button>
          <button onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-red-400 transition-colors mt-4 block mx-auto">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  if (clinic && clinic.verification_status !== 'approved') {
    return <PendingApproval status={clinic.verification_status} reason={clinic.rejection_reason} />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#eef7ff' }}>

      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 -z-10"
        style={{ background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)' }} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 -z-10"
        style={{ background: 'radial-gradient(circle, #a5f3fc 0%, transparent 70%)' }} />

      <Header profile={profile} clinicName={clinic?.name} badge="Clinic" onSignOut={handleSignOut} />

      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="p-2 sticky top-24 rounded-2xl border border-white/80 shadow-[0_4px_24px_rgba(14,165,233,0.08)]"
            style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

            {/* Clinic mini card */}
            <div className="px-3 py-3 mb-2 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-100/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-sm">🏥</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{clinic?.name}</p>
                  <p className="text-[0.65rem] text-sky-500 font-medium">Clinic Owner</p>
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

        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-white/60"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        {navItems.slice(0, 5).map(item => (
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

      {/* ── Mascot placeholder ── */}
      <div className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-40 pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-xl border-2 border-sky-200/60 shadow-[0_8px_24px_rgba(14,165,233,0.2)] flex items-center justify-center">
          {/* TODO: replace with 3D mascot image */}
          <span className="text-2xl">🦷</span>
        </div>
      </div>
    </div>
  )
}