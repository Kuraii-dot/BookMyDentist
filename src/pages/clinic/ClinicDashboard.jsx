import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const STATUS_CONFIG = {
  pending:   { label:'Pending',   class:'badge-warning' },
  accepted:  { label:'Confirmed', class:'badge-success' },
  rejected:  { label:'Declined',  class:'badge-danger'  },
  completed: { label:'Completed', class:'badge-purple'  },
  cancelled: { label:'Cancelled', class:'badge-gray'    },
  rescheduled:{ label:'Rescheduled',class:'badge-info'  },
}

export default function ClinicDashboard() {
  const { user, profile } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [stats, setStats] = useState({ pending:0, today:0, thisMonth:0, completed:0 })
  const [todayAppts, setTodayAppts] = useState([])
  const [recentAppts, setRecentAppts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    const { data: c } = await supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
    setClinic(c)
    if (!c) { setLoading(false); return }

    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    const { data: all } = await supabase.from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(full_name,avatar_url), services(name,price)')
      .eq('clinic_id', c.id)
      .order('appointment_date', { ascending: false })
      .limit(50)

    const appts = all || []
    setStats({
      pending:   appts.filter(a => a.status === 'pending').length,
      today:     appts.filter(a => a.appointment_date === todayStr).length,
      thisMonth: appts.filter(a => a.appointment_date >= monthStart && a.appointment_date <= monthEnd).length,
      completed: appts.filter(a => a.status === 'completed').length,
    })
    setTodayAppts(appts.filter(a => a.appointment_date === todayStr))
    setRecentAppts(appts.slice(0, 6))
    setLoading(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}} />
    </div>
  )

  return (
    <div className="animate-fade-in space-y-6">

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-banner p-6 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'24px 24px'}} />
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
          style={{background:'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)'}} />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-200 text-sm">{greeting} 👋</p>
            <h1 className="font-display font-bold text-2xl mt-0.5">{clinic?.name || profile?.full_name}</h1>
            <p className="text-sky-100 text-sm mt-1">
              {stats.pending > 0
                ? `${stats.pending} request${stats.pending > 1 ? 's' : ''} awaiting your response`
                : 'All caught up — no pending requests!'}
            </p>
          </div>
          {stats.pending > 0 && (
            <Link to="/clinic/appointments"
              className="btn btn-secondary btn-md shrink-0"
              style={{color:'var(--color-brand)'}}>
              Review Requests →
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { label:'Pending',      value: stats.pending,   icon:'⏳', color:'text-amber-600',  bg:'bg-amber-50',  border:'border-amber-100' },
          { label:"Today's",      value: stats.today,     icon:'📅', color:'text-sky-600',    bg:'bg-sky-50',    border:'border-sky-100' },
          { label:'This Month',   value: stats.thisMonth, icon:'📊', color:'text-violet-600', bg:'bg-violet-50', border:'border-violet-100' },
          { label:'Completed',    value: stats.completed, icon:'✅', color:'text-emerald-600',bg:'bg-emerald-50',border:'border-emerald-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-4 animate-fade-in shadow-sm`}>
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's schedule */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/60" style={{background:"rgba(224,242,254,0.4)"}}>
            <div>
              <h2 className="font-display font-semibold text-slate-800">Today's Schedule</h2>
              <p className="text-slate-400 text-xs">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <span className="badge badge-teal">{todayAppts.length} appt{todayAppts.length !== 1 ? 's' : ''}</span>
          </div>
          {todayAppts.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">☀️</div>
              <p className="text-slate-400 text-sm">No appointments today</p>
            </div>
          ) : (
            <div className="divide-y divide-white/60">
              {todayAppts.map(a => {
                const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition-colors">
                    <div className="w-9 h-9 bg-sky-50 rounded-full flex items-center justify-center font-bold text-sky-600 text-sm shrink-0 overflow-hidden border border-sky-100">
                      {a.profiles?.avatar_url
                        ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover"/>
                        : a.profiles?.full_name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{a.profiles?.full_name}</p>
                      <p className="text-sky-600 text-xs">{a.services?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {a.appointment_time && <p className="text-slate-600 text-xs font-semibold">{a.appointment_time}</p>}
                      <span className={`badge ${st.class} mt-0.5`}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/60" style={{background:"rgba(224,242,254,0.4)"}}>
            <h2 className="font-display font-semibold text-slate-800">Recent Activity</h2>
            <Link to="/clinic/appointments" className="text-xs font-semibold text-sky-600 hover:text-sky-700">View all →</Link>
          </div>
          {recentAppts.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">📭</div>
              <p className="text-slate-400 text-sm">No appointments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/60">
              {recentAppts.map(a => {
                const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/40 transition-colors">
                    <div className="w-9 h-9 bg-sky-50 rounded-full flex items-center justify-center font-bold text-sky-600 text-sm shrink-0 overflow-hidden border border-sky-100">
                      {a.profiles?.avatar_url
                        ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover"/>
                        : a.profiles?.full_name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{a.profiles?.full_name}</p>
                      <p className="text-slate-400 text-xs">{a.services?.name} · {format(new Date(a.appointment_date), 'MMM d')}</p>
                    </div>
                    <span className={`badge ${st.class} shrink-0`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to:'/clinic/appointments', icon:'📅', label:'Appointments' },
          { to:'/clinic/services',     icon:'🔧', label:'Services' },
          { to:'/clinic/availability', icon:'🕐', label:'Schedule' },
          { to:'/clinic/profile',      icon:'🏥', label:'Profile' },
        ].map(l => (
          <Link key={l.to} to={l.to}
            className="card p-4 flex flex-col items-center text-center hover:shadow-md hover:border-sky-300 hover:-translate-y-0.5 transition-all group shadow-sm">
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{l.icon}</span>
            <span className="text-xs font-semibold text-slate-600 group-hover:text-sky-600 transition-colors">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}