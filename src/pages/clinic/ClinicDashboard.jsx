import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns'

const STATUS_CONFIG = {
  pending:             { label: 'Pending',    class: 'badge-warning' },
  accepted:            { label: 'Confirmed',  class: 'badge-success' },
  rejected:            { label: 'Declined',   class: 'badge-danger'  },
  completed:           { label: 'Completed',  class: 'badge-purple'  },
  cancelled:           { label: 'Cancelled',  class: 'badge-gray'    },
  rescheduled:         { label: 'Rescheduled',class: 'badge-info'    },
  reschedule_accepted: { label: 'Confirmed',  class: 'badge-success' },
  reschedule_declined: { label: 'Declined',   class: 'badge-danger'  },
}

export default function ClinicDashboard() {
  const { user, profile } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [stats, setStats] = useState({ pending: 0, today: 0, thisMonth: 0, completed: 0 })
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
      .select('*, profiles!appointments_customer_id_fkey(full_name, avatar_url), services(name, price)')
      .eq('clinic_id', c.id)
      .order('appointment_date', { ascending: false })
      .limit(50)

    const appts = all || []
    const todayList = appts.filter(a => a.appointment_date === todayStr)

    setStats({
      pending:    appts.filter(a => a.status === 'pending').length,
      today:      todayList.length,
      thisMonth:  appts.filter(a => a.appointment_date >= monthStart && a.appointment_date <= monthEnd).length,
      completed:  appts.filter(a => a.status === 'completed').length,
    })
    setTodayAppts(todayList)
    setRecentAppts(appts.slice(0, 6))
    setLoading(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'20px 20px'}} />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-teal-200 text-sm">{greeting} 👋</p>
            <h1 className="font-display font-bold text-2xl mt-0.5">{clinic?.name || profile?.full_name}</h1>
            <p className="text-teal-100 text-sm mt-1">
              {stats.pending > 0
                ? `${stats.pending} request${stats.pending > 1 ? 's' : ''} awaiting your response`
                : 'No pending requests — all caught up!'}
            </p>
          </div>
          {stats.pending > 0 && (
            <Link to="/clinic/appointments" className="btn bg-white text-teal-700 hover:bg-teal-50 btn-md rounded-xl shadow-sm shrink-0 font-bold">
              Review Requests →
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger">
        {[
          { label: 'Pending',       value: stats.pending,    icon: '⏳', color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100' },
          { label: "Today's Appts", value: stats.today,      icon: '📅', color: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-100' },
          { label: 'This Month',    value: stats.thisMonth,  icon: '📊', color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'Completed',     value: stats.completed,  icon: '✅', color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-100' },
        ].map(s => (
          <div key={s.label} className={`card p-4 border ${s.border} animate-fade-in`}>
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedule */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="font-display font-semibold text-slate-800">Today's Schedule</h2>
              <p className="text-slate-400 text-xs">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <span className="badge badge-teal">{todayAppts.length} appt{todayAppts.length !== 1 ? 's' : ''}</span>
          </div>
          {todayAppts.length === 0 ? (
            <div className="py-10 text-center">
              <span className="text-3xl">☀️</span>
              <p className="text-slate-400 text-sm mt-2">No appointments today</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {todayAppts.map(a => {
                const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center font-bold text-teal-600 text-sm shrink-0 overflow-hidden">
                      {a.profiles?.avatar_url
                        ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        : a.profiles?.full_name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{a.profiles?.full_name}</p>
                      <p className="text-teal-600 text-xs">{a.services?.name}</p>
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

        {/* Recent appointments */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-display font-semibold text-slate-800">Recent Activity</h2>
            <Link to="/clinic/appointments" className="text-xs text-teal-600 hover:text-teal-700 font-medium">View all →</Link>
          </div>
          {recentAppts.length === 0 ? (
            <div className="py-10 text-center">
              <span className="text-3xl">📭</span>
              <p className="text-slate-400 text-sm mt-2">No appointments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentAppts.map(a => {
                const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center font-bold text-teal-600 text-sm shrink-0 overflow-hidden">
                      {a.profiles?.avatar_url
                        ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { to: '/clinic/appointments', icon: '📅', label: 'Manage Appointments' },
          { to: '/clinic/services', icon: '🔧', label: 'Edit Services' },
          { to: '/clinic/availability', icon: '🕐', label: 'Set Schedule' },
          { to: '/clinic/profile', icon: '🏥', label: 'Clinic Profile' },
        ].map(l => (
          <Link key={l.to} to={l.to}
            className="card p-4 flex flex-col items-center text-center hover:shadow-md hover:border-teal-200 transition-all group cursor-pointer">
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{l.icon}</span>
            <span className="text-xs font-semibold text-slate-600 group-hover:text-teal-600 transition-colors">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}