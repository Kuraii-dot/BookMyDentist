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
  { to: '/clinic/profile', label: 'Clinic Profile', icon: '🏥' },
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
      .then(({ data }) => {
        setClinic(data)
        setClinicLoading(false)
      })
  }, [user])

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  if (clinicLoading) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // No clinic yet — allow /clinic/profile through, block everything else
  if (clinic === null) {
    if (location.pathname === '/clinic/profile') {
      // Let them through to fill in the profile form
      return (
        <div className="min-h-screen bg-amber-50 flex flex-col">
          <header className="bg-white border-b border-amber-100 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🦷</span>
                </div>
                <span className="font-black text-stone-800">DentBook</span>
                <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">Clinic Setup</span>
              </div>
              <button onClick={handleSignOut} className="text-xs text-stone-400 hover:text-rose-500 transition-colors">Sign out</button>
            </div>
          </header>
          <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
            <Outlet context={{ onClinicCreated: () => {
              supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
                .then(({ data }) => setClinic(data))
            }}} />
          </div>
        </div>
      )
    }

    // Any other clinic route — show setup prompt
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">🦷</span>
          </div>
          <h1 className="text-2xl font-black text-stone-800 mb-2">Set Up Your Clinic</h1>
          <p className="text-stone-500 mb-6 leading-relaxed">
            Before you can access your dashboard, you need to complete your clinic profile and submit it for admin approval.
          </p>
          <button
            onClick={() => navigate('/clinic/profile')}
            className="bg-amber-400 hover:bg-amber-500 text-white font-bold px-8 py-3 rounded-full transition-colors shadow-md"
          >
            Complete Clinic Profile →
          </button>
          <div className="mt-6">
            <button onClick={handleSignOut} className="text-sm text-stone-400 hover:text-rose-500 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Clinic exists but not approved
  if (clinic.verification_status !== 'approved') {
    return <PendingApproval status={clinic.verification_status} reason={clinic.rejection_reason} />
  }

  // Fully approved — show full dashboard
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-sm">🦷</span>
            </div>
            <span className="font-black text-stone-800">DentBook</span>
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">Clinic</span>
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
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

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