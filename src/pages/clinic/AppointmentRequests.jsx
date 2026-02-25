import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'pending',   label: 'Pending',    icon: '⏳' },
  { key: 'accepted',  label: 'Upcoming',   icon: '✅' },
  { key: 'completed', label: 'Completed',  icon: '🏆' },
  { key: 'all',       label: 'All',        icon: '📋' },
]

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

export default function AppointmentRequests() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [actionModal, setActionModal] = useState(null)
  const [actionType, setActionType] = useState(null) // 'accept' | 'decline' | 'complete' | 'reschedule'
  const [reason, setReason] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    const { data: c } = await supabase.from('clinics').select('id').eq('owner_id', user.id).maybeSingle()
    setClinic(c)
    if (!c) { setLoading(false); return }

    const { data } = await supabase.from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(full_name, email, phone, avatar_url), services(name, price, duration_minutes)')
      .eq('clinic_id', c.id)
      .order('appointment_date', { ascending: true })
    setAppointments(data || [])
    setLoading(false)
  }

  async function handleAction() {
    if (!actionModal) return
    setProcessing(true)
    const a = actionModal

    const updates = {
      accept:     { status: 'accepted' },
      decline:    { status: 'rejected' },
      complete:   { status: 'completed' },
      reschedule: { status: 'rescheduled', rescheduled_date: rescheduleDate, rescheduled_time: rescheduleTime },
    }[actionType]

    const notifMessages = {
      accept:     { type: 'accepted',   title: '✅ Appointment Confirmed!', msg: `Your appointment for ${a.services?.name} on ${format(new Date(a.appointment_date), 'MMM d, yyyy')} has been confirmed.` },
      decline:    { type: 'rejected',   title: '❌ Appointment Declined',  msg: `Your appointment for ${a.services?.name} was declined.${reason ? ` Reason: ${reason}` : ''}` },
      complete:   { type: 'completed',  title: '🏆 Appointment Completed', msg: `Your appointment for ${a.services?.name} has been marked complete. Please leave a review!` },
      reschedule: { type: 'rescheduled',title: '🔄 Reschedule Proposed',   msg: `Your appointment has been proposed to be rescheduled to ${format(new Date(rescheduleDate), 'MMM d, yyyy')}${rescheduleTime ? ' at ' + rescheduleTime : ''}.` },
    }[actionType]

    await supabase.from('appointments').update(updates).eq('id', a.id)
    await supabase.from('notifications').insert({
      recipient_id: a.customer_id,
      type: notifMessages.type,
      title: notifMessages.title,
      message: notifMessages.msg,
      related_id: a.id
    })

    toast.success({
      accept: 'Appointment confirmed!',
      decline: 'Appointment declined.',
      complete: 'Marked as completed!',
      reschedule: 'Reschedule proposed to patient.'
    }[actionType])

    setActionModal(null); setReason(''); setRescheduleDate(''); setRescheduleTime('')
    loadData()
    setProcessing(false)
  }

  function openAction(appt, type) {
    setActionModal(appt)
    setActionType(type)
    setReason('')
    setRescheduleDate(appt.appointment_date)
    setRescheduleTime(appt.appointment_time || '')
  }

  const filtered = appointments.filter(a => {
    if (tab === 'pending') return a.status === 'pending'
    if (tab === 'accepted') return ['accepted', 'reschedule_accepted', 'rescheduled'].includes(a.status)
    if (tab === 'completed') return ['completed', 'rejected', 'cancelled'].includes(a.status)
    return true
  }).filter(a => {
    if (!search) return true
    return a.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
           a.services?.name?.toLowerCase().includes(search.toLowerCase())
  })

  const counts = {
    pending:  appointments.filter(a => a.status === 'pending').length,
    accepted: appointments.filter(a => ['accepted', 'reschedule_accepted', 'rescheduled'].includes(a.status)).length,
    completed:appointments.filter(a => ['completed', 'rejected', 'cancelled'].includes(a.status)).length,
    all:      appointments.length
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Appointments</h1>
        <p className="page-subtitle">{appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 p-1 shadow-sm mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap px-2 ${tab === t.key ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="hidden sm:inline">{t.icon}</span> {t.label}
            {counts[t.key] > 0 && (
              <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" placeholder="Search by patient name or service..." value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="text-slate-500 font-medium mt-3">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
            const isPending = a.status === 'pending'
            const isAccepted = ['accepted', 'reschedule_accepted'].includes(a.status)
            const dateObj = new Date(a.appointment_date)
            const past = isPast(dateObj)

            return (
              <div key={a.id} className={`card p-5 transition-all hover:shadow-md ${isPending ? 'border-l-4 border-l-amber-400' : isAccepted ? 'border-l-4 border-l-sky-400' : ''}`}>
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center font-bold text-sky-600 shrink-0 overflow-hidden">
                    {a.profiles?.avatar_url
                      ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span>{a.profiles?.full_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900">{a.profiles?.full_name}</p>
                        <p className="text-slate-400 text-xs">{a.profiles?.email}</p>
                      </div>
                      <span className={`badge ${st.class}`}>{st.label}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <p className="text-slate-400 text-xs mb-0.5">Service</p>
                        <p className="font-semibold text-slate-700 text-sm">{a.services?.name}</p>
                        {a.services?.price && <p className="text-teal-600 text-xs font-semibold">₱{parseFloat(a.services.price).toLocaleString()}</p>}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <p className="text-slate-400 text-xs mb-0.5">Date</p>
                        <p className="font-semibold text-slate-700 text-sm">{format(dateObj, 'MMM d, yyyy')}</p>
                        {a.appointment_time && <p className="text-slate-500 text-xs">{a.appointment_time}</p>}
                      </div>
                      {a.services?.duration_minutes && (
                        <div className="bg-slate-50 rounded-xl p-2.5">
                          <p className="text-slate-400 text-xs mb-0.5">Duration</p>
                          <p className="font-semibold text-slate-700 text-sm">{a.services.duration_minutes} min</p>
                        </div>
                      )}
                      {a.notes && (
                        <div className="bg-slate-50 rounded-xl p-2.5 col-span-2 sm:col-span-1">
                          <p className="text-slate-400 text-xs mb-0.5">Notes</p>
                          <p className="text-slate-600 text-xs">{a.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {(isPending || isAccepted) && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                        {isPending && <>
                          <button onClick={() => openAction(a, 'accept')} className="btn btn-primary btn-sm">✓ Accept</button>
                          <button onClick={() => openAction(a, 'reschedule')} className="btn btn-secondary btn-sm">🔄 Reschedule</button>
                          <button onClick={() => openAction(a, 'decline')} className="btn btn-secondary btn-sm text-red-500 hover:bg-red-50">✗ Decline</button>
                        </>}
                        {isAccepted && past && (
                          <button onClick={() => openAction(a, 'complete')} className="btn btn-primary btn-sm">🏆 Mark Completed</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-slate-900 text-lg mb-1">
              {{ accept: '✅ Confirm Appointment', decline: '✗ Decline Appointment', complete: '🏆 Mark as Completed', reschedule: '🔄 Propose Reschedule' }[actionType]}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {actionModal.profiles?.full_name} · {actionModal.services?.name}<br />
              {format(new Date(actionModal.appointment_date), 'EEEE, MMMM d, yyyy')}
            </p>

            {actionType === 'reschedule' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Date</label>
                  <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Time</label>
                  <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="input" />
                </div>
              </div>
            )}

            {(actionType === 'decline') && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason (optional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                  placeholder="e.g. Fully booked for that day..." className="input resize-none" />
              </div>
            )}

            {actionType === 'complete' && (
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 mb-4">
                <p className="text-teal-700 text-xs">The patient will be notified and asked to leave a review.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-md flex-1">Cancel</button>
              <button onClick={handleAction} disabled={processing || (actionType === 'reschedule' && !rescheduleDate)}
                className={`btn btn-md flex-1 ${actionType === 'decline' ? 'btn-danger' : 'btn-primary'}`}>
                {processing ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Processing...</> :
                  { accept: 'Confirm', decline: 'Decline', complete: 'Mark Completed', reschedule: 'Propose New Time' }[actionType]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}