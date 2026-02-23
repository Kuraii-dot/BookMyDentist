import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, addDays } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending:             { label: 'Pending',    bg: 'bg-amber-100',  text: 'text-amber-700',  icon: '⏳' },
  accepted:            { label: 'Accepted',   bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅' },
  rejected:            { label: 'Declined',   bg: 'bg-red-100',    text: 'text-red-600',    icon: '❌' },
  rescheduled:         { label: 'Rescheduled',bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '🔄' },
  reschedule_accepted: { label: 'Confirmed',  bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅' },
  reschedule_declined: { label: 'Declined',   bg: 'bg-red-100',    text: 'text-red-600',    icon: '❌' },
  completed:           { label: 'Completed',  bg: 'bg-purple-100', text: 'text-purple-700', icon: '🎉' },
  cancelled:           { label: 'Cancelled',  bg: 'bg-stone-100',  text: 'text-stone-500',  icon: '🚫' },
}

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00'
]

const FILTER_TABS = ['all', 'pending', 'accepted', 'reschedule_accepted', 'completed', 'rejected']

export default function AppointmentRequests() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const [rejectModal, setRejectModal] = useState(null)
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase.from('clinics').select('*').eq('owner_id', user.id).single()
      setClinic(c)
      if (c) await fetchAppointments(c.id)
      setLoading(false)
    }
    load()
  }, [user])

  async function fetchAppointments(clinicId) {
    const id = clinicId || clinic?.id
    if (!id) return
    const { data } = await supabase
      .from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(*), services(*)')
      .eq('clinic_id', id)
      .order('created_at', { ascending: false })
    setAppointments(data || [])
  }

  async function handleAccept(appt) {
    setActionLoading(appt.id)
    await supabase.from('appointments').update({ status: 'accepted' }).eq('id', appt.id)
    await supabase.from('notifications').insert({
      recipient_id: appt.customer_id,
      appointment_id: appt.id,
      type: 'accepted',
      title: 'Appointment Accepted! 🎉',
      message: `Your ${appt.services?.name} appointment at ${clinic.name} on ${format(new Date(appt.appointment_date), 'MMM d, yyyy')} at ${appt.appointment_time} has been confirmed.`
    })
    toast.success('Appointment accepted!')
    fetchAppointments()
    setActionLoading(null)
  }

  async function handleMarkCompleted(appt) {
    setActionLoading(appt.id)
    await supabase.from('appointments').update({ status: 'completed' }).eq('id', appt.id)
    await supabase.from('notifications').insert({
      recipient_id: appt.customer_id,
      appointment_id: appt.id,
      type: 'completed',
      title: 'Service Completed 🎉',
      message: `Your ${appt.services?.name} at ${clinic.name} has been marked as completed. We'd love to hear your feedback!`
    })
    toast.success('Marked as completed!')
    fetchAppointments()
    setActionLoading(null)
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return }
    setActionLoading(true)
    const appt = rejectModal
    await supabase.from('appointments').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', appt.id)
    await supabase.from('notifications').insert({
      recipient_id: appt.customer_id,
      appointment_id: appt.id,
      type: 'rejected',
      title: 'Appointment Declined',
      message: `Your appointment at ${clinic.name} was declined. Reason: ${rejectReason}`
    })
    toast.success('Appointment declined')
    setRejectModal(null)
    setRejectReason('')
    fetchAppointments()
    setActionLoading(false)
  }

  async function handleReschedule() {
    if (!rescheduleDate || !rescheduleTime) { toast.error('Please select a date and time'); return }
    setActionLoading(true)
    const appt = rescheduleModal
    await supabase.from('appointments').update({
      status: 'rescheduled',
      rescheduled_date: rescheduleDate,
      rescheduled_time: rescheduleTime
    }).eq('id', appt.id)
    await supabase.from('notifications').insert({
      recipient_id: appt.customer_id,
      appointment_id: appt.id,
      type: 'rescheduled',
      title: 'Appointment Rescheduled',
      message: `${clinic.name} has proposed a new time for your ${appt.services?.name}: ${format(new Date(rescheduleDate), 'MMM d, yyyy')} at ${rescheduleTime}. Please accept or decline.`
    })
    toast.success('Reschedule proposed to patient')
    setRescheduleModal(null)
    setRescheduleDate('')
    setRescheduleTime('')
    fetchAppointments()
    setActionLoading(false)
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-stone-800">Appointments</h1>
        <p className="text-stone-500 mt-1">{appointments.length} total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => {
          const count = tab === 'all' ? appointments.length : appointments.filter(a => a.status === tab).length
          return (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${filter === tab ? 'bg-amber-400 text-white' : 'bg-white text-stone-500 border border-amber-100 hover:border-amber-300'}`}>
              {tab.replace('_', ' ')} {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-amber-100">
          <span className="text-4xl">📭</span>
          <p className="text-stone-400 mt-3">No {filter !== 'all' ? filter.replace('_', ' ') : ''} appointments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(appt => {
            const st = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending
            const isPending = appt.status === 'pending'
            const isAccepted = appt.status === 'accepted' || appt.status === 'reschedule_accepted'
            return (
              <div key={appt.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center font-bold text-amber-700 text-sm">
                      {appt.profiles?.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 text-sm">{appt.profiles?.full_name}</p>
                      <p className="text-stone-400 text-xs">{appt.profiles?.email}</p>
                    </div>
                  </div>
                  <span className={`${st.bg} ${st.text} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1`}>
                    {st.icon} {st.label}
                  </span>
                </div>

                <div className="bg-amber-50 rounded-xl p-3 mb-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-stone-400 text-xs">Service</p>
                    <p className="font-semibold text-stone-800">{appt.services?.name}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs">Rate</p>
                    <p className="font-semibold text-amber-600">₱{appt.services?.price ? parseFloat(appt.services.price).toLocaleString() : 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs">Date</p>
                    <p className="font-semibold text-stone-800">{format(new Date(appt.appointment_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs">Time</p>
                    <p className="font-semibold text-stone-800">{appt.appointment_time}</p>
                  </div>
                </div>

                {appt.rescheduled_date && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-3 border border-blue-100">
                    <p className="text-blue-500 text-xs font-semibold mb-1">Rescheduled to</p>
                    <p className="text-blue-700 font-semibold text-sm">{format(new Date(appt.rescheduled_date), 'MMM d, yyyy')} at {appt.rescheduled_time}</p>
                  </div>
                )}

                {appt.notes && (
                  <div className="bg-stone-50 rounded-xl p-3 mb-3">
                    <p className="text-stone-400 text-xs font-semibold mb-0.5">Patient Notes</p>
                    <p className="text-stone-600 text-sm">{appt.notes}</p>
                  </div>
                )}

                {/* Actions for pending */}
                {isPending && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAccept(appt)} disabled={actionLoading === appt.id}
                      className="flex-1 bg-green-400 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                      ✓ Accept
                    </button>
                    <button onClick={() => { setRescheduleModal(appt); setRescheduleDate(''); setRescheduleTime('') }} disabled={actionLoading === appt.id}
                      className="flex-1 bg-blue-400 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                      🔄 Reschedule
                    </button>
                    <button onClick={() => { setRejectModal(appt); setRejectReason('') }} disabled={actionLoading === appt.id}
                      className="flex-1 bg-red-400 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                      ✗ Decline
                    </button>
                  </div>
                )}

                {/* Mark as completed — for accepted appointments */}
                {isAccepted && (
                  <button onClick={() => handleMarkCompleted(appt)} disabled={actionLoading === appt.id}
                    className="w-full mt-3 bg-purple-400 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    {actionLoading === appt.id
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                      : '🎉 Mark as Completed'
                    }
                  </button>
                )}

                <p className="text-xs text-stone-400 mt-3">Received {format(new Date(appt.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-stone-800 text-lg mb-1">Decline Appointment</h3>
            <p className="text-stone-500 text-sm mb-4">Please let the patient know why.</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Fully booked on this date, dentist unavailable..."
              rows={3} className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 border border-amber-200 text-stone-600 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading}
                className="flex-1 bg-red-400 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {actionLoading ? 'Declining...' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setRescheduleModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-stone-800 text-lg mb-1">Propose New Time</h3>
            <p className="text-stone-500 text-sm mb-4">Patient will be notified to accept or decline.</p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-stone-700 mb-2">New Date</label>
              <input type="date" min={format(addDays(new Date(), 1), 'yyyy-MM-dd')} value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>
            {rescheduleDate && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-stone-700 mb-2">New Time</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(t => (
                    <button key={t} onClick={() => setRescheduleTime(t)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${rescheduleTime === t ? 'bg-amber-400 text-white border-amber-400' : 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <button onClick={() => setRescheduleModal(null)} className="flex-1 border border-amber-200 text-stone-600 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleReschedule} disabled={actionLoading || !rescheduleDate || !rescheduleTime}
                className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                {actionLoading ? 'Sending...' : 'Propose Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}