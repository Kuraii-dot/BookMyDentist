import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  format, isPast, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, isSameDay, parseISO, addDays, startOfToday,
} from 'date-fns'
import toast from 'react-hot-toast'
import { sendAppointmentEmail } from '../../lib/email'
import {
  Calendar, Clock, User, ChevronLeft, ChevronRight,
  AlertTriangle, Plus, X, CheckCircle2, XCircle, RefreshCw,
  Trophy, Stethoscope, Mail, Users, Timer, ClipboardList,
  Save, Zap, AlertCircle, ListChecks,
} from 'lucide-react'

const TABS = [
  { key: 'pending',   label: 'Pending',   Icon: Timer        },
  { key: 'upcoming',  label: 'Upcoming',  Icon: CheckCircle2 },
  { key: 'completed', label: 'Completed', Icon: Trophy       },
  { key: 'all',       label: 'All',       Icon: ClipboardList },
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

const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ appointments, onSelectDate, selectedDate, bookingWindowDays = 30 }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(new Date()))

  const maxMonth = startOfMonth(addDays(startOfToday(), bookingWindowDays))
  const minMonth = startOfMonth(new Date(Math.min(...appointments.map(a => new Date(a.appointment_date).getTime()), Date.now())))

  const days     = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  const firstDow = getDay(days[0])

  const countByDate = useMemo(() => {
    const map = {}
    appointments.forEach(a => { map[a.appointment_date] = (map[a.appointment_date] || 0) + 1 })
    return map
  }, [appointments])

  const canGoPrev = viewMonth > minMonth
  const canGoNext = viewMonth < maxMonth

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewMonth(m => addMonths(m, -1))} disabled={!canGoPrev}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:bg-sky-50">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <h3 className="font-display font-bold text-slate-800 text-sm">{format(viewMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setViewMonth(m => addMonths(m, 1))} disabled={!canGoNext}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:bg-sky-50">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 gap-3">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(day => {
          const dateStr    = format(day, 'yyyy-MM-dd')
          const count      = countByDate[dateStr] || 0
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isToday    = isSameDay(day, new Date())
          const isPastDay  = isPast(day) && !isToday
          return (
            <button key={dateStr}
              onClick={() => count > 0 ? onSelectDate(day) : null}
              className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all
                ${count > 0 ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}
                ${isSelected ? 'text-white shadow-md' : ''}
                ${isToday && !isSelected ? 'font-bold ring-2 ring-sky-400 ring-offset-1' : ''}
                ${isPastDay && !isSelected && count === 0 ? 'opacity-30' : ''}`}
              style={isSelected
                ? { background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' }
                : count > 0 ? { background: 'rgba(224,242,254,0.8)' } : {}}>
              <span className={`text-xs font-semibold ${isSelected ? 'text-white' : isToday ? 'text-sky-600' : 'text-slate-700'}`}>
                {format(day, 'd')}
              </span>
              {count > 0 && (
                <span className={`text-[10px] font-bold mt-0.5 w-4 h-4 rounded-full flex items-center justify-center
                  ${isSelected ? 'bg-white/30 text-white' : 'text-white'}`}
                  style={!isSelected ? { background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' } : {}}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' }} />
          has appointments
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-xl ring-2 ring-sky-400" />
          today
        </div>
      </div>
    </div>
  )
}

// ── Helper: get display name & services for an appointment ────────────────────
function getApptServices(a) {
  // Multi-service appointments store selected_services as JSON array
  if (a.selected_services && Array.isArray(a.selected_services) && a.selected_services.length > 0) {
    return a.selected_services
  }
  // Fallback: single service from the join
  if (a.services) {
    return [{ name: a.services.name, price: a.services.price, duration_minutes: a.services.duration_minutes }]
  }
  return []
}

function getApptTotalDuration(a) {
  const svcs = getApptServices(a)
  return svcs.reduce((sum, s) => sum + (s.duration_minutes || 30), 0)
}

function getApptTotalPrice(a) {
  const svcs = getApptServices(a)
  return svcs.reduce((sum, s) => sum + parseFloat(s.price || 0), 0)
}

function formatTime12(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function getApptEndTime(a) {
  if (!a.appointment_time) return null
  const [h, m]    = a.appointment_time.split(':').map(Number)
  const startMin  = h * 60 + m
  const totalMins = getApptTotalDuration(a)
  const endMin    = startMin + totalMins
  const endH      = Math.floor(endMin / 60)
  const endM      = endMin % 60
  const ampm      = endH >= 12 ? 'PM' : 'AM'
  const endH12    = endH === 0 ? 12 : endH > 12 ? endH - 12 : endH
  return `${endH12}:${endM.toString().padStart(2, '0')} ${ampm}`
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function ApptCard({ a, onAction, onProcedures }) {
  const st          = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
  const isPending   = a.status === 'pending'
  const isAccepted  = ['accepted','reschedule_accepted'].includes(a.status)
  const isCompleted = a.status === 'completed'
  const past        = isPast(new Date(a.appointment_date))
  const hasPerformed     = a.performed_services?.length > 0
  const canEditProcedures = isCompleted || (isAccepted && past)
  const isWalkIn    = a.is_walk_in

  const name    = isWalkIn ? a.guest_name    : a.profiles?.full_name
  const contact = isWalkIn ? a.guest_contact : a.profiles?.email

  const apptServices   = getApptServices(a)
  const totalDuration  = getApptTotalDuration(a)
  const totalPrice     = getApptTotalPrice(a)
  const endTime        = getApptEndTime(a)
  const isMultiService = apptServices.length > 1

  return (
    <div className={`rounded-2xl border p-4 transition-all hover:shadow-sm bg-white
      ${isPending  ? 'border-l-4 border-l-amber-400 border-slate-100' : ''}
      ${isAccepted ? 'border-l-4 border-sky-400 border-slate-100'    : ''}
      ${!isPending && !isAccepted ? 'border-slate-100' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: 'rgba(224,242,254,0.8)' }}>
          {!isWalkIn && a.profiles?.avatar_url
            ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            : isWalkIn
              ? <Users className="w-4 h-4 text-sky-400" />
              : <User  className="w-4 h-4 text-sky-400" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-slate-900 text-sm">{name}</p>
                {isWalkIn && <span className="badge badge-info text-[10px] px-1.5 py-0.5">Walk-in</span>}
              </div>
              <p className="text-xs text-slate-400">{contact}</p>
            </div>
            <span className={`badge ${st.class} shrink-0`}>{st.label}</span>
          </div>

          {/* Services display */}
          <div className="mt-1.5">
            {isMultiService ? (
              <div className="space-y-0.5">
                {apptServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-sky-600">{s.name}</span>
                    <span className="text-slate-400">₱{parseFloat(s.price || 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 mt-1">
                  <span className="text-slate-500 font-semibold">{apptServices.length} services · {totalDuration} min total</span>
                  <span className="font-bold text-slate-700">₱{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="font-semibold text-sky-600">{apptServices[0]?.name || a.guest_procedure}</span>
                {apptServices[0]?.price && (
                  <span className="font-semibold">₱{parseFloat(apptServices[0].price).toLocaleString()}</span>
                )}
              </div>
            )}
          </div>

          {/* Time info */}
          {a.appointment_time && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{formatTime12(a.appointment_time)}</span>
              {endTime && (
                <>
                  <span>–</span>
                  <span>{endTime}</span>
                  <span className="text-slate-300">({totalDuration} min)</span>
                </>
              )}
              {isCompleted && a.completed_at && (
                <span className="ml-1 text-emerald-500 font-medium">
                  · Done at {formatTime12(format(new Date(a.completed_at), 'HH:mm'))}
                </span>
              )}
            </div>
          )}

          {isWalkIn && (a.guest_age || a.guest_gender) && (
            <div className="flex gap-2 mt-1 text-xs text-slate-400">
              {a.guest_age    && <span>Age: {a.guest_age}</span>}
              {a.guest_gender && <span>· {a.guest_gender}</span>}
            </div>
          )}

          {hasPerformed && (
            <div className="mt-2 p-2 rounded-lg bg-sky-50 border border-sky-100">
              <div className="flex flex-wrap gap-1">
                {a.performed_services.map((p, i) => (
                  <span key={i} className="badge badge-teal" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>{p.name}</span>
                ))}
              </div>
              <p className="text-xs font-bold text-sky-700 mt-1">
                Total: ₱{a.performed_services.reduce((s, p) => s + (p.price || 0), 0).toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
            {isPending && (
              <>
                <button onClick={() => onAction(a, 'accept')}
                  className="btn btn-primary btn-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                </button>
                <button onClick={() => onAction(a, 'reschedule')}
                  className="btn btn-secondary btn-sm flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                </button>
                <button onClick={() => onAction(a, 'decline')}
                  className="btn btn-secondary btn-sm text-red-500 hover:bg-red-50 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Decline
                </button>
              </>
            )}
            {isAccepted && past && (
              <button onClick={() => onAction(a, 'complete')}
                className="btn btn-primary btn-sm flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Complete
              </button>
            )}
            {canEditProcedures && (
              <button onClick={() => onProcedures(a)}
                className="btn btn-secondary btn-sm flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                {hasPerformed ? 'Edit Procedures' : 'Add Procedures'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Performed Services Modal ──────────────────────────────────────────────────
function PerformedServicesModal({ appointment, clinicServices, onSave, onClose }) {
  // Pre-populate from selected_services or the single booked service
  const defaultPerformed = () => {
    if (appointment.performed_services?.length) return appointment.performed_services
    const svcs = getApptServices(appointment)
    return svcs.map(s => ({
      service_id: s.service_id || appointment.service_id,
      name: s.name,
      price: parseFloat(s.price || 0),
      custom: false,
    }))
  }

  const [performed, setPerformed]     = useState(defaultPerformed)
  const [clinicNotes, setClinicNotes] = useState(appointment.clinic_notes || '')
  const [saving, setSaving]           = useState(false)
  const [showCustom, setShowCustom]   = useState(false)
  const [customName, setCustomName]   = useState('')
  const [customPrice, setCustomPrice] = useState('')

  const total = performed.reduce((s, p) => s + (p.price || 0), 0)

  function addFromCatalog(svc) {
    if (performed.find(p => p.service_id === svc.id)) { toast.error('Already added'); return }
    setPerformed(p => [...p, { service_id: svc.id, name: svc.name, price: parseFloat(svc.price || 0), custom: false }])
  }
  function addCustom() {
    if (!customName.trim()) { toast.error('Enter a name'); return }
    setPerformed(p => [...p, { name: customName.trim(), price: parseFloat(customPrice) || 0, custom: true }])
    setCustomName(''); setCustomPrice(''); setShowCustom(false)
  }
  function remove(i)         { setPerformed(p => p.filter((_, j) => j !== i)) }
  function updatePrice(i, v) { setPerformed(p => p.map((x, j) => j === i ? { ...x, price: parseFloat(v) || 0 } : x)) }

  async function handleSave() {
    if (!performed.length) { toast.error('Add at least one procedure'); return }
    setSaving(true)
    await onSave(appointment.id, performed, clinicNotes)
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">Procedures Performed</h3>
              <p className="text-slate-400 text-sm mt-0.5">
                {appointment.is_walk_in ? appointment.guest_name : appointment.profiles?.full_name}
                {' · '}{format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {performed.map((p, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl p-3 bg-white/60 border border-white/80">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                    {p.custom && <span className="badge badge-info text-[10px]">Custom</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs">₱</span>
                  <input type="number" value={p.price} onChange={e => updatePrice(i, e.target.value)} min="0"
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right font-semibold focus:outline-none focus:border-sky-400" />
                  <button onClick={() => remove(i)}
                    className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Add from services</p>
            <div className="flex flex-wrap gap-1.5">
              {clinicServices.filter(s => !performed.find(p => p.service_id === s.id)).map(s => (
                <button key={s.id} onClick={() => addFromCatalog(s)}
                  className="btn btn-secondary btn-sm flex items-center gap-1">
                  <Plus className="w-3 h-3" />{s.name}
                </button>
              ))}
            </div>
          </div>

          {!showCustom ? (
            <button onClick={() => setShowCustom(true)}
              className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 mb-4"
              style={{ border: '1.5px dashed rgba(186,230,253,0.8)', color: '#94a3b8', background: 'rgba(255,255,255,0.3)' }}>
              <Plus className="w-4 h-4" /> Add custom procedure
            </button>
          ) : (
            <div className="border border-sky-200 bg-sky-50/30 rounded-xl p-3 mb-4">
              <div className="flex gap-2 flex-wrap">
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                  placeholder="Procedure name" className="input flex-1 py-2 text-sm min-w-0"
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Clinic Notes</label>
            <textarea value={clinicNotes} onChange={e => setClinicNotes(e.target.value)} rows={2}
              placeholder="Follow-up instructions, notes..." className="input resize-none text-sm" />
          </div>

          <div className="rounded-xl p-3 mb-5 flex items-center justify-between">
            <span className="text-slate-500 font-medium text-sm">Total</span>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--color-brand)' }}>₱{total.toLocaleString()}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary btn-md flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving || !performed.length} className="btn btn-primary btn-md flex-1 flex items-center justify-center gap-2">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
                : <><Save className="w-4 h-4" />Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Walk-in Modal ─────────────────────────────────────────────────────────────
function WalkInModal({ clinic, clinicServices, availability, onClose, onSaved }) {
  const [form, setForm] = useState({
    guest_name: '', guest_contact: '', guest_age: '', guest_gender: '',
    service_id: '', date: '', time: '',
  })
  const [saving, setSaving] = useState(false)
  const today         = format(new Date(), 'yyyy-MM-dd')
  const bookingWindow = availability?.booking_window_days || 30
  const maxDate       = format(addDays(startOfToday(), bookingWindow), 'yyyy-MM-dd')

  const timeSlots = useMemo(() => {
    if (!form.date || !availability?.schedule) return []
    const d      = parseISO(form.date)
    const dayKey = DAY_KEYS[getDay(d)]
    const sched  = availability.schedule[dayKey]
    if (!sched?.enabled) return []
    const slots = []
    const [oh, om] = sched.open.split(':').map(Number)
    const [ch, cm] = sched.close.split(':').map(Number)
    const dur = availability.slot_duration || 30
    let cur   = oh * 60 + om
    const end = ch * 60 + cm
    while (cur + dur <= end) {
      const hh   = Math.floor(cur / 60).toString().padStart(2, '0')
      const mm   = (cur % 60).toString().padStart(2, '0')
      const h12  = cur >= 720 ? Math.floor(cur / 60) - 12 || 12 : Math.floor(cur / 60) || 12
      const ampm = cur >= 720 ? 'PM' : 'AM'
      slots.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${ampm}` })
      cur += dur
    }
    return slots
  }, [form.date, availability])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave() {
    if (!form.guest_name.trim() || !form.service_id || !form.date || !form.time) {
      toast.error('Fill in name, service, date and time'); return
    }
    setSaving(true)
    const svc = clinicServices.find(s => s.id === form.service_id)
    const selectedServicesData = svc ? [{
      service_id: svc.id,
      name: svc.name,
      price: parseFloat(svc.price || 0),
      duration_minutes: svc.duration_minutes || 30,
    }] : []

    const { error } = await supabase.from('appointments').insert({
      clinic_id:         clinic.id,
      service_id:        form.service_id,
      selected_services: selectedServicesData,
      customer_id:       null,
      is_walk_in:        true,
      guest_name:        form.guest_name.trim(),
      guest_contact:     form.guest_contact.trim(),
      guest_age:         form.guest_age ? parseInt(form.guest_age) : null,
      guest_gender:      form.guest_gender || null,
      appointment_date:  form.date,
      appointment_time:  form.time,
      status: 'accepted',
      notes: `Walk-in: ${form.guest_name}. Procedure: ${svc?.name}`,
    })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Walk-in appointment added!')
    onSaved(); onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-500" /> Walk-in Appointment
              </h3>
              <p className="text-slate-400 text-sm mt-0.5">Manually add a walk-in or phone booking</p>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
              <input value={form.guest_name} onChange={e => set('guest_name', e.target.value)}
                placeholder="Patient's full name" className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contact (email or phone)</label>
              <input value={form.guest_contact} onChange={e => set('guest_contact', e.target.value)}
                placeholder="09XX-XXX-XXXX or email@example.com" className="input text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
                <input type="number" value={form.guest_age} onChange={e => set('guest_age', e.target.value)}
                  placeholder="e.g. 28" min="1" max="120" className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                <select value={form.guest_gender} onChange={e => set('guest_gender', e.target.value)} className="input text-sm">
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option>
                  <option>Other</option><option>Prefer not to say</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Procedure / Service *</label>
              <select value={form.service_id} onChange={e => set('service_id', e.target.value)} className="input text-sm">
                <option value="">Select service</option>
                {clinicServices.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — ₱{parseFloat(s.price || 0).toLocaleString()}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                <input type="date" value={form.date} onChange={e => { set('date', e.target.value); set('time', '') }}
                  min={today} max={maxDate} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Time *</label>
                {timeSlots.length > 0 ? (
                  <select value={form.time} onChange={e => set('time', e.target.value)} className="input text-sm">
                    <option value="">Select slot</option>
                    {timeSlots.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                ) : (
                  <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="input text-sm" />
                )}
              </div>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <p className="text-sky-700 text-xs">Walk-in appointments are automatically marked as <strong>Confirmed</strong>.</p>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="btn btn-secondary btn-md flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-md flex-1 flex items-center justify-center gap-2">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Adding...</>
                : <><Plus className="w-4 h-4" />Add Walk-in</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Emergency Closure Modal ───────────────────────────────────────────────────
function EmergencyClosureModal({ appointments, clinicName, onClose, onDone }) {
  const today         = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [decisions, setDecisions]       = useState({})
  const [newDates, setNewDates]         = useState({})
  const [processing, setProcessing]     = useState(false)

  const affectedAppts = appointments.filter(a =>
    a.appointment_date === selectedDate &&
    ['pending','accepted','reschedule_accepted'].includes(a.status)
  )

  function setDecision(id, val) { setDecisions(p => ({ ...p, [id]: val })) }
  function setNewDate(id, val)  { setNewDates(p => ({ ...p, [id]: val })) }

  async function handleSubmit() {
    const undecided = affectedAppts.filter(a => !decisions[a.id])
    if (undecided.length) { toast.error(`Please decide for all ${undecided.length} appointment(s)`); return }
    const reschedules = affectedAppts.filter(a => decisions[a.id] === 'reschedule' && !newDates[a.id])
    if (reschedules.length) { toast.error('Pick a new date for all rescheduled appointments'); return }

    setProcessing(true)
    for (const a of affectedAppts) {
      const decision     = decisions[a.id]
      const patientName  = a.is_walk_in ? a.guest_name : a.profiles?.full_name
      const patientEmail = a.is_walk_in ? null : a.profiles?.email

      if (decision === 'cancel') {
        await supabase.from('appointments').update({
          status: 'cancelled', cancelled_by: 'clinic',
          cancel_reason: `Emergency closure on ${format(parseISO(selectedDate), 'MMMM d, yyyy')}. We sincerely apologize.`,
        }).eq('id', a.id)
        if (a.customer_id) {
          await supabase.from('notifications').insert({
            recipient_id: a.customer_id, type: 'rejected',
            title: 'Appointment Cancelled — Emergency',
            message: `Your appointment on ${format(parseISO(selectedDate), 'MMMM d, yyyy')} at ${a.appointment_time} was cancelled due to an emergency closure. We sincerely apologize.`,
            related_id: a.id,
          })
        }
        if (patientEmail) {
          sendAppointmentEmail({
            to: patientEmail,
            subject: `Important: Your appointment on ${format(parseISO(selectedDate), 'MMM d')} has been cancelled`,
            patientName, clinicName, serviceName: a.services?.name,
            date: format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy'),
            time: a.appointment_time, status: 'rejected',
            reason: 'Emergency closure — we sincerely apologize for the inconvenience.',
          }).catch(console.warn)
        }
      } else {
        const newDate = newDates[a.id]
        await supabase.from('appointments').update({
          status: 'rescheduled', rescheduled_date: newDate, rescheduled_time: a.appointment_time,
        }).eq('id', a.id)
        if (a.customer_id) {
          await supabase.from('notifications').insert({
            recipient_id: a.customer_id, type: 'rescheduled',
            title: 'Emergency Reschedule',
            message: `Your appointment on ${format(parseISO(selectedDate), 'MMM d')} has been rescheduled to ${format(parseISO(newDate), 'MMMM d, yyyy')} due to an emergency closure.`,
            related_id: a.id,
          })
        }
        if (patientEmail) {
          sendAppointmentEmail({
            to: patientEmail,
            subject: `Your appointment has been rescheduled — ${clinicName}`,
            patientName, clinicName, serviceName: a.services?.name,
            date: format(parseISO(newDate), 'EEEE, MMMM d, yyyy'),
            time: a.appointment_time, status: 'rescheduled',
            reason: 'Emergency closure on original date — we apologize for the inconvenience.',
          }).catch(console.warn)
        }
      }
    }
    toast.success(`${affectedAppts.length} appointment(s) handled`)
    setProcessing(false)
    onDone(); onClose()
  }

  const minNewDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Emergency Closure
              </h3>
              <p className="text-slate-400 text-sm mt-0.5">Handle appointments affected by an unexpected closure</p>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-xs font-medium">
              For each affected appointment, choose to cancel or reschedule. Patients will be notified by email and in-app notification.
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Closure Date</label>
            <input type="date" value={selectedDate}
              onChange={e => { setSelectedDate(e.target.value); setDecisions({}); setNewDates({}) }}
              className="input text-sm" />
          </div>

          {affectedAppts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">No active appointments on this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {affectedAppts.map(a => {
                const name     = a.is_walk_in ? a.guest_name : a.profiles?.full_name
                const decision = decisions[a.id]
                const svcs     = getApptServices(a)
                return (
                  <div key={a.id} className="border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                        <User className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{name}</p>
                        <p className="text-xs text-slate-400">
                          {svcs.map(s => s.name).join(', ')} · {a.appointment_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button onClick={() => setDecision(a.id, 'cancel')}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5
                          ${decision === 'cancel' ? 'bg-red-500 text-white border-red-500' : 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500'}`}>
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button onClick={() => setDecision(a.id, 'reschedule')}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5
                          ${decision === 'reschedule' ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-500'}`}
                        style={decision === 'reschedule' ? { backgroundColor: 'var(--color-brand)' } : {}}>
                        <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                      </button>
                    </div>
                    {decision === 'reschedule' && (
                      <div className="animate-fade-in">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">New date for this patient</label>
                        <input type="date" value={newDates[a.id] || ''} onChange={e => setNewDate(a.id, e.target.value)}
                          min={minNewDate} className="input text-sm" />
                        <p className="text-xs text-slate-400 mt-1">Patient will be asked to confirm or decline the new date.</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {affectedAppts.length > 0 && (
            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="btn btn-secondary btn-md flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={processing} className="btn btn-danger btn-md flex-1 flex items-center justify-center gap-2">
                {processing
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Processing...</>
                  : <><AlertTriangle className="w-4 h-4" />Handle {affectedAppts.length} Appointment{affectedAppts.length > 1 ? 's' : ''}</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AppointmentRequests() {
  const { user } = useAuth()
  const [clinic, setClinic]               = useState(null)
  const [clinicServices, setClinicServices] = useState([])
  const [appointments, setAppointments]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [tab, setTab]                     = useState('pending')
  const [selectedDate, setSelectedDate]   = useState(null)
  const [actionModal, setActionModal]     = useState(null)
  const [actionType, setActionType]       = useState(null)
  const [reason, setReason]               = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [processing, setProcessing]       = useState(false)
  const [performedModal, setPerformedModal] = useState(null)
  const [showWalkIn, setShowWalkIn]       = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)
  const [search, setSearch]               = useState('')

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    const { data: c } = await supabase.from('clinics').select('id, name, availability').eq('owner_id', user.id).maybeSingle()
    setClinic(c)
    if (!c) { setLoading(false); return }
    const [appts, services] = await Promise.all([
      supabase.from('appointments')
        .select('*, profiles!appointments_customer_id_fkey(full_name,email,phone,avatar_url), services(name,price,duration_minutes)')
        .eq('clinic_id', c.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true }),
      supabase.from('services').select('*').eq('clinic_id', c.id).eq('is_active', true),
    ])
    setAppointments(appts.data || [])
    setClinicServices(services.data || [])
    setLoading(false)
  }

  async function handleAction() {
    if (!actionModal) return
    setProcessing(true)
    const a            = actionModal
    const clinicName   = clinic?.name || 'Your clinic'
    const patientEmail = a.is_walk_in ? null : a.profiles?.email
    const patientName  = a.is_walk_in ? a.guest_name : a.profiles?.full_name
    const svcs         = getApptServices(a)
    const serviceName  = svcs.map(s => s.name).join(', ') || 'appointment'
    const dateStr      = format(new Date(a.appointment_date), 'EEEE, MMMM d, yyyy')

    // ── KEY CHANGE: store completed_at timestamp so slot reopening works ──
    const updates = {
      accept:     { status: 'accepted' },
      decline:    { status: 'rejected', rejection_reason: reason },
      complete:   { status: 'completed', completed_at: new Date().toISOString() },
      reschedule: { status: 'rescheduled', rescheduled_date: rescheduleDate, rescheduled_time: rescheduleTime },
    }[actionType]

    const notifMap = {
      accept:     { type: 'accepted',    title: 'Appointment Confirmed',  msg: `Your ${serviceName} on ${format(new Date(a.appointment_date), 'MMM d, yyyy')} is confirmed.` },
      decline:    { type: 'rejected',    title: 'Appointment Declined',   msg: `Your ${serviceName} was declined.${reason ? ` Reason: ${reason}` : ''}` },
      complete:   { type: 'completed',   title: 'Appointment Completed',  msg: `Your ${serviceName} is complete. Please leave a review!` },
      reschedule: { type: 'rescheduled', title: 'Reschedule Proposed',    msg: `Your appointment has been proposed to reschedule to ${format(new Date(rescheduleDate), 'MMM d, yyyy')}${rescheduleTime ? ' at ' + rescheduleTime : ''}.` },
    }[actionType]

    await supabase.from('appointments').update(updates).eq('id', a.id)
    if (a.customer_id) {
      await supabase.from('notifications').insert({
        recipient_id: a.customer_id, type: notifMap.type,
        title: notifMap.title, message: notifMap.msg, related_id: a.id,
      })
    }

    if (patientEmail) {
      const subjects = {
        accept:     `Appointment Confirmed — ${clinicName}`,
        decline:    `Update on your appointment — ${clinicName}`,
        complete:   `Visit Complete — ${clinicName}`,
        reschedule: `Reschedule Proposed — ${clinicName}`,
      }
      const displayDate = actionType === 'reschedule' && rescheduleDate ? format(new Date(rescheduleDate), 'EEEE, MMMM d, yyyy') : dateStr
      const displayTime = actionType === 'reschedule' && rescheduleTime ? rescheduleTime : a.appointment_time
      sendAppointmentEmail({
        to: patientEmail, subject: subjects[actionType],
        patientName, clinicName, serviceName,
        date: displayDate, time: displayTime, status: actionType,
        reason: actionType === 'decline' && reason ? reason : undefined,
      }).catch(err => console.warn('Email failed:', err))
    }

    toast.success({
      accept:     'Confirmed!',
      decline:    'Declined.',
      complete:   'Marked complete! Slot reopened for new bookings.',
      reschedule: 'Reschedule proposed.',
    }[actionType])

    setActionModal(null); setReason(''); setRescheduleDate(''); setRescheduleTime('')
    loadData(); setProcessing(false)
  }

  async function handleSavePerformed(appointmentId, performedServices, clinicNotes) {
    const { error } = await supabase.from('appointments')
      .update({ performed_services: performedServices, clinic_notes: clinicNotes }).eq('id', appointmentId)
    if (error) { toast.error(error.message); return }
    const appt = appointments.find(a => a.id === appointmentId)
    if (appt?.customer_id) {
      const total = performedServices.reduce((s, p) => s + (p.price || 0), 0)
      const names = performedServices.map(p => p.name).join(', ')
      await supabase.from('notifications').insert({
        recipient_id: appt.customer_id, type: 'completed',
        title: 'Visit Summary Updated',
        message: `Your visit on ${format(new Date(appt.appointment_date), 'MMM d')} — ${names}. Total: ₱${total.toLocaleString()}.`,
        related_id: appointmentId,
      })
    }
    toast.success('Procedures saved!'); setPerformedModal(null); loadData()
  }

  function openAction(appt, type) {
    setActionModal(appt); setActionType(type); setReason('')
    setRescheduleDate(appt.appointment_date); setRescheduleTime(appt.appointment_time || '')
  }

  const pendingAppts   = appointments.filter(a => a.status === 'pending')
  const upcomingAppts  = appointments.filter(a => ['accepted','reschedule_accepted','rescheduled'].includes(a.status))
  const completedAppts = appointments.filter(a => ['completed','rejected','cancelled'].includes(a.status))

  const calendarAppts     = tab === 'pending' ? pendingAppts : upcomingAppts
  const selectedDateAppts = selectedDate
    ? calendarAppts.filter(a => a.appointment_date === format(selectedDate, 'yyyy-MM-dd'))
    : []

  const listAppts = (tab === 'completed' ? completedAppts : appointments).filter(a =>
    !search ||
    (a.profiles?.full_name || a.guest_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (getApptServices(a).map(s => s.name).join(' ') || '').toLowerCase().includes(search.toLowerCase())
  )

  const bookingWindow  = clinic?.availability?.booking_window_days || 30
  const isCalendarTab  = tab === 'pending' || tab === 'upcoming'
  const counts = {
    pending:   pendingAppts.length,
    upcoming:  upcomingAppts.length,
    completed: completedAppts.length,
    all:       appointments.length,
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">{appointments.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowWalkIn(true)}
            className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Walk-in
          </button>
          <button onClick={() => setShowEmergency(true)}
            className="btn btn-sm flex items-center gap-1.5 text-red-500"
            style={{ border: '1px solid #fecaca', background: 'rgba(254,242,242,0.5)' }}>
            <AlertTriangle className="w-4 h-4" /> Emergency Closure
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 card p-1 mb-5 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelectedDate(null) }}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap px-2
              ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={tab === t.key ? { backgroundColor: 'var(--color-brand)' } : {}}>
            <t.Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            {counts[t.key] > 0 && (
              <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center
                ${tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Calendar view (pending + upcoming tabs) */}
      {isCalendarTab && (
        <div className="space-y-5">
          {calendarAppts.length === 0 ? (
            <div className="card p-14 text-center">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No {tab} appointments</p>
            </div>
          ) : (
            <>
              <MiniCalendar
                appointments={calendarAppts}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                bookingWindowDays={bookingWindow}
              />
              {selectedDate ? (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-500" />
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      <span className="badge badge-teal">{selectedDateAppts.length}</span>
                    </h3>
                    <button onClick={() => setSelectedDate(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold">Clear</button>
                  </div>
                  {selectedDateAppts.length === 0 ? (
                    <div className="card p-8 text-center">
                      <p className="text-slate-400 text-sm">No {tab} appointments on this date</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateAppts.map(a => (
                        <ApptCard key={a.id} a={a} onAction={openAction} onProcedures={setPerformedModal} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card p-6 text-center border-dashed">
                  <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Click a highlighted date to see appointments</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* List view (completed + all tabs) */}
      {!isCalendarTab && (
        <div>
          <div className="relative mb-5">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by patient name or service..."
              value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          {listAppts.length === 0 ? (
            <div className="card p-12 text-center">
              <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listAppts.map(a => (
                <ApptCard key={a.id} a={a} onAction={openAction} onProcedures={setPerformedModal} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="modal-backdrop" onClick={() => setActionModal(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-slate-900 text-lg mb-1 flex items-center gap-2">
              {actionType === 'accept'     && <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Confirm Appointment</>}
              {actionType === 'decline'    && <><XCircle      className="w-5 h-5 text-red-500"     /> Decline Appointment</>}
              {actionType === 'complete'   && <><Trophy       className="w-5 h-5 text-violet-500"  /> Mark Complete</>}
              {actionType === 'reschedule' && <><RefreshCw    className="w-5 h-5 text-blue-500"    /> Reschedule</>}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {actionModal.is_walk_in ? actionModal.guest_name : actionModal.profiles?.full_name}
              {' · '}{getApptServices(actionModal).map(s => s.name).join(', ')}<br />
              {format(new Date(actionModal.appointment_date), 'EEEE, MMMM d, yyyy')}
              {actionModal.appointment_time && ` · ${formatTime12(actionModal.appointment_time)}`}
              {getApptEndTime(actionModal) && ` – ${getApptEndTime(actionModal)}`}
            </p>

            {!actionModal.is_walk_in && actionModal.profiles?.email && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                style={{ background: 'rgba(220,252,231,0.5)', border: '1px solid rgba(134,239,172,0.5)' }}>
                <Mail className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-green-700 text-xs font-medium">
                  Email will be sent to <strong>{actionModal.profiles.email}</strong>
                </p>
              </div>
            )}

            {actionType === 'complete' && (
              <div className="rounded-xl p-3 mb-4 bg-violet-50 border border-violet-200">
                <p className="text-xs text-violet-700 font-medium">
                  ✓ Marking complete now will release this time slot for new bookings immediately — even if the scheduled end time hasn't passed yet.
                </p>
              </div>
            )}

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

            {actionType === 'decline' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason (optional)</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                  placeholder="e.g. Fully booked..." className="input resize-none" />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-md flex-1">Cancel</button>
              <button onClick={handleAction}
                disabled={processing || (actionType === 'reschedule' && !rescheduleDate)}
                className={`btn btn-md flex-1 flex items-center justify-center gap-2 ${actionType === 'decline' ? 'btn-danger' : 'btn-primary'}`}>
                {processing
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Processing...</>
                  : <>
                      {actionType === 'accept'     && <><CheckCircle2 className="w-4 h-4" />Confirm</>}
                      {actionType === 'decline'    && <><XCircle      className="w-4 h-4" />Decline</>}
                      {actionType === 'complete'   && <><Trophy       className="w-4 h-4" />Mark Complete</>}
                      {actionType === 'reschedule' && <><RefreshCw    className="w-4 h-4" />Propose</>}
                    </>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      {performedModal && (
        <PerformedServicesModal appointment={performedModal} clinicServices={clinicServices}
          onSave={handleSavePerformed} onClose={() => setPerformedModal(null)} />
      )}
      {showWalkIn && clinic && (
        <WalkInModal clinic={clinic} clinicServices={clinicServices} availability={clinic.availability}
          onClose={() => setShowWalkIn(false)} onSaved={loadData} />
      )}
      {showEmergency && (
        <EmergencyClosureModal appointments={appointments} clinicName={clinic?.name}
          onClose={() => setShowEmergency(false)} onDone={loadData} />
      )}
    </div>
  )
}