import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, addDays, startOfToday, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const DAYS = [
  { key: 'monday',    label: 'Monday'    },
  { key: 'tuesday',   label: 'Tuesday'   },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday'  },
  { key: 'friday',    label: 'Friday'    },
  { key: 'saturday',  label: 'Saturday'  },
  { key: 'sunday',    label: 'Sunday'    },
]

const TABS = [
  { key: 'hours',    label: 'Weekly Hours',   icon: '🕐' },
  { key: 'dates',    label: 'Date Overrides', icon: '📅' },
  { key: 'settings', label: 'Booking Rules',  icon: '⚙️' },
  { key: 'vacation', label: 'Vacation Mode',  icon: '🏖️' },
]

// Format HH:MM (24hr) → 12hr label for display
function fmt12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m.toString().padStart(2,'0')} ${ampm}`
}

// How many slots does a day generate?
function countSlots(open, close, duration) {
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  const mins = (ch * 60 + cm) - (oh * 60 + om)
  return Math.max(0, Math.floor(mins / duration))
}

function Toggle({ on, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!on)} role="switch" aria-checked={on}
      className="relative rounded-full transition-colors shrink-0 focus:outline-none"
      style={{ width: 50, height: 24, backgroundColor: on ? 'var(--color-brand)' : '#e2e8f0' }}>
      <span className={`absolute right-8 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${on ? 'translate-x-7' : 'translate-x-0.5'}`} />
    </button>
  )
}

// Free-form time input — any time, not locked to 30-min intervals
function TimeInput({ value, onChange, label }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-slate-400">{label}</span>}
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input !w-auto !py-1.5 text-sm"
        style={{minWidth:'110px'}}
      />
    </div>
  )
}

export default function ClinicAvailability() {
  const { user } = useAuth()
  const [clinic, setClinic]   = useState(null)
  const [tab, setTab]         = useState('hours')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  // Weekly schedule
  const [schedule, setSchedule] = useState(() =>
    Object.fromEntries(DAYS.map(d => [d.key, { open: '09:00', close: '18:00', enabled: false }]))
  )
  const [slotDuration, setSlotDuration] = useState(30)
  const [hasBreak, setHasBreak]         = useState(false)
  const [breakStart, setBreakStart]     = useState('12:00')
  const [breakEnd, setBreakEnd]         = useState('13:00')

  // Date overrides
  const [blockedDates, setBlockedDates]       = useState([])
  const [specialDates, setSpecialDates]       = useState([])
  const [newBlockDate, setNewBlockDate]       = useState('')
  const [newBlockNote, setNewBlockNote]       = useState('')
  const [newSpecialDate, setNewSpecialDate]   = useState('')
  const [newSpecialOpen, setNewSpecialOpen]   = useState('09:00')
  const [newSpecialClose, setNewSpecialClose] = useState('17:00')
  const [newSpecialNote, setNewSpecialNote]   = useState('')
  const [showAddSpecial, setShowAddSpecial]   = useState(false)

  // Booking rules
  const [maxPerSlot, setMaxPerSlot]                 = useState(1)
  const [advanceNoticeHours, setAdvanceNoticeHours] = useState(2)
  const [bookingWindowDays, setBookingWindowDays]   = useState(30)

  // Vacation mode
  const [vacationMode, setVacationMode]       = useState(false)
  const [vacationMessage, setVacationMessage] = useState('')
  const [vacationFrom, setVacationFrom]       = useState('')
  const [vacationTo, setVacationTo]           = useState('')

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    const { data: c } = await supabase.from('clinics').select('id, availability').eq('owner_id', user.id).maybeSingle()
    setClinic(c)
    if (c?.availability) {
      const av = c.availability
      if (av.schedule)                          setSchedule(prev => ({ ...prev, ...av.schedule }))
      if (av.slot_duration)                     setSlotDuration(av.slot_duration)
      if (av.has_break !== undefined)           setHasBreak(av.has_break)
      if (av.break_start)                       setBreakStart(av.break_start)
      if (av.break_end)                         setBreakEnd(av.break_end)
      if (av.blocked_dates)                     setBlockedDates(av.blocked_dates)
      if (av.special_dates)                     setSpecialDates(av.special_dates)
      if (av.max_per_slot)                      setMaxPerSlot(av.max_per_slot)
      if (av.advance_notice_hours !== undefined) setAdvanceNoticeHours(av.advance_notice_hours)
      if (av.booking_window_days)               setBookingWindowDays(av.booking_window_days)
      if (av.vacation_mode !== undefined)       setVacationMode(av.vacation_mode)
      if (av.vacation_message)                  setVacationMessage(av.vacation_message)
      if (av.vacation_from)                     setVacationFrom(av.vacation_from)
      if (av.vacation_to)                       setVacationTo(av.vacation_to)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!clinic) { toast.error('No clinic found'); return }
    // Validate: open must be before close for every enabled day
    for (const d of DAYS) {
      const s = schedule[d.key]
      if (!s.enabled) continue
      if (s.open >= s.close) { toast.error(`${d.label}: opening time must be before closing time`); return }
    }
    if (hasBreak && breakStart >= breakEnd) { toast.error('Break start must be before break end'); return }
    if (newSpecialDate && newSpecialOpen >= newSpecialClose) { toast.error('Special date: opening must be before closing'); return }

    setSaving(true)
    const availability = {
      schedule, slot_duration: slotDuration, has_break: hasBreak,
      break_start: breakStart, break_end: breakEnd,
      blocked_dates: blockedDates, special_dates: specialDates,
      max_per_slot: maxPerSlot, advance_notice_hours: advanceNoticeHours,
      booking_window_days: bookingWindowDays,
      vacation_mode: vacationMode, vacation_message: vacationMessage,
      vacation_from: vacationFrom, vacation_to: vacationTo,
    }
    const { error } = await supabase.from('clinics').update({ availability }).eq('id', clinic.id)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Availability saved!')
    setSaving(false)
  }

  // Helpers
  function toggleDay(day)         { setSchedule(p => ({ ...p, [day]: { ...p[day], enabled: !p[day].enabled } })) }
  function updateHours(day, f, v) { setSchedule(p => ({ ...p, [day]: { ...p[day], [f]: v } })) }

  function setWeekdays() {
    setSchedule(p => {
      const n = { ...p }
      DAYS.forEach(d => { n[d.key] = { ...n[d.key], enabled: !['saturday','sunday'].includes(d.key), open:'09:00', close:'18:00' } })
      return n
    })
  }
  function setAllDays() {
    setSchedule(p => {
      const n = { ...p }
      DAYS.forEach(d => { n[d.key] = { ...n[d.key], enabled: true, open:'09:00', close:'17:00' } })
      return n
    })
  }

  function addBlockedDate() {
    if (!newBlockDate) { toast.error('Pick a date'); return }
    if (blockedDates.find(b => b.date === newBlockDate)) { toast.error('Already blocked'); return }
    setBlockedDates(p => [...p, { date: newBlockDate, note: newBlockNote }])
    setNewBlockDate(''); setNewBlockNote('')
    toast.success('Date blocked')
  }

  function addSpecialDate() {
    if (!newSpecialDate) { toast.error('Pick a date'); return }
    if (newSpecialOpen >= newSpecialClose) { toast.error('Opening time must be before closing time'); return }
    if (specialDates.find(s => s.date === newSpecialDate)) { toast.error('Already has override'); return }
    setSpecialDates(p => [...p, { date: newSpecialDate, open: newSpecialOpen, close: newSpecialClose, note: newSpecialNote }])
    setNewSpecialDate(''); setNewSpecialNote(''); setShowAddSpecial(false)
    toast.success('Special date added')
  }

  const today = format(startOfToday(), 'yyyy-MM-dd')
  const enabledDays = DAYS.filter(d => schedule[d.key]?.enabled).length

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}} />
    </div>
  )

  return (
    <div className="max-w-2xl">
      <div className="page-header flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Availability & Schedule</h1>
          <p className="page-subtitle">Control when patients can book appointments</p>
        </div>
        {vacationMode && <span className="badge badge-warning text-sm px-3 py-1.5 animate-pulse">🏖️ Vacation Mode ON</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 card p-1 mb-6 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={tab === t.key ? {backgroundColor:'var(--color-brand)'} : {}}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {t.key === 'vacation' && vacationMode && <span className="w-2 h-2 bg-amber-400 rounded-full"/>}
          </button>
        ))}
      </div>

      {/* ── TAB: Weekly Hours ── */}
      {tab === 'hours' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={setWeekdays} className="btn btn-secondary btn-sm">Set Weekdays (Mon–Fri)</button>
            <button onClick={setAllDays}  className="btn btn-secondary btn-sm">Set All 7 Days</button>
            <span className="ml-auto text-sm text-slate-400">{enabledDays} day{enabledDays !== 1 ? 's' : ''} active</span>
          </div>

          <div className="card divide-y divide-slate-100">
            {DAYS.map(day => {
              const s = schedule[day.key]
              const slots = s.enabled ? countSlots(s.open, s.close, slotDuration) : 0
              const timeError = s.enabled && s.open >= s.close
              return (
                <div key={day.key} className="p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Toggle + day label */}
                    <div className="flex items-center gap-3 w-36 shrink-0">
                      <Toggle on={s.enabled} onChange={() => toggleDay(day.key)} />
                      <span className={`font-semibold text-sm ${s.enabled ? 'text-slate-800' : 'text-slate-400'}`}>{day.label}</span>
                    </div>

                    {s.enabled ? (
                      <div className="flex items-end gap-2 flex-wrap flex-1">
                        {/* Free-form open time */}
                        <TimeInput value={s.open} onChange={v => updateHours(day.key, 'open', v)} label="Opens"/>
                        <span className="text-slate-400 text-sm mb-2">–</span>
                        {/* Free-form close time */}
                        <TimeInput value={s.close} onChange={v => updateHours(day.key, 'close', v)} label="Closes"/>
                        <div className="mb-1.5">
                          {timeError
                            ? <span className="text-xs text-red-400 font-medium">⚠️ Close must be after open</span>
                            : slots > 0
                              ? <span className="text-xs text-slate-400">~{slots} slot{slots !== 1 ? 's' : ''}</span>
                              : <span className="text-xs text-amber-400">No slots — adjust times or duration</span>
                          }
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm italic">Closed</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Slot duration */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-1">Appointment Slot Duration</h3>
            <p className="text-slate-400 text-xs mb-3">How long each appointment slot is — determines how many slots fit in your schedule</p>
            <div className="flex gap-2 flex-wrap">
              {[15, 20, 30, 45, 60, 90].map(d => (
                <button key={d} onClick={() => setSlotDuration(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${slotDuration === d ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  style={slotDuration === d ? {backgroundColor:'var(--color-brand)'} : {}}>
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Break */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">Lunch / Break</h3>
                <p className="text-slate-400 text-xs mt-0.5">No slots will be generated during break time</p>
              </div>
              <Toggle on={hasBreak} onChange={setHasBreak} />
            </div>
            {hasBreak && (
              <div className="flex items-end gap-2 flex-wrap mt-2">
                <TimeInput value={breakStart} onChange={setBreakStart} label="Break starts"/>
                <span className="text-slate-400 text-sm mb-2">–</span>
                <TimeInput value={breakEnd} onChange={setBreakEnd} label="Break ends"/>
                {breakStart >= breakEnd && (
                  <span className="text-xs text-red-400 mb-2">⚠️ End must be after start</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Date Overrides ── */}
      {tab === 'dates' && (
        <div className="animate-fade-in space-y-5">

          {/* Blocked dates */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-1">🚫 Blocked Dates</h3>
            <p className="text-slate-400 text-xs mb-4">Dates you are unavailable — holidays, personal days, emergencies</p>
            <div className="flex gap-2 flex-wrap mb-4">
              <input type="date" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)}
                min={today} className="input !w-auto flex-1 min-w-0 text-sm"/>
              <input type="text" value={newBlockNote} onChange={e => setNewBlockNote(e.target.value)}
                placeholder="Reason (optional)" className="input flex-1 min-w-0 text-sm"/>
              <button onClick={addBlockedDate} className="btn btn-danger btn-sm shrink-0">Block Date</button>
            </div>
            {blockedDates.length === 0 ? (
              <p className="text-slate-300 text-sm text-center py-4 italic">No blocked dates</p>
            ) : (
              <div className="space-y-2">
                {[...blockedDates].sort((a,b) => a.date.localeCompare(b.date)).map(b => (
                  <div key={b.date} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    <span className="text-red-400">🚫</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{format(parseISO(b.date), 'EEEE, MMMM d, yyyy')}</p>
                      {b.note && <p className="text-slate-400 text-xs">{b.note}</p>}
                    </div>
                    <button onClick={() => setBlockedDates(p => p.filter(x => x.date !== b.date))}
                      className="text-red-300 hover:text-red-500 transition-colors shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Special open dates */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-1">✨ Special Open Dates</h3>
            <p className="text-slate-400 text-xs mb-4">Override hours for a specific date — open on a normally-closed day, or with different hours</p>

            {!showAddSpecial ? (
              <button onClick={() => setShowAddSpecial(true)}
                className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 mb-4 transition-all"
                style={{border:'1.5px dashed rgba(186,230,253,0.8)',color:'#94a3b8',background:'rgba(255,255,255,0.3)'}}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Add special date
              </button>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                  <input type="date" value={newSpecialDate} onChange={e => setNewSpecialDate(e.target.value)}
                    min={today} className="input text-sm"/>
                </div>
                <div className="flex items-end gap-2 flex-wrap">
                  <TimeInput value={newSpecialOpen} onChange={setNewSpecialOpen} label="Opens at"/>
                  <span className="text-slate-400 text-sm mb-2">–</span>
                  <TimeInput value={newSpecialClose} onChange={setNewSpecialClose} label="Closes at"/>
                  {newSpecialOpen >= newSpecialClose && newSpecialDate && (
                    <span className="text-xs text-red-400 mb-2">⚠️ Close must be after open</span>
                  )}
                </div>
                <input type="text" value={newSpecialNote} onChange={e => setNewSpecialNote(e.target.value)}
                  placeholder="Note (e.g. Open for emergencies only)" className="input text-sm"/>
                <div className="flex gap-2">
                  <button onClick={addSpecialDate} className="btn btn-primary btn-sm flex-1">Add</button>
                  <button onClick={() => setShowAddSpecial(false)} className="btn btn-secondary btn-sm flex-1">Cancel</button>
                </div>
              </div>
            )}

            {specialDates.length === 0 ? (
              <p className="text-slate-300 text-sm text-center py-4 italic">No special dates</p>
            ) : (
              <div className="space-y-2">
                {[...specialDates].sort((a,b) => a.date.localeCompare(b.date)).map(s => (
                  <div key={s.date} className="flex items-center gap-3 rounded-xl px-4 py-2.5 border"
                    style={{backgroundColor:'var(--color-brand-light)',borderColor:'var(--color-brand-border)'}}>
                    <span>✨</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{format(parseISO(s.date), 'EEEE, MMMM d, yyyy')}</p>
                      <p className="text-xs" style={{color:'var(--color-brand-text)'}}>
                        {fmt12(s.open)} – {fmt12(s.close)}
                        {s.note && ` · ${s.note}`}
                      </p>
                    </div>
                    <button onClick={() => setSpecialDates(p => p.filter(x => x.date !== s.date))}
                      className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Booking Rules ── */}
      {tab === 'settings' && (
        <div className="animate-fade-in space-y-4">
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{backgroundColor:'var(--color-brand-light)'}}>👥</div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Max Patients Per Slot</h3>
                <p className="text-slate-400 text-xs mt-0.5 mb-3">Useful if you have multiple dentists seeing patients simultaneously</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setMaxPerSlot(m => Math.max(1, m - 1))} className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg btn btn-secondary" style={{padding:0}}>−</button>
                  <span className="font-display font-bold text-2xl w-10 text-center" style={{color:'var(--color-brand)'}}>{maxPerSlot}</span>
                  <button onClick={() => setMaxPerSlot(m => Math.min(10, m + 1))} className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg btn btn-secondary" style={{padding:0}}>+</button>
                  <span className="text-slate-400 text-sm">patient{maxPerSlot !== 1 ? 's' : ''} per slot</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{backgroundColor:'var(--color-brand-light)'}}>⏰</div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Minimum Advance Notice</h3>
                <p className="text-slate-400 text-xs mt-0.5 mb-3">How far ahead a patient must book — great for nearby patients who can come on short notice</p>

                {/* Quick presets */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[0, 0.25, 0.5, 1, 2, 4, 6, 12, 24].map(h => (
                    <button key={h} onClick={() => setAdvanceNoticeHours(h)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${advanceNoticeHours === h ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      style={advanceNoticeHours === h ? {backgroundColor:'var(--color-brand)'} : {}}>
                      {h === 0 ? 'None' : h === 0.25 ? '15 min' : h === 0.5 ? '30 min' : h < 24 ? `${h}hr` : `${h/24}d`}
                    </button>
                  ))}
                </div>

                {/* Manual input */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 shrink-0">Or type custom:</span>
                  <input
                    type="number"
                    min="0"
                    max="168"
                    step="0.25"
                    value={advanceNoticeHours}
                    onChange={e => setAdvanceNoticeHours(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="input !w-24 !py-1.5 text-sm text-center"
                  />
                  <span className="text-xs text-slate-400">hours</span>
                  <span className="text-xs text-slate-300">(0.25 = 15 min, 0.5 = 30 min)</span>
                </div>

                <p className="text-slate-400 text-xs mt-2">
                  {advanceNoticeHours === 0
                    ? '✅ No restriction — patients can book any upcoming slot'
                    : advanceNoticeHours < 1
                      ? `⏱️ Patients must book at least ${advanceNoticeHours * 60} minutes in advance`
                      : advanceNoticeHours < 24
                        ? `⏱️ Patients must book at least ${advanceNoticeHours} hour${advanceNoticeHours > 1 ? 's' : ''} in advance`
                        : `⏱️ Patients must book at least ${advanceNoticeHours/24} day${advanceNoticeHours > 24 ? 's' : ''} in advance`
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{backgroundColor:'var(--color-brand-light)'}}>📆</div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Booking Window</h3>
                <p className="text-slate-400 text-xs mt-0.5 mb-3">How far ahead patients can schedule appointments</p>
                <div className="flex flex-wrap gap-2">
                  {[7, 14, 21, 30, 60, 90].map(d => (
                    <button key={d} onClick={() => setBookingWindowDays(d)}
                      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${bookingWindowDays === d ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      style={bookingWindowDays === d ? {backgroundColor:'var(--color-brand)'} : {}}>
                      {d} days
                    </button>
                  ))}
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  Patients can book up to <strong>{bookingWindowDays} days</strong> ahead (until {format(addDays(startOfToday(), bookingWindowDays), 'MMMM d, yyyy')})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Vacation Mode ── */}
      {tab === 'vacation' && (
        <div className="animate-fade-in space-y-4">
          <div className={`card p-6 border-2 transition-all ${vacationMode ? 'border-amber-300' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${vacationMode ? 'bg-amber-100' : 'bg-slate-100'}`}>🏖️</div>
                <div>
                  <h3 className="font-display font-bold text-slate-900">Vacation Mode</h3>
                  <p className="text-slate-400 text-xs">Block all new bookings while you're away</p>
                </div>
              </div>
              <Toggle on={vacationMode} onChange={setVacationMode}/>
            </div>
            {vacationMode && (
              <div className="space-y-4 pt-4 border-t border-amber-100 animate-fade-in">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-700 text-xs font-medium">⚠️ While vacation mode is ON, patients cannot book new appointments. Existing bookings are not affected.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Away From</label>
                    <input type="date" value={vacationFrom} onChange={e => setVacationFrom(e.target.value)} min={today} className="input text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Back On</label>
                    <input type="date" value={vacationTo} onChange={e => setVacationTo(e.target.value)} min={vacationFrom || today} className="input text-sm"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message to Patients</label>
                  <textarea value={vacationMessage} onChange={e => setVacationMessage(e.target.value)} rows={3}
                    placeholder="e.g. We're on vacation until March 15. We'll be back and ready to serve you then!" className="input resize-none text-sm"/>
                </div>
                {(vacationFrom || vacationMessage) && (
                  <div className="rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Patient-facing preview</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-amber-500">🏖️</span>
                        <span className="text-amber-700 font-semibold text-sm">Currently on vacation</span>
                        {vacationFrom && vacationTo && (
                          <span className="text-amber-600 text-xs">{format(parseISO(vacationFrom), 'MMM d')} – {format(parseISO(vacationTo), 'MMM d')}</span>
                        )}
                      </div>
                      {vacationMessage && <p className="text-amber-600 text-xs leading-relaxed">{vacationMessage}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {!vacationMode && (
            <div className="card p-5 text-center">
              <span className="text-3xl">✅</span>
              <p className="font-semibold text-slate-700 mt-2">You're open for bookings</p>
              <p className="text-slate-400 text-sm mt-1">Toggle vacation mode when you need a break</p>
            </div>
          )}
        </div>
      )}

      {/* Save */}
      <div className="mt-6 sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg w-full rounded-2xl shadow-lg">
          {saving
            ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving...</>
            : '💾 Save Availability'}
        </button>
      </div>
    </div>
  )
}