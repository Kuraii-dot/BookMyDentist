import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth } from 'date-fns'

// ─── Style tokens ─────────────────────────────────────────────────────────────
const glass      = 'bg-white/70 backdrop-blur-xl border border-white/90 rounded-2xl shadow-[0_4px_24px_rgba(14,165,233,0.08)]'
const glassHover = 'hover:shadow-[0_8px_32px_rgba(14,165,233,0.14)] hover:-translate-y-0.5 transition-all duration-200'
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 shadow-[0_4px_15px_rgba(14,165,233,0.35)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.45)] hover:-translate-y-0.5 transition-all duration-200'
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-sky-700 bg-white/80 border border-sky-200/80 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200'

const STATUS_CONFIG = {
  pending:    { label: 'Pending',     bg: 'bg-amber-100 text-amber-700 border-amber-200' },
  accepted:   { label: 'Confirmed',   bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected:   { label: 'Declined',    bg: 'bg-red-100 text-red-600 border-red-200' },
  completed:  { label: 'Completed',   bg: 'bg-violet-100 text-violet-700 border-violet-200' },
  cancelled:  { label: 'Cancelled',   bg: 'bg-slate-100 text-slate-500 border-slate-200' },
  rescheduled:{ label: 'Rescheduled', bg: 'bg-sky-100 text-sky-700 border-sky-200' },
}

// ─── Daily Peak Heatmap ───────────────────────────────────────────────────────
function DailyPeakHeatmap({ appointments }) {
  // Count appointments per hour slot
  const hourBuckets = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8 // 8 AM to 7 PM
    const count = appointments.filter(a => {
      if (!a.appointment_time) return false
      const h = parseInt(a.appointment_time.split(':')[0])
      return h === hour
    }).length
    return { hour, count, label: hour <= 12 ? `${hour}am` : `${hour - 12}pm` }
  })

  const maxCount = Math.max(...hourBuckets.map(b => b.count), 1)

  const getColor = (count) => {
    if (count === 0) return { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-200' }
    const pct = count / maxCount
    if (pct < 0.33) return { bg: 'bg-sky-100', border: 'border-sky-200', text: 'text-sky-500' }
    if (pct < 0.66) return { bg: 'bg-sky-300', border: 'border-sky-400', text: 'text-white' }
    return { bg: 'bg-sky-500', border: 'border-sky-600', text: 'text-white' }
  }

  return (
    <div className={`${glass} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-0.5">Appointment Density</p>
          <h3 className="font-bold text-slate-800 text-base">Daily Peak Hours</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[0.65rem] text-slate-400 font-medium">
          <div className="w-3 h-3 rounded bg-sky-50 border border-sky-100" /> Low
          <div className="w-3 h-3 rounded bg-sky-300 ml-1" /> Mid
          <div className="w-3 h-3 rounded bg-sky-500 ml-1" /> Peak
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {hourBuckets.map(b => {
          const c = getColor(b.count)
          return (
            <div key={b.hour}
              className={`${c.bg} border ${c.border} rounded-xl p-2 text-center transition-all hover:scale-105 cursor-default`}
              title={`${b.label}: ${b.count} appointment${b.count !== 1 ? 's' : ''}`}>
              <p className={`text-sm font-bold ${c.text}`}>{b.count > 0 ? b.count : '·'}</p>
              <p className={`text-[0.6rem] font-medium mt-0.5 ${c.text} opacity-80`}>{b.label}</p>
            </div>
          )
        })}
      </div>

      {maxCount === 1 && (
        <p className="text-xs text-slate-400 text-center mt-3">Heatmap fills in as appointments accumulate</p>
      )}
    </div>
  )
}

// ─── SMS Quick-Response Templates ────────────────────────────────────────────
const SMS_TEMPLATES = [
  { id: 'confirm',   label: 'Confirm Appt.',    icon: '✅', text: 'Hi {name}, your appointment at {clinic} on {date} at {time} is confirmed! See you soon.' },
  { id: 'remind',    label: 'Reminder',         icon: '🔔', text: 'Hi {name}, reminder: you have an appointment at {clinic} tomorrow at {time}. See you!' },
  { id: 'reschedule',label: 'Reschedule',       icon: '🔄', text: 'Hi {name}, we need to reschedule your appointment. Please contact us to pick a new time.' },
  { id: 'followup',  label: 'Follow-up',        icon: '💬', text: 'Hi {name}, hope you\'re feeling great after your visit! Don\'t forget your next check-up.' },
]

function SmsTemplates() {
  const [enabled, setEnabled]   = useState({})
  const [expanded, setExpanded] = useState(null)

  return (
    <div className={`${glass} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-0.5">Automation</p>
          <h3 className="font-bold text-slate-800 text-base">Quick-Response SMS</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {Object.values(enabled).filter(Boolean).length} active
        </span>
      </div>

      <div className="space-y-2">
        {SMS_TEMPLATES.map(t => (
          <div key={t.id} className="rounded-xl border border-sky-100/80 bg-white/60 overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{t.icon}</span>
                <span className="text-sm font-semibold text-slate-700">{t.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(prev => prev === t.id ? null : t.id)}
                  className="text-xs text-sky-400 hover:text-sky-600 font-medium transition-colors">
                  {expanded === t.id ? 'Hide' : 'Preview'}
                </button>
                {/* Toggle switch */}
                <button
                  onClick={() => setEnabled(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                  className={`relative w-9 h-5 rounded-full transition-all duration-300 ${
                    enabled[t.id]
                      ? 'bg-gradient-to-r from-sky-400 to-cyan-400 shadow-[0_2px_8px_rgba(14,165,233,0.4)]'
                      : 'bg-slate-200'
                  }`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                    enabled[t.id] ? 'left-[1.125rem]' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>
            {expanded === t.id && (
              <div className="px-3.5 pb-3 pt-0">
                <p className="text-xs text-slate-500 bg-sky-50/80 border border-sky-100 rounded-lg p-2.5 leading-relaxed font-mono">
                  {t.text}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main clinic dashboard ────────────────────────────────────────────────────
export default function ClinicDashboard() {
  const { user, profile } = useAuth()
  const [clinic, setClinic]         = useState(null)
  const [stats, setStats]           = useState({ pending: 0, today: 0, thisMonth: 0, completed: 0 })
  const [todayAppts, setTodayAppts] = useState([])
  const [recentAppts, setRecentAppts] = useState([])
  const [allAppts, setAllAppts]     = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    const { data: c } = await supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
    setClinic(c)
    if (!c) { setLoading(false); return }

    const now        = new Date()
    const todayStr   = format(now, 'yyyy-MM-dd')
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')

    const { data: all } = await supabase.from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(full_name,avatar_url), services(name,price)')
      .eq('clinic_id', c.id)
      .order('appointment_date', { ascending: false })
      .limit(50)

    const appts = all || []
    setAllAppts(appts)
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

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-sky-100 border-t-sky-400 animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #22d3ee 100%)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="pointer-events-none absolute -top-8 -right-8 w-44 h-44 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)' }} />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-100 text-sm font-medium">{greeting} 👋</p>
            <h1 className="font-bold text-2xl mt-0.5 tracking-tight">{clinic?.name || profile?.full_name}</h1>
            <p className="text-sky-100/90 text-sm mt-1">
              {stats.pending > 0
                ? `${stats.pending} request${stats.pending > 1 ? 's' : ''} awaiting your response`
                : 'All caught up — no pending requests!'}
            </p>
          </div>
          {stats.pending > 0 && (
            <Link to="/clinic/appointments" className={btnSecondary} style={{ color: '#0ea5e9' }}>
              Review Requests →
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending',     value: stats.pending,   icon: '⏳', from: '#fef3c7', to: '#fde68a', text: 'text-amber-600' },
          { label: "Today's",     value: stats.today,     icon: '📅', from: '#e0f2fe', to: '#bae6fd', text: 'text-sky-600' },
          { label: 'This Month',  value: stats.thisMonth, icon: '📊', from: '#ede9fe', to: '#ddd6fe', text: 'text-violet-600' },
          { label: 'Completed',   value: stats.completed, icon: '✅', from: '#d1fae5', to: '#a7f3d0', text: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label}
            className="rounded-2xl border border-white/80 p-4 shadow-[0_2px_12px_rgba(14,165,233,0.07)]"
            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>
            <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center text-xl mb-3 shadow-sm">{s.icon}</div>
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-slate-500 text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Today's schedule + Recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Today's schedule */}
        <div className={`${glass} overflow-hidden`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-sky-50/80"
            style={{ background: 'rgba(224,242,254,0.35)' }}>
            <div>
              <h2 className="font-bold text-slate-800">Today's Schedule</h2>
              <p className="text-slate-400 text-xs mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-600 border border-sky-200">
              {todayAppts.length} appt{todayAppts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {todayAppts.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-2xl mx-auto mb-2">☀️</div>
              <p className="text-slate-400 text-sm">No appointments today</p>
            </div>
          ) : (
            <div className="divide-y divide-sky-50/80">
              {todayAppts.map(a => {
                const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-sky-50/40 transition-colors">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center font-bold text-sky-600 text-sm shrink-0 border border-sky-200/60">
                      {a.profiles?.avatar_url
                        ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover"/>
                        : a.profiles?.full_name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{a.profiles?.full_name}</p>
                      <p className="text-sky-500 text-xs font-medium">{a.services?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {a.appointment_time && <p className="text-slate-600 text-xs font-bold">{a.appointment_time}</p>}
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mt-0.5 ${st.bg}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className={`${glass} overflow-hidden`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-sky-50/80"
            style={{ background: 'rgba(224,242,254,0.35)' }}>
            <h2 className="font-bold text-slate-800">Recent Activity</h2>
            <Link to="/clinic/appointments" className="text-xs font-bold text-sky-500 hover:text-sky-600 transition-colors">
              View all →
            </Link>
          </div>

          {recentAppts.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-2xl mx-auto mb-2">📭</div>
              <p className="text-slate-400 text-sm">No appointments yet</p>
            </div>
          ) : (
            <div className="divide-y divide-sky-50/80">
              {recentAppts.map(a => {
                const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-sky-50/40 transition-colors">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center font-bold text-sky-600 text-sm shrink-0 border border-sky-200/60">
                      {a.profiles?.avatar_url
                        ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover"/>
                        : a.profiles?.full_name?.[0]?.toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{a.profiles?.full_name}</p>
                      <p className="text-slate-400 text-xs">{a.services?.name} · {format(new Date(a.appointment_date), 'MMM d')}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${st.bg}`}>
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Daily Peak Heatmap ── */}
      <DailyPeakHeatmap appointments={allAppts} />

      {/* ── SMS Quick-Response templates ── */}
      <SmsTemplates />

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/clinic/appointments', icon: '📅', label: 'Appointments',  color: 'from-sky-50 to-cyan-50',     border: 'border-sky-100',  text: 'text-sky-600' },
          { to: '/clinic/services',     icon: '🔧', label: 'Services',      color: 'from-violet-50 to-purple-50', border: 'border-violet-100',text: 'text-violet-600' },
          { to: '/clinic/availability', icon: '🕐', label: 'Schedule',      color: 'from-emerald-50 to-teal-50', border: 'border-emerald-100',text: 'text-emerald-600' },
          { to: '/clinic/profile',      icon: '🏥', label: 'Profile',       color: 'from-amber-50 to-yellow-50', border: 'border-amber-100', text: 'text-amber-600' },
        ].map(l => (
          <Link key={l.to} to={l.to}
            className={`bg-gradient-to-br ${l.color} border ${l.border} rounded-2xl p-4 flex flex-col items-center text-center ${glassHover} shadow-sm group`}>
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">{l.icon}</span>
            <span className={`text-xs font-bold ${l.text}`}>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}