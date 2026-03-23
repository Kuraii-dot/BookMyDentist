import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

// ─── Style tokens ────────────────────────────────────────────────────────────
const glass      = 'bg-white/70 backdrop-blur-xl border border-white/90 rounded-2xl shadow-[0_4px_24px_rgba(14,165,233,0.08)]'
const glassHover = 'hover:shadow-[0_8px_32px_rgba(14,165,233,0.14)] hover:-translate-y-0.5 transition-all duration-200'
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sky-400 to-cyan-400 shadow-[0_4px_15px_rgba(14,165,233,0.35)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.45)] hover:-translate-y-0.5 transition-all duration-200'
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-sky-700 bg-white/80 border border-sky-200/80 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200'
const btnDanger  = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-red-400 to-rose-400 shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_18px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all duration-200'

const STATUS_CONFIG = {
  pending:             { label: 'Pending',     bg: 'bg-amber-100 text-amber-700 border-amber-200',   icon: '⏳' },
  accepted:            { label: 'Confirmed',   bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
  rejected:            { label: 'Declined',    bg: 'bg-red-100 text-red-600 border-red-200',         icon: '❌' },
  rescheduled:         { label: 'Rescheduled', bg: 'bg-sky-100 text-sky-700 border-sky-200',         icon: '🔄' },
  reschedule_accepted: { label: 'Confirmed',   bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
  reschedule_declined: { label: 'Declined',    bg: 'bg-red-100 text-red-600 border-red-200',         icon: '❌' },
  completed:           { label: 'Completed',   bg: 'bg-violet-100 text-violet-700 border-violet-200',icon: '🏆' },
  cancelled:           { label: 'Cancelled',   bg: 'bg-slate-100 text-slate-500 border-slate-200',   icon: '🚫' },
}

// ─── Smile Journey component ─────────────────────────────────────────────────
function SmileJourney({ appointments }) {
  const completed = appointments.filter(a => a.status === 'completed').length
  const total     = Math.max(appointments.length, 1)
  const pct       = Math.min(Math.round((completed / Math.max(total, 3)) * 100), 100)

  const stages = [
    { label: 'First Check-up',    icon: '🦷', done: completed >= 1 },
    { label: 'Treatment Plan',    icon: '📋', done: completed >= 2 },
    { label: 'Final Whitening',   icon: '✨', done: completed >= 3 },
  ]

  return (
    <div className={`${glass} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-0.5">Your Progress</p>
          <h3 className="font-bold text-slate-800 text-base">Smile Journey</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-sky-500">{pct}%</p>
          <p className="text-xs text-slate-400">{completed} completed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-sky-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stages */}
      <div className="flex items-center justify-between gap-2">
        {stages.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 relative">
            {/* Connector line */}
            {i < stages.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${s.done ? 'bg-gradient-to-r from-sky-400 to-sky-200' : 'bg-sky-100'}`} />
            )}
            <div className={`relative z-[1] w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
              s.done
                ? 'bg-gradient-to-br from-sky-400 to-cyan-400 border-sky-300 shadow-[0_2px_8px_rgba(14,165,233,0.4)]'
                : 'bg-white border-sky-200'
            }`}>
              {s.done ? '✓' : s.icon}
            </div>
            <p className={`text-[0.6rem] font-semibold text-center leading-tight ${s.done ? 'text-sky-600' : 'text-slate-400'}`}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Appointment card ─────────────────────────────────────────────────────────
function AppointmentCard({ appt, onCancel }) {
  const status    = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending
  const date      = new Date(appt.appointment_date)
  const isUpcoming = !isPast(date) && !['cancelled', 'rejected'].includes(appt.status)
  const isCancelled = appt.status === 'cancelled'

  return (
    <div className={`${glass} ${glassHover} p-4 ${isCancelled ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Clinic logo */}
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-50 border border-sky-200/60 shadow-sm">
          {appt.clinics?.logo_url
            ? <img src={appt.clinics.logo_url} alt="" className="w-full h-full object-cover"/>
            : <span className="text-xl">🦷</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-slate-800 text-sm">{appt.clinics?.name}</p>
              <p className="text-xs font-semibold text-sky-500 mt-0.5">{appt.services?.name}</p>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${status.bg}`}>
              {status.icon} {status.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
            <span className={`flex items-center gap-1 font-medium ${isToday(date) ? 'text-red-500' : isTomorrow(date) ? 'text-amber-500' : ''}`}>
              📅 {isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d, yyyy')}
            </span>
            {appt.appointment_time && <span className="flex items-center gap-1">🕐 {appt.appointment_time}</span>}
            {appt.services?.price && (
              <span className="font-bold text-slate-600 ml-auto">₱{parseFloat(appt.services.price).toLocaleString()}</span>
            )}
          </div>

          {appt.performed_services?.length > 0 && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-sky-50/80 border border-sky-100">
              <p className="text-xs font-bold text-sky-700 mb-1">Procedures performed:</p>
              <div className="flex flex-wrap gap-1">
                {appt.performed_services.map((p, i) => (
                  <span key={i} className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                    {p.name}
                  </span>
                ))}
              </div>
              <p className="text-xs font-bold text-sky-700 mt-1.5">
                Total: ₱{appt.performed_services.reduce((s, p) => s + (p.price || 0), 0).toLocaleString()}
              </p>
            </div>
          )}

          {isCancelled && appt.cancel_reason && (
            <div className="mt-2.5 bg-red-50/80 border border-red-100 rounded-xl p-2.5">
              <p className="text-xs font-bold text-red-500">
                Cancelled by {appt.cancelled_by === 'customer' ? 'you' : 'clinic'}
              </p>
              <p className="text-xs text-red-400 mt-0.5 leading-relaxed">{appt.cancel_reason}</p>
            </div>
          )}
        </div>
      </div>

      {isUpcoming && ['pending', 'accepted'].includes(appt.status) && (
        <div className="mt-3 pt-3 border-t border-sky-50 flex justify-end">
          <button
            onClick={() => onCancel(appt)}
            className="text-xs font-bold text-red-400 px-3 py-1.5 rounded-xl border border-red-200/60 bg-red-50/60 hover:bg-red-50 hover:border-red-200 transition-all"
          >
            Cancel Appointment
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const { user, profile } = useAuth()
  const [appointments, setAppointments]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [cancelModal, setCancelModal]     = useState(null)
  const [cancelReason, setCancelReason]   = useState('')
  const [cancelling, setCancelling]       = useState(false)
  const [showCancelled, setShowCancelled] = useState(false)

  useEffect(() => { loadAppointments() }, [user])

  async function loadAppointments() {
    const { data } = await supabase.from('appointments')
      .select('*, clinics(name,logo_url,city), services(name,price)')
      .eq('customer_id', user.id)
      .order('appointment_date', { ascending: false })
      .limit(50)
    setAppointments(data || [])
    setLoading(false)
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return
    setCancelling(true)
    await supabase.from('appointments')
      .update({ status: 'cancelled', cancelled_by: 'customer', cancel_reason: cancelReason })
      .eq('id', cancelModal.id)
    const { data: clinic } = await supabase.from('clinics').select('owner_id').eq('id', cancelModal.clinic_id).single()
    if (clinic) await supabase.from('notifications').insert({
      recipient_id: clinic.owner_id, type: 'appointment_cancelled',
      title: '🚫 Appointment Cancelled',
      message: `${profile?.full_name} cancelled their ${cancelModal.services?.name} on ${format(new Date(cancelModal.appointment_date), 'MMM d, yyyy')}. Reason: ${cancelReason}`
    })
    setAppointments(prev => prev.map(a =>
      a.id === cancelModal.id ? { ...a, status: 'cancelled', cancelled_by: 'customer', cancel_reason: cancelReason } : a
    ))
    setCancelModal(null); setCancelReason(''); setCancelling(false)
  }

  const upcoming  = appointments.filter(a => !isPast(new Date(a.appointment_date)) && !['cancelled', 'rejected'].includes(a.status))
  const past      = appointments.filter(a => (isPast(new Date(a.appointment_date)) || ['rejected', 'completed'].includes(a.status)) && a.status !== 'cancelled')
  const cancelled = appointments.filter(a => a.status === 'cancelled')
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-sky-100 border-t-sky-400 animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in space-y-5">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #06b6d4 50%, #0ea5e9 100%)' }}>
        {/* dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        {/* glow blobs */}
        <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 w-32 h-32 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)' }} />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-100 text-sm font-medium">{greeting} 👋</p>
            <h1 className="font-bold text-2xl mt-0.5 tracking-tight">{profile?.full_name?.split(' ')[0]}</h1>
            <p className="text-sky-100/90 text-sm mt-1">
              {upcoming.length > 0
                ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}`
                : 'No upcoming appointments — book one today!'}
            </p>
          </div>
          <Link to="/dashboard/browse" className={btnSecondary} style={{ color: '#0ea5e9' }}>
            🔍 Browse Clinics
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming',  value: upcoming.length,                                       icon: '📅', from: '#e0f2fe', to: '#bae6fd', text: 'text-sky-600' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, icon: '🏆', from: '#ede9fe', to: '#ddd6fe', text: 'text-violet-600' },
          { label: 'Cancelled', value: cancelled.length,                                       icon: '🚫', from: '#f1f5f9', to: '#e2e8f0', text: 'text-slate-500' },
          { label: 'Total',     value: appointments.length,                                    icon: '📊', from: '#fef3c7', to: '#fde68a', text: 'text-amber-600' },
        ].map(s => (
          <div key={s.label}
            className="rounded-2xl border border-white/80 p-4 text-center shadow-[0_2px_12px_rgba(14,165,233,0.07)]"
            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-slate-500 text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Smile Journey ── */}
      <SmileJourney appointments={appointments} />

      {/* ── Upcoming appointments ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-bold text-slate-800 text-base">Upcoming Appointments</h2>
          {upcoming.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200">
              {upcoming.length}
            </span>
          )}
        </div>

        {upcoming.length === 0 ? (
          <div className={`${glass} p-10 text-center`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-cyan-50 flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm">📅</div>
            <p className="text-slate-700 font-semibold">No upcoming appointments</p>
            <p className="text-slate-400 text-sm mt-1 mb-5">Find a great clinic near you</p>
            <Link to="/dashboard/browse" className={btnPrimary}>Browse Clinics</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(a => <AppointmentCard key={a.id} appt={a} onCancel={setCancelModal} />)}
          </div>
        )}
      </section>

      {/* ── Past appointments ── */}
      {past.length > 0 && (
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-3">Past Appointments</h2>
          <div className="space-y-3">
            {past.slice(0, 5).map(a => <AppointmentCard key={a.id} appt={a} onCancel={setCancelModal} />)}
          </div>
          {past.length > 5 && (
            <p className="text-center text-sm font-semibold mt-3 text-sky-500 cursor-pointer hover:text-sky-600 transition-colors">
              View all {past.length} past appointments →
            </p>
          )}
        </section>
      )}

      {/* ── Cancelled (collapsible) ── */}
      {cancelled.length > 0 && (
        <section>
          <button onClick={() => setShowCancelled(p => !p)}
            className="w-full flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400 text-sm">🚫 Cancelled</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{cancelled.length}</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showCancelled ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {showCancelled && (
            <div className="space-y-3 mt-1 animate-fade-in">
              {cancelled.map(a => <AppointmentCard key={a.id} appt={a} onCancel={setCancelModal} />)}
            </div>
          )}
        </section>
      )}

      {/* ── Cancel modal ── */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={() => setCancelModal(null)}>
          <div className={`${glass} w-full max-w-sm p-6`} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Cancel Appointment</h3>
            <p className="text-slate-500 text-sm mb-4">
              {cancelModal.clinics?.name} · {cancelModal.services?.name}<br/>
              {format(new Date(cancelModal.appointment_date), 'EEEE, MMMM d, yyyy')}
            </p>
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 mb-4">
              <p className="text-amber-700 text-xs font-medium">⚠️ This cannot be undone. The clinic will be notified.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Reason for cancellation *</label>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3}
                placeholder="e.g. Schedule conflict, emergency came up..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white/80 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent resize-none transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} className={`${btnSecondary} flex-1`}>Keep It</button>
              <button onClick={handleCancel} disabled={cancelling || !cancelReason.trim()}
                className={`${btnDanger} flex-1 disabled:opacity-50 disabled:cursor-not-allowed`}>
                {cancelling
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Cancelling...</>
                  : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mascot placeholder (bottom-right, fixed) ── */}
      <div className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-40 pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-xl border-2 border-sky-200/60 shadow-[0_8px_24px_rgba(14,165,233,0.2)] flex items-center justify-center">
          {/* TODO: replace with 3D mascot image */}
          <span className="text-2xl">🦷</span>
        </div>
      </div>
    </div>
  )
}