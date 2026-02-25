import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import PendingApproval from './PendingApproval'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/clinic', label: 'Dashboard', icon: '📊', end: true },
  { to: '/clinic/appointments', label: 'Appointments', icon: '📅' },
  { to: '/clinic/services', label: 'Services', icon: '🔧' },
  { to: '/clinic/availability', label: 'Availability', icon: '🕐' },
  { to: '/clinic/profile', label: 'Clinic Profile', icon: '🏥' },
  { to: '/clinic/account', label: 'Account', icon: '👤' },
]

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (clinic === null) {
    if (location.pathname === '/clinic/profile' || location.pathname === '/clinic/account') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><span className="text-white text-sm">🦷</span></div>
                <span className="font-display font-bold text-slate-900">DentBook</span>
                <span className="ml-2 badge badge-teal">Setup</span>
              </div>
              <button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Sign out</button>
            </div>
          </header>
          <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
            <Outlet context={{ onClinicCreated: () => supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => setClinic(data)) }} />
          </div>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><span className="text-3xl">🦷</span></div>
          <h1 className="font-display font-bold text-slate-900 text-2xl mb-2">Set Up Your Clinic</h1>
          <p className="text-slate-500 mb-6">Complete your clinic profile to submit for admin approval.</p>
          <button onClick={() => navigate('/clinic/profile')} className="btn btn-primary btn-lg rounded-2xl w-full">Complete Clinic Profile →</button>
          <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-red-500 transition-colors mt-4 block mx-auto">Sign out</button>
        </div>
      </div>
    )
  }

  if (clinic && clinic.verification_status !== 'approved') {
    return <PendingApproval status={clinic.verification_status} reason={clinic.rejection_reason} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm"><span className="text-white text-sm">🦷</span></div>
            <span className="font-display font-bold text-slate-900">DentBook</span>
            <span className="ml-2 badge badge-teal hidden sm:inline-flex">Clinic</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center">
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
        <aside className="w-52 shrink-0 hidden md:block">
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 sticky top-24">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'} mb-0.5`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0"><Outlet /></main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex z-40">
        {navItems.slice(0, 5).map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
            <span className="text-lg mb-0.5">{item.icon}</span>
            {item.label.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}