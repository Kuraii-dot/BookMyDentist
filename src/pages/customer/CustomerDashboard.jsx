import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

const STATUS_CONFIG = {
  pending:             { label: 'Pending',     class: 'badge-warning', icon: '⏳' },
  accepted:            { label: 'Confirmed',   class: 'badge-success', icon: '✅' },
  rejected:            { label: 'Declined',    class: 'badge-danger',  icon: '❌' },
  rescheduled:         { label: 'Rescheduled', class: 'badge-info',    icon: '🔄' },
  reschedule_accepted: { label: 'Confirmed',   class: 'badge-success', icon: '✅' },
  reschedule_declined: { label: 'Declined',    class: 'badge-danger',  icon: '❌' },
  completed:           { label: 'Completed',   class: 'badge-purple',  icon: '🏆' },
  cancelled:           { label: 'Cancelled',   class: 'badge-gray',    icon: '🚫' },
}

function AppointmentCard({ appt, onCancel }) {
  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending
  const date = new Date(appt.appointment_date)
  const isUpcoming = !isPast(date) && !['cancelled','rejected'].includes(appt.status)
  const isCancelled = appt.status === 'cancelled'

  return (
    <div className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
      isUpcoming ? 'border-sky-200 shadow-sm shadow-sky-100' : 'border-slate-100'
    } ${isCancelled ? 'opacity-70' : ''} p-4`}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-sky-50 border border-sky-100">
          {appt.clinics?.logo_url
            ? <img src={appt.clinics.logo_url} alt="" className="w-full h-full object-cover"/>
            : <span className="text-xl">🦷</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-slate-900 text-sm">{appt.clinics?.name}</p>
              <p className="text-xs font-semibold text-sky-600">{appt.services?.name}</p>
            </div>
            <span className={`badge ${status.class}`}>{status.icon} {status.label}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
            <span className={`flex items-center gap-1 font-medium ${isToday(date) ? 'text-red-500' : isTomorrow(date) ? 'text-amber-500' : ''}`}>
              📅 {isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d, yyyy')}
            </span>
            {appt.appointment_time && <span>🕐 {appt.appointment_time}</span>}
            {appt.services?.price && <span className="font-semibold text-slate-600">₱{parseFloat(appt.services.price).toLocaleString()}</span>}
          </div>

          {appt.performed_services?.length > 0 && (
            <div className="mt-2 p-2.5 rounded-xl bg-sky-50 border border-sky-100">
              <p className="text-xs font-semibold text-sky-700 mb-1">Procedures performed:</p>
              <div className="flex flex-wrap gap-1">
                {appt.performed_services.map((p, i) => (
                  <span key={i} className="badge badge-teal" style={{fontSize:'0.65rem',padding:'0.1rem 0.5rem'}}>{p.name}</span>
                ))}
              </div>
              <p className="text-xs font-bold text-sky-700 mt-1">
                Total: ₱{appt.performed_services.reduce((s,p)=>s+(p.price||0),0).toLocaleString()}
              </p>
            </div>
          )}

          {isCancelled && appt.cancel_reason && (
            <div className="mt-2 bg-red-50 border border-red-100 rounded-xl p-2.5">
              <p className="text-xs font-semibold text-red-500">Cancelled by {appt.cancelled_by === 'customer' ? 'you' : 'clinic'}</p>
              <p className="text-xs text-red-400 mt-0.5 leading-relaxed">{appt.cancel_reason}</p>
            </div>
          )}
        </div>
      </div>

      {isUpcoming && ['pending','accepted'].includes(appt.status) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
          <button onClick={() => onCancel(appt)} className="btn btn-secondary btn-sm text-red-400 hover:bg-red-50 hover:border-red-200">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default function CustomerDashboard() {
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
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
    await supabase.from('appointments').update({ status:'cancelled', cancelled_by:'customer', cancel_reason: cancelReason }).eq('id', cancelModal.id)
    const { data: clinic } = await supabase.from('clinics').select('owner_id').eq('id', cancelModal.clinic_id).single()
    if (clinic) await supabase.from('notifications').insert({
      recipient_id: clinic.owner_id, type:'appointment_cancelled',
      title:'🚫 Appointment Cancelled',
      message:`${profile?.full_name} cancelled their ${cancelModal.services?.name} on ${format(new Date(cancelModal.appointment_date),'MMM d, yyyy')}. Reason: ${cancelReason}`
    })
    setAppointments(prev => prev.map(a => a.id === cancelModal.id ? {...a, status:'cancelled', cancelled_by:'customer', cancel_reason: cancelReason} : a))
    setCancelModal(null); setCancelReason(''); setCancelling(false)
  }

  const upcoming  = appointments.filter(a => !isPast(new Date(a.appointment_date)) && !['cancelled','rejected'].includes(a.status))
  const past      = appointments.filter(a => (isPast(new Date(a.appointment_date)) || ['rejected','completed'].includes(a.status)) && a.status !== 'cancelled')
  const cancelled = appointments.filter(a => a.status === 'cancelled')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}} />
    </div>
  )

  return (
    <div className="animate-fade-in space-y-6">

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-sky-600 p-6 text-white shadow-lg shadow-sky-200">
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize:'24px 24px'}} />
        <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
          style={{background:'radial-gradient(circle, #fde68a 0%, transparent 70%)'}} />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-200 text-sm">{greeting} 👋</p>
            <h1 className="font-display font-bold text-2xl mt-0.5">{profile?.full_name?.split(' ')[0]}</h1>
            <p className="text-sky-100 text-sm mt-1">
              {upcoming.length > 0
                ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}`
                : 'No upcoming appointments — book one today!'}
            </p>
          </div>
          <Link to="/dashboard/browse"
            className="px-5 py-2.5 rounded-xl bg-white font-bold text-sm hover:bg-sky-50 transition-all shadow-md hover:-translate-y-0.5 shrink-0"
            style={{color:'var(--color-brand)'}}>
            🔍 Browse Clinics
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 stagger">
        {[
          { label:'Upcoming',  value: upcoming.length,                                           icon:'📅', color:'text-sky-600',    bg:'bg-sky-50',    border:'border-sky-100' },
          { label:'Completed', value: appointments.filter(a=>a.status==='completed').length,      icon:'✅', color:'text-violet-600', bg:'bg-violet-50', border:'border-violet-100' },
          { label:'Cancelled', value: cancelled.length,                                           icon:'🚫', color:'text-slate-500',  bg:'bg-slate-100', border:'border-slate-200' },
          { label:'Total',     value: appointments.length,                                        icon:'📊', color:'text-amber-600',  bg:'bg-amber-50',  border:'border-amber-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-3 sm:p-4 text-center animate-fade-in shadow-sm`}>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 ${s.bg} rounded-xl flex items-center justify-center text-base sm:text-lg mx-auto mb-1.5`}>{s.icon}</div>
            <p className={`text-xl sm:text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
          Upcoming Appointments
          {upcoming.length > 0 && <span className="badge badge-teal">{upcoming.length}</span>}
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-100 p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">📅</div>
            <p className="text-slate-600 font-semibold">No upcoming appointments</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">Find a great clinic near you</p>
            <Link to="/dashboard/browse" className="btn btn-primary btn-md rounded-xl">Browse Clinics</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(a => <AppointmentCard key={a.id} appt={a} onCancel={setCancelModal}/>)}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-slate-800 mb-3">Past Appointments</h2>
          <div className="space-y-3">
            {past.slice(0,5).map(a => <AppointmentCard key={a.id} appt={a} onCancel={setCancelModal}/>)}
          </div>
          {past.length > 5 && (
            <p className="text-center text-sm font-semibold mt-3 text-sky-500 cursor-pointer hover:text-sky-600">
              View all {past.length} past appointments →
            </p>
          )}
        </section>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <section>
          <button onClick={() => setShowCancelled(p => !p)}
            className="w-full flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-slate-400 flex items-center gap-2 text-base">
              🚫 Cancelled <span className="badge badge-gray">{cancelled.length}</span>
            </h2>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${showCancelled ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {showCancelled && (
            <div className="space-y-3 animate-fade-in">
              {cancelled.map(a => <AppointmentCard key={a.id} appt={a} onCancel={setCancelModal}/>)}
            </div>
          )}
        </section>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="modal-backdrop" onClick={() => setCancelModal(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Cancel Appointment</h3>
            <p className="text-slate-500 text-sm mb-4">
              {cancelModal.clinics?.name} · {cancelModal.services?.name}<br/>
              {format(new Date(cancelModal.appointment_date), 'EEEE, MMMM d, yyyy')}
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
              <p className="text-amber-700 text-xs">⚠️ This cannot be undone. The clinic will be notified.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for cancellation *</label>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3}
                placeholder="e.g. Schedule conflict, emergency came up..." className="input resize-none"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} className="btn btn-secondary btn-md flex-1">Keep It</button>
              <button onClick={handleCancel} disabled={cancelling || !cancelReason.trim()} className="btn btn-danger btn-md flex-1">
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}