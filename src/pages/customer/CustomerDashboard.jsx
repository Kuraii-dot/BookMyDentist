import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

const STATUS_CONFIG = {
  pending:             { label: 'Pending',    class: 'badge-warning',  icon: '⏳' },
  accepted:            { label: 'Confirmed',  class: 'badge-success',  icon: '✅' },
  rejected:            { label: 'Declined',   class: 'badge-danger',   icon: '❌' },
  rescheduled:         { label: 'Rescheduled',class: 'badge-info',     icon: '🔄' },
  reschedule_accepted: { label: 'Confirmed',  class: 'badge-success',  icon: '✅' },
  reschedule_declined: { label: 'Declined',   class: 'badge-danger',   icon: '❌' },
  completed:           { label: 'Completed',  class: 'badge-purple',   icon: '🏆' },
  cancelled:           { label: 'Cancelled',  class: 'badge-gray',     icon: '🚫' },
}

function AppointmentCard({ appt, onCancel }) {
  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending
  const date = new Date(appt.appointment_date)
  const isUpcoming = !isPast(date) && !['cancelled', 'rejected'].includes(appt.status)
  const dateLabel = isToday(date) ? '🔴 Today' : isTomorrow(date) ? '🟡 Tomorrow' : format(date, 'EEE, MMM d')

  return (
    <div className={`card p-4 transition-all hover:shadow-md ${isUpcoming ? 'border-l-4 border-l-teal-500' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Clinic logo */}
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-teal-50 shrink-0">
          {appt.clinics?.logo_url
            ? <img src={appt.clinics.logo_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-lg">🦷</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-slate-900 text-sm">{appt.clinics?.name}</p>
              <p className="text-teal-600 text-xs font-medium">{appt.services?.name}</p>
            </div>
            <span className={`badge ${status.class}`}>{status.icon} {status.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span className={isToday(date) ? 'text-red-500 font-semibold' : isTomorrow(date) ? 'text-amber-600 font-semibold' : ''}>{dateLabel}</span>
            </span>
            {appt.appointment_time && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {appt.appointment_time}
              </span>
            )}
            {appt.services?.price && (
              <span className="font-semibold text-slate-600">₱{parseFloat(appt.services.price).toLocaleString()}</span>
            )}
          </div>
          {appt.notes && <p className="text-xs text-slate-400 mt-1.5 italic">"{appt.notes}"</p>}
        </div>
      </div>
      {/* Cancel button for upcoming pending/accepted */}
      {isUpcoming && ['pending', 'accepted'].includes(appt.status) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
          <button onClick={() => onCancel(appt)}
            className="btn btn-secondary btn-sm text-red-500 hover:bg-red-50 hover:border-red-200">
            Cancel Appointment
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

  useEffect(() => { loadAppointments() }, [user])

  async function loadAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*, clinics(name, logo_url, city), services(name, price)')
      .eq('customer_id', user.id)
      .order('appointment_date', { ascending: false })
      .limit(20)
    setAppointments(data || [])
    setLoading(false)
  }

  async function handleCancel() {
    if (!cancelReason.trim()) { return }
    setCancelling(true)
    const { error } = await supabase.from('appointments').update({
      status: 'cancelled',
      cancelled_by: 'customer',
      cancel_reason: cancelReason
    }).eq('id', cancelModal.id)

    if (error) { setCancelling(false); return }

    // Notify clinic
    const { data: clinic } = await supabase.from('clinics').select('owner_id').eq('id', cancelModal.clinic_id).single()
    if (clinic) {
      await supabase.from('notifications').insert({
        recipient_id: clinic.owner_id,
        type: 'appointment_cancelled',
        title: '🚫 Appointment Cancelled',
        message: `${profile?.full_name} cancelled their appointment for ${cancelModal.services?.name} on ${format(new Date(cancelModal.appointment_date), 'MMM d, yyyy')}. Reason: ${cancelReason}`
      })
    }

    setAppointments(prev => prev.map(a => a.id === cancelModal.id ? { ...a, status: 'cancelled' } : a))
    setCancelModal(null)
    setCancelReason('')
    setCancelling(false)
  }

  const upcoming = appointments.filter(a => !isPast(new Date(a.appointment_date)) && !['cancelled', 'rejected'].includes(a.status))
  const past = appointments.filter(a => isPast(new Date(a.appointment_date)) || ['cancelled', 'rejected', 'completed'].includes(a.status))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px'}} />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-teal-200 text-sm">{greeting} 👋</p>
            <h1 className="font-display font-bold text-2xl mt-0.5">{profile?.full_name?.split(' ')[0]}</h1>
            <p className="text-teal-100 text-sm mt-1">
              {upcoming.length > 0
                ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}`
                : 'No upcoming appointments'}
            </p>
          </div>
          <Link to="/" className="btn bg-white text-teal-700 hover:bg-teal-50 btn-md rounded-xl shadow-sm shrink-0">
            🔍 Book Appointment
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 stagger">
        {[
          { label: 'Upcoming', value: upcoming.length, color: 'text-teal-600', bg: 'bg-teal-50', icon: '📅' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: 'text-violet-600', bg: 'bg-violet-50', icon: '✅' },
          { label: 'Total', value: appointments.length, color: 'text-slate-600', bg: 'bg-slate-100', icon: '📊' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center animate-fade-in">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center text-lg mx-auto mb-2`}>{s.icon}</div>
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <section className="mb-8">
        <h2 className="font-display font-semibold text-slate-800 mb-3">Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <div className="card p-10 text-center">
            <span className="text-4xl">📅</span>
            <p className="text-slate-500 font-medium mt-3">No upcoming appointments</p>
            <p className="text-slate-400 text-sm mt-1">Book one at a clinic near you</p>
            <Link to="/" className="btn btn-primary btn-md mt-4 rounded-xl">Browse Clinics</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(a => <AppointmentCard key={a.id} appt={a} onCancel={setCancelModal} />)}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-slate-800 mb-3">Past Appointments</h2>
          <div className="space-y-3">
            {past.slice(0, 5).map(a => <AppointmentCard key={a.id} appt={a} onCancel={setCancelModal} />)}
          </div>
          {past.length > 5 && (
            <Link to="/dashboard/appointments" className="block text-center text-teal-600 text-sm font-medium mt-3 hover:underline">
              View all {past.length} past appointments →
            </Link>
          )}
        </section>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="modal-backdrop" onClick={() => setCancelModal(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Cancel Appointment</h3>
            <p className="text-slate-500 text-sm mb-4">
              {cancelModal.clinics?.name} · {cancelModal.services?.name}<br />
              {format(new Date(cancelModal.appointment_date), 'EEEE, MMMM d, yyyy')}
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
              <p className="text-amber-700 text-xs">⚠️ This action cannot be undone. The clinic will be notified.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for cancellation *</label>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3}
                placeholder="e.g. Schedule conflict, feeling better, etc."
                className="input resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} className="btn btn-secondary btn-md flex-1">Keep Appointment</button>
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