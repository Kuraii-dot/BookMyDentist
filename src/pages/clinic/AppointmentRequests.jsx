import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'pending',   label: 'Pending',   icon: '⏳' },
  { key: 'accepted',  label: 'Upcoming',  icon: '✅' },
  { key: 'completed', label: 'Completed', icon: '🏆' },
  { key: 'all',       label: 'All',       icon: '📋' },
]

const STATUS_CONFIG = {
  pending:             { label: 'Pending',     class: 'badge-warning' },
  accepted:            { label: 'Confirmed',   class: 'badge-success' },
  rejected:            { label: 'Declined',    class: 'badge-danger'  },
  completed:           { label: 'Completed',   class: 'badge-purple'  },
  cancelled:           { label: 'Cancelled',   class: 'badge-gray'    },
  rescheduled:         { label: 'Rescheduled', class: 'badge-info'    },
  reschedule_accepted: { label: 'Confirmed',   class: 'badge-success' },
  reschedule_declined: { label: 'Declined',    class: 'badge-danger'  },
}

function PerformedServicesModal({ appointment, clinicServices, onSave, onClose }) {
  const [performed, setPerformed] = useState(
    appointment.performed_services?.length
      ? appointment.performed_services
      : [{ service_id: appointment.service_id, name: appointment.services?.name, price: parseFloat(appointment.services?.price || 0), custom: false }]
  )
  const [clinicNotes, setClinicNotes] = useState(appointment.clinic_notes || '')
  const [saving, setSaving] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPrice, setCustomPrice] = useState('')

  function addFromCatalog(service) {
    if (performed.find(p => p.service_id === service.id)) { toast.error('Already added'); return }
    setPerformed(prev => [...prev, { service_id: service.id, name: service.name, price: parseFloat(service.price || 0), custom: false }])
  }

  function addCustom() {
    if (!customName.trim()) { toast.error('Enter a procedure name'); return }
    setPerformed(prev => [...prev, { name: customName.trim(), price: parseFloat(customPrice) || 0, custom: true }])
    setCustomName(''); setCustomPrice(''); setShowCustom(false)
  }

  function remove(index) { setPerformed(prev => prev.filter((_, i) => i !== index)) }
  function updatePrice(index, value) { setPerformed(prev => prev.map((p, i) => i === index ? { ...p, price: parseFloat(value) || 0 } : p)) }

  const total = performed.reduce((sum, p) => sum + (p.price || 0), 0)

  async function handleSave() {
    if (performed.length === 0) { toast.error('Add at least one procedure'); return }
    setSaving(true)
    await onSave(appointment.id, performed, clinicNotes)
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">Procedures Performed</h3>
              <p className="text-slate-400 text-sm mt-0.5">{appointment.profiles?.full_name} · {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}</p>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-xs shrink-0">Originally booked:</span>
            <span className="badge badge-gray">{appointment.services?.name}</span>
          </div>

          <div className="space-y-2 mb-4">
            {performed.map((p, i) => (
              <div key={i} className="flex items-center gap-2 border border-slate-100 rounded-xl p-3 bg-white">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                    {p.custom && <span className="badge badge-info" style={{fontSize:'0.6rem',padding:'0.1rem 0.4rem'}}>Custom</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-400 text-xs">₱</span>
                  <input type="number" value={p.price} onChange={e => updatePrice(i, e.target.value)} min="0"
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right font-semibold text-slate-700 focus:outline-none focus:border-teal-400" />
                  <button onClick={() => remove(i)} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Add from your services</p>
            <div className="flex flex-wrap gap-1.5">
              {clinicServices.filter(s => !performed.find(p => p.service_id === s.id)).map(s => (
                <button key={s.id} onClick={() => addFromCatalog(s)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 transition-all font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  {s.name}
                </button>
              ))}
              {clinicServices.filter(s => !performed.find(p => p.service_id === s.id)).length === 0 && (
                <p className="text-slate-300 text-xs italic">All services added</p>
              )}
            </div>
          </div>

          {!showCustom ? (
            <button onClick={() => setShowCustom(true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm hover:border-teal-300 hover:text-teal-500 transition-all flex items-center justify-center gap-2 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Add custom procedure
            </button>
          ) : (
            <div className="border border-teal-200 bg-teal-50/30 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-teal-700 mb-2">Custom Procedure</p>
              <div className="flex gap-2 flex-wrap">
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Pasta / Filling / Cleaning" className="input flex-1 py-2 text-sm min-w-0"
                  onKeyDown={e => e.key === 'Enter' && addCustom()} />
                <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 bg-white">
                  <span className="text-slate-400 text-sm">₱</span>
                  <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                    placeholder="0" className="w-20 text-sm py-2 focus:outline-none" min="0" />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={addCustom} className="btn btn-primary btn-sm flex-1">Add</button>
                <button onClick={() => { setShowCustom(false); setCustomName(''); setCustomPrice('') }}
                  className="btn btn-secondary btn-sm flex-1">Cancel</button>
              </div>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Clinic Notes (optional)</label>
            <textarea value={clinicNotes} onChange={e => setClinicNotes(e.target.value)} rows={2}
              placeholder="e.g. Follow-up in 2 weeks, avoid cold drinks for 24hrs..." className="input resize-none text-sm" />
          </div>

          <div className="bg-slate-50 rounded-xl p-3 mb-5 flex items-center justify-between">
            <span className="text-slate-500 font-medium text-sm">Total Amount</span>
            <span className="font-display font-bold text-lg" style={{color:'var(--color-brand)'}}>₱{total.toLocaleString()}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary btn-md flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving || performed.length === 0} className="btn btn-primary btn-md flex-1">
              {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : '💾 Save Procedures'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppointmentRequests() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [clinicServices, setClinicServices] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [actionModal, setActionModal] = useState(null)
  const [actionType, setActionType] = useState(null)
  const [reason, setReason] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [processing, setProcessing] = useState(false)
  const [performedModal, setPerformedModal] = useState(null)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    const { data: c } = await supabase.from('clinics').select('id').eq('owner_id', user.id).maybeSingle()
    setClinic(c)
    if (!c) { setLoading(false); return }
    const [appts, services] = await Promise.all([
      supabase.from('appointments')
        .select('*, profiles!appointments_customer_id_fkey(full_name, email, phone, avatar_url), services(name, price, duration_minutes)')
        .eq('clinic_id', c.id).order('appointment_date', { ascending: true }),
      supabase.from('services').select('*').eq('clinic_id', c.id).eq('is_active', true)
    ])
    setAppointments(appts.data || [])
    setClinicServices(services.data || [])
    setLoading(false)
  }

  async function handleAction() {
    if (!actionModal) return
    setProcessing(true)
    const a = actionModal
    const updates = {
      accept: { status: 'accepted' }, decline: { status: 'rejected' }, complete: { status: 'completed' },
      reschedule: { status: 'rescheduled', rescheduled_date: rescheduleDate, rescheduled_time: rescheduleTime },
    }[actionType]
    const notifMessages = {
      accept:     { type: 'accepted',    title: '✅ Appointment Confirmed!',  msg: `Your appointment for ${a.services?.name} on ${format(new Date(a.appointment_date), 'MMM d, yyyy')} has been confirmed.` },
      decline:    { type: 'rejected',    title: '❌ Appointment Declined',    msg: `Your appointment for ${a.services?.name} was declined.${reason ? ` Reason: ${reason}` : ''}` },
      complete:   { type: 'completed',   title: '🏆 Appointment Completed',   msg: `Your appointment for ${a.services?.name} is complete. Please leave a review!` },
      reschedule: { type: 'rescheduled', title: '🔄 Reschedule Proposed',     msg: `Your appointment has been proposed to reschedule to ${format(new Date(rescheduleDate), 'MMM d, yyyy')}${rescheduleTime ? ' at ' + rescheduleTime : ''}.` },
    }[actionType]
    await supabase.from('appointments').update(updates).eq('id', a.id)
    await supabase.from('notifications').insert({ recipient_id: a.customer_id, type: notifMessages.type, title: notifMessages.title, message: notifMessages.msg, related_id: a.id })
    toast.success({ accept: 'Appointment confirmed!', decline: 'Appointment declined.', complete: 'Marked as completed!', reschedule: 'Reschedule proposed.' }[actionType])
    setActionModal(null); setReason(''); setRescheduleDate(''); setRescheduleTime('')
    loadData(); setProcessing(false)
  }

  async function handleSavePerformed(appointmentId, performedServices, clinicNotes) {
    const { error } = await supabase.from('appointments').update({ performed_services: performedServices, clinic_notes: clinicNotes }).eq('id', appointmentId)
    if (error) { toast.error(error.message); return }
    const appt = appointments.find(a => a.id === appointmentId)
    if (appt) {
      const total = performedServices.reduce((s, p) => s + (p.price || 0), 0)
      const names = performedServices.map(p => p.name).join(', ')
      await supabase.from('notifications').insert({
        recipient_id: appt.customer_id, type: 'completed',
        title: '📋 Visit Summary Updated',
        message: `Your visit on ${format(new Date(appt.appointment_date), 'MMM d')} — Procedures: ${names}. Total: ₱${total.toLocaleString()}.`,
        related_id: appointmentId
      })
    }
    toast.success('Procedures saved!'); setPerformedModal(null); loadData()
  }

  function openAction(appt, type) {
    setActionModal(appt); setActionType(type); setReason('')
    setRescheduleDate(appt.appointment_date); setRescheduleTime(appt.appointment_time || '')
  }

  const filtered = appointments.filter(a => {
    if (tab === 'pending')   return a.status === 'pending'
    if (tab === 'accepted')  return ['accepted', 'reschedule_accepted', 'rescheduled'].includes(a.status)
    if (tab === 'completed') return ['completed', 'rejected', 'cancelled'].includes(a.status)
    return true
  }).filter(a => !search || a.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) || a.services?.name?.toLowerCase().includes(search.toLowerCase()))

  const counts = {
    pending:   appointments.filter(a => a.status === 'pending').length,
    accepted:  appointments.filter(a => ['accepted', 'reschedule_accepted', 'rescheduled'].includes(a.status)).length,
    completed: appointments.filter(a => ['completed', 'rejected', 'cancelled'].includes(a.status)).length,
    all:       appointments.length
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}} /></div>

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Appointments</h1>
        <p className="page-subtitle">{appointments.length} total appointment{appointments.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 p-1 shadow-sm mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap px-2 ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={tab === t.key ? {backgroundColor:'var(--color-brand)'} : {}}>
            <span className="hidden sm:inline">{t.icon}</span> {t.label}
            {counts[t.key] > 0 && (
              <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{counts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input type="text" placeholder="Search by patient name or service..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center"><span className="text-4xl">📭</span><p className="text-slate-500 font-medium mt-3">No appointments found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
            const isPending   = a.status === 'pending'
            const isAccepted  = ['accepted', 'reschedule_accepted'].includes(a.status)
            const isCompleted = a.status === 'completed'
            const past        = isPast(new Date(a.appointment_date))
            const hasPerformed = a.performed_services?.length > 0
            const canEditProcedures = isCompleted || (isAccepted && past)

            return (
              <div key={a.id} className={`card p-5 transition-all hover:shadow-md ${isPending ? 'border-l-4 border-l-amber-400' : isAccepted ? 'border-l-4' : ''}`}
                style={isAccepted ? {borderLeftColor:'var(--color-brand)'} : {}}>
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden"
                    style={{backgroundColor:'var(--color-brand-light)',color:'var(--color-brand-text)'}}>
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
                        <p className="text-slate-400 text-xs mb-0.5">Booked</p>
                        <p className="font-semibold text-slate-700 text-sm">{a.services?.name}</p>
                        {a.services?.price && <p className="text-xs font-semibold" style={{color:'var(--color-brand)'}}>₱{parseFloat(a.services.price).toLocaleString()}</p>}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <p className="text-slate-400 text-xs mb-0.5">Date</p>
                        <p className="font-semibold text-slate-700 text-sm">{format(new Date(a.appointment_date), 'MMM d, yyyy')}</p>
                        {a.appointment_time && <p className="text-slate-500 text-xs">{a.appointment_time}</p>}
                      </div>
                      {hasPerformed && (
                        <div className="rounded-xl p-2.5 col-span-2" style={{backgroundColor:'var(--color-brand-light)'}}>
                          <p className="text-xs mb-1 font-semibold" style={{color:'var(--color-brand-text)'}}>✅ Procedures Performed</p>
                          <div className="flex flex-wrap gap-1">
                            {a.performed_services.map((p, i) => (
                              <span key={i} className="badge badge-teal" style={{fontSize:'0.65rem',padding:'0.1rem 0.4rem'}}>{p.name}</span>
                            ))}
                          </div>
                          <p className="text-xs font-bold mt-1" style={{color:'var(--color-brand-text)'}}>
                            Total: ₱{a.performed_services.reduce((s, p) => s + (p.price || 0), 0).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {a.clinic_notes && (
                        <div className="bg-slate-50 rounded-xl p-2.5 col-span-2">
                          <p className="text-slate-400 text-xs mb-0.5">Clinic Notes</p>
                          <p className="text-slate-600 text-xs">{a.clinic_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                      {isPending && <>
                        <button onClick={() => openAction(a, 'accept')} className="btn btn-primary btn-sm">✓ Accept</button>
                        <button onClick={() => openAction(a, 'reschedule')} className="btn btn-secondary btn-sm">🔄 Reschedule</button>
                        <button onClick={() => openAction(a, 'decline')} className="btn btn-secondary btn-sm text-red-500 hover:bg-red-50">✗ Decline</button>
                      </>}
                      {isAccepted && past && (
                        <button onClick={() => openAction(a, 'complete')} className="btn btn-primary btn-sm">🏆 Mark Completed</button>
                      )}
                      {canEditProcedures && (
                        <button onClick={() => setPerformedModal(a)}
                          className="btn btn-secondary btn-sm flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          {hasPerformed ? 'Edit Procedures' : '+ Add Procedures'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">New Date</label>
                  <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} className="input" /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">New Time</label>
                  <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="input" /></div>
              </div>
            )}
            {actionType === 'decline' && (
              <div className="mb-4"><label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason (optional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="e.g. Fully booked..." className="input resize-none" /></div>
            )}
            {actionType === 'complete' && (
              <div className="rounded-xl p-3 mb-4" style={{backgroundColor:'var(--color-brand-light)',border:`1px solid var(--color-brand-border)`}}>
                <p className="text-xs" style={{color:'var(--color-brand-text)'}}>The patient will be notified. You can add performed procedures after marking complete.</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-md flex-1">Cancel</button>
              <button onClick={handleAction} disabled={processing || (actionType === 'reschedule' && !rescheduleDate)}
                className={`btn btn-md flex-1 ${actionType === 'decline' ? 'btn-danger' : 'btn-primary'}`}>
                {processing
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Processing...</>
                  : { accept: 'Confirm', decline: 'Decline', complete: 'Mark Completed', reschedule: 'Propose New Time' }[actionType]}
              </button>
            </div>
          </div>
        </div>
      )}

      {performedModal && (
        <PerformedServicesModal
          appointment={performedModal}
          clinicServices={clinicServices}
          onSave={handleSavePerformed}
          onClose={() => setPerformedModal(null)}
        />
      )}
    </div>
  )
}