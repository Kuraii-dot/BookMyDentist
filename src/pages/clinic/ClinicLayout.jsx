import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import PendingApproval from './PendingApproval'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { LayoutDashboard, Calendar, Wrench, Clock, Building2, User, LogOut, FileBarChart2 } from 'lucide-react'
import ToothIcon from '../../components/ToothIcon'

const navItems = [
  { to: '/clinic',              label: 'Dashboard',     Icon: LayoutDashboard, end: true },
  { to: '/clinic/appointments', label: 'Appointments',  Icon: Calendar },
  { to: '/clinic/services',     label: 'Services',      Icon: Wrench },
  { to: '/clinic/availability', label: 'Availability',  Icon: Clock },
  { to: '/clinic/reports',      label: 'Reports',       Icon: FileBarChart2 },
  { to: '/clinic/profile',      label: 'Clinic Profile',Icon: Building2 },
  { to: '/clinic/account',      label: 'Account',       Icon: User },
]

// Mobile nav items — 4 main tabs + sign out
const mobileNavItems = [
  { to: '/clinic',              label: 'Home',      Icon: LayoutDashboard, end: true },
  { to: '/clinic/appointments', label: 'Appts',     Icon: Calendar },
  { to: '/clinic/services',     label: 'Services',  Icon: Wrench },
  { to: '/clinic/reports',      label: 'Reports',   Icon: FileBarChart2 },
]

function Header({ profile, badge, onSignOut }) {
  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-display font-bold text-sky-400 text-3xl">Book</span>
          <span className="font-display font-bold text-slate-900 text-3xl">MyDentist</span>
          {badge && <span className="badge badge-teal hidden sm:inline-flex">{badge}</span>}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center ring-1 ring-sky-200 overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-sky-700 font-bold text-xs">{profile?.full_name?.[0]?.toUpperCase() || '?'}</span>
              }
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile?.full_name}</span>
            <button onClick={onSignOut} className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-1 hidden sm:block">Sign out</button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function ClinicLayout() {
  const { user, profile, signOut } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [clinic, setClinic]               = useState(undefined)
  const [clinicLoading, setClinicLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => { setClinic(data); setClinicLoading(false) })
  }, [user])

  async function handleSignOut() { await signOut(); toast.success('Signed out'); navigate('/') }

  if (clinicLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (clinic === null) {
    const isSetupRoute = ['/clinic/profile', '/clinic/account'].includes(location.pathname)
    if (isSetupRoute) return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header profile={profile} badge="Setup" onSignOut={handleSignOut} />
        <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
          <Outlet context={{ onClinicCreated: () => supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => setClinic(data)) }} />
        </div>
      </div>
    )
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <ToothIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-bold text-slate-900 text-2xl mb-2">Set Up Your Clinic</h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Complete your clinic profile to submit for admin review. Usually approved within 1–2 business days.
          </p>
          <button onClick={() => navigate('/clinic/profile')} className="btn btn-primary btn-lg w-full">Complete Profile →</button>
          <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-red-400 mt-4 block mx-auto transition-colors">Sign out</button>
        </div>
      </div>
    )
  }

  if (clinic && clinic.verification_status !== 'approved') {
    return <PendingApproval status={clinic.verification_status} reason={clinic.rejection_reason} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header profile={profile} badge="Clinic" onSignOut={handleSignOut} />
      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Desktop sidebar */}
        <aside className="w-52 shrink-0 hidden md:block">
          <nav className="glass-sidebar p-2 sticky top-20 space-y-0.5">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
                <item.Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button onClick={handleSignOut} className="nav-item nav-item-inactive w-full text-red-400 hover:bg-red-50 hover:text-red-500">
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main content — extra bottom padding for mobile tab bar */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0"><Outlet /></main>
      </div>

      {/* Mobile bottom nav — 4 tabs + Sign Out */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center">
          {mobileNavItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-semibold transition-colors ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
              <item.Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {/* Sign Out tab */}
          <button
            onClick={handleSignOut}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </div>
  )
}