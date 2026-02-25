import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const DAYS = [
  { key: 'monday',    label: 'Monday',    short: 'Mon' },
  { key: 'tuesday',   label: 'Tuesday',   short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday',  label: 'Thursday',  short: 'Thu' },
  { key: 'friday',    label: 'Friday',    short: 'Fri' },
  { key: 'saturday',  label: 'Saturday',  short: 'Sat' },
  { key: 'sunday',    label: 'Sunday',    short: 'Sun' },
]

const DEFAULT_HOURS = { open: '09:00', close: '18:00', enabled: false }

const TIME_OPTIONS = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = h.toString().padStart(2, '0')
    const mm = m.toString().padStart(2, '0')
    const time = `${hh}:${mm}`
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    const ampm = h < 12 ? 'AM' : 'PM'
    TIME_OPTIONS.push({ value: time, label: `${hour12}:${mm} ${ampm}` })
  }
}

export default function ClinicAvailability() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [schedule, setSchedule] = useState(() =>
    Object.fromEntries(DAYS.map(d => [d.key, { ...DEFAULT_HOURS }]))
  )
  const [slotDuration, setSlotDuration] = useState(30)
  const [breakStart, setBreakStart] = useState('12:00')
  const [breakEnd, setBreakEnd] = useState('13:00')
  const [hasBreak, setHasBreak] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase.from('clinics').select('id, availability').eq('owner_id', user.id).maybeSingle()
      if (c) {
        setClinic(c)
        if (c.availability) {
          const av = c.availability
          if (av.schedule) setSchedule(prev => ({ ...prev, ...av.schedule }))
          if (av.slot_duration) setSlotDuration(av.slot_duration)
          if (av.break_start) setBreakStart(av.break_start)
          if (av.break_end) setBreakEnd(av.break_end)
          if (av.has_break !== undefined) setHasBreak(av.has_break)
        }
      }
      setLoading(false)
    }
    load()
  }, [user])

  function toggleDay(day) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }))
  }

  function updateHours(day, field, value) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  function setWeekdays() {
    setSchedule(prev => {
      const next = { ...prev }
      DAYS.forEach(d => {
        if (!['saturday', 'sunday'].includes(d.key)) {
          next[d.key] = { ...next[d.key], enabled: true, open: '09:00', close: '18:00' }
        } else {
          next[d.key] = { ...next[d.key], enabled: false }
        }
      })
      return next
    })
  }

  function setAllDays() {
    setSchedule(prev => {
      const next = { ...prev }
      DAYS.forEach(d => { next[d.key] = { ...next[d.key], enabled: true, open: '09:00', close: '17:00' } })
      return next
    })
  }

  async function handleSave() {
    if (!clinic) { toast.error('No clinic profile found'); return }
    setSaving(true)
    const availability = { schedule, slot_duration: slotDuration, has_break: hasBreak, break_start: breakStart, break_end: breakEnd }
    const { error } = await supabase.from('clinics').update({ availability }).eq('id', clinic.id)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Availability saved!')
    setSaving(false)
  }

  const enabledDays = DAYS.filter(d => schedule[d.key]?.enabled).length

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Availability & Schedule</h1>
        <p className="page-subtitle">Set your clinic's working hours and appointment slots</p>
      </div>

      {/* Quick set buttons */}
      <div className="flex gap-2 mb-6">
        <button onClick={setWeekdays} className="btn btn-secondary btn-sm">Set Weekdays (Mon-Fri)</button>
        <button onClick={setAllDays} className="btn btn-secondary btn-sm">Set All 7 Days</button>
        <span className="ml-auto text-sm text-slate-500 self-center">{enabledDays} day{enabledDays !== 1 ? 's' : ''} active</span>
      </div>

      {/* Schedule grid */}
      <div className="card divide-y divide-slate-100 mb-6">
        {DAYS.map(day => {
          const s = schedule[day.key]
          return (
            <div key={day.key} className={`p-4 transition-colors ${s.enabled ? 'bg-white' : 'bg-slate-50/50'}`}>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Toggle */}
                <div className="flex items-center gap-3 w-36">
                  <button onClick={() => toggleDay(day.key)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors flex items-center ${s.enabled ? 'bg-teal-500' : 'bg-slate-200'}`}
                    style={{minWidth: '40px', height: '22px'}}>
                    <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${s.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                  <span className={`font-semibold text-sm ${s.enabled ? 'text-slate-800' : 'text-slate-400'}`}>{day.label}</span>
                </div>

                {s.enabled ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={s.open} onChange={e => updateHours(day.key, 'open', e.target.value)}
                      className="input !w-auto !py-1.5 text-sm">
                      {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <span className="text-slate-400 text-sm font-medium">to</span>
                    <select value={s.close} onChange={e => updateHours(day.key, 'close', e.target.value)}
                      className="input !w-auto !py-1.5 text-sm">
                      {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <span className="text-xs text-slate-400 ml-1">
                      {/* Calculate slots */}
                      {(() => {
                        const [oh, om] = s.open.split(':').map(Number)
                        const [ch, cm] = s.close.split(':').map(Number)
                        const mins = (ch * 60 + cm) - (oh * 60 + om)
                        const slots = Math.floor(mins / slotDuration)
                        return slots > 0 ? `~${slots} slots` : ''
                      })()}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm italic">Closed</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Slot duration */}
      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3">Appointment Slot Duration</h3>
        <div className="flex gap-2 flex-wrap">
          {[15, 20, 30, 45, 60, 90].map(d => (
            <button key={d} onClick={() => setSlotDuration(d)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${slotDuration === d ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}>
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Break time */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Lunch Break</h3>
          <button onClick={() => setHasBreak(!hasBreak)}
            className={`relative rounded-full transition-colors flex items-center`}
            style={{width: '40px', minWidth: '40px', height: '22px', background: hasBreak ? '#0d9488' : '#e2e8f0'}}>
            <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${hasBreak ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
        {hasBreak && (
          <div className="flex items-center gap-2 mt-2">
            <select value={breakStart} onChange={e => setBreakStart(e.target.value)} className="input !w-auto !py-1.5 text-sm">
              {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span className="text-slate-400 text-sm">to</span>
            <select value={breakEnd} onChange={e => setBreakEnd(e.target.value)} className="input !w-auto !py-1.5 text-sm">
              {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span className="text-xs text-slate-400">No appointments during break</span>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg w-full">
        {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : '💾 Save Availability'}
      </button>
    </div>
  )
}