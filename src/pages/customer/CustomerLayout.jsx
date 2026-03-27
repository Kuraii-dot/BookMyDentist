import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../../components/NotificationBell'
import toast from 'react-hot-toast'
import { LayoutDashboard, Calendar, Search, User, LogOut } from 'lucide-react'

const navItems = [
  { to:'/dashboard',              label:'Dashboard',    Icon:LayoutDashboard, end:true },
  { to:'/dashboard/appointments', label:'Appointments', Icon:Calendar },
  { to:'/dashboard/browse',       label:'Browse',       Icon:Search },
  { to:'/dashboard/profile',      label:'Profile',      Icon:User },
]

export default function CustomerLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() { await signOut(); toast.success('Signed out'); navigate('/') }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
          <div className="w-20 h-20 rounded-lg flex items-center justify-center">
          <img src="/Logo.png" alt="BookMyDentistPH" className="w-20 h-20 rounded-lg object-contain"/>
            </div>
            <span className="font-display font-bold text-slate-900 text-sm">BookMyDentistPH</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell/>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center ring-1 ring-sky-200 overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
                  : <span className="text-sky-700 font-bold text-xs">{profile?.full_name?.[0]?.toUpperCase()||'?'}</span>
                }
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile?.full_name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex gap-6 flex-1">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden md:block">
          <nav className="glass-sidebar p-2 sticky top-20 space-y-0.5">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({isActive}) => `nav-item ${isActive?'nav-item-active':'nav-item-inactive'}`}>
                <item.Icon className="w-4 h-4 shrink-0"/>
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button onClick={handleSignOut} className="nav-item nav-item-inactive w-full text-red-400 hover:bg-red-50 hover:text-red-500">
                <LogOut className="w-4 h-4 shrink-0"/>
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 pb-20 md:pb-0"><Outlet/></main>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex z-40">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({isActive}) => `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-semibold transition-colors ${isActive?'text-sky-600':'text-slate-400'}`}>
            <item.Icon className="w-5 h-5"/>
            <span>{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}