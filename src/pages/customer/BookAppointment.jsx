import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format, addDays, startOfToday, addHours, getDay, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function Step({ number, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-teal-600' : done ? 'text-teal-500' : 'text-slate-300'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${active ? 'border-teal-600 bg-teal-600 text-white' : done ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-200 text-slate-300'}`}>
        {done ? '✓' : number}
      </div>
      <span className="text-sm font-medium hidden sm:block">{label}</span>
    </div>
  )
}

export default function BookAppointment() {
  const { clinicId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [step, setStep] = useState(1)
  const [clinic, setClinic] = useState(null)
  const [services, setServices] = useState([])
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      const [c, s] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', clinicId).single(),
        supabase.from('services').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('price')
      ])
      setClinic(c.data)
      setServices(s.data || [])
      setAvailability(c.data?.availability || null)

      // Pre-select service from query param
      const preService = searchParams.get('service')
      if (preService && s.data) {
        const found = s.data.find(sv => sv.id === preService)
        if (found) { setSelectedService(found); setStep(2) }
      }
      setLoading(false)
    }
    load()
  }, [clinicId])

  // Generate available dates respecting all booking rules
  function getAvailableDates() {
    const dates = []
    const today = startOfToday()
    const window = availability?.booking_window_days || 30
    const advanceHours = availability?.advance_notice_hours ?? 2
    const blocked = (availability?.blocked_dates || []).map(b => b.date)
    const special = (availability?.special_dates || []).map(s => s.date)

    for (let i = 0; i <= window; i++) {
      const d = addDays(today, i)
      const dateStr = format(d, 'yyyy-MM-dd')

      // Skip blocked dates
      if (blocked.includes(dateStr)) continue

      // Skip dates too close (advance notice)
      const cutoff = addHours(new Date(), advanceHours)
      if (d < cutoff && !special.includes(dateStr)) continue

      const dayKey = DAY_KEYS[getDay(d)]

      // Special date override — always include
      if (special.includes(dateStr)) { dates.push(d); continue }

      // Check weekly schedule
      if (!availability?.schedule) { dates.push(d); continue }
      if (availability.schedule[dayKey]?.enabled) dates.push(d)
    }
    return dates.slice(0, 21)
  }

  // Generate time slots respecting break, advance notice, and special date hours
  function getTimeSlots(date) {
    if (!date) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayKey = DAY_KEYS[getDay(date)]
    const advanceHours = availability?.advance_notice_hours ?? 2
    const nowPlusNotice = addHours(new Date(), advanceHours)

    // Check for special date override
    const specialDate = (availability?.special_dates || []).find(s => s.date === dateStr)
    const sched = specialDate
      ? { enabled: true, open: specialDate.open, close: specialDate.close }
      : availability?.schedule?.[dayKey]
    if (!sched?.enabled) return []

    const slots = []
    const [oh, om] = (sched.open || '09:00').split(':').map(Number)
    const [ch, cm] = (sched.close || '18:00').split(':').map(Number)
    const duration = availability?.slot_duration || 30
    const breakStart = availability?.has_break ? availability.break_start : null
    const breakEnd   = availability?.has_break ? availability.break_end   : null

    let current = oh * 60 + om
    const end   = ch * 60 + cm

    while (current + duration <= end) {
      const hh = Math.floor(current / 60).toString().padStart(2, '0')
      const mm = (current % 60).toString().padStart(2, '0')
      const timeStr = `${hh}:${mm}`

      // Skip break time
      if (breakStart && breakEnd) {
        const [bsh, bsm] = breakStart.split(':').map(Number)
        const [beh, bem] = breakEnd.split(':').map(Number)
        const bStartMins = bsh * 60 + bsm
        const bEndMins   = beh * 60 + bem
        if (current >= bStartMins && current < bEndMins) { current += duration; continue }
      }

      // Skip slots too soon (advance notice)
      const slotDateTime = new Date(date)
      slotDateTime.setHours(Math.floor(current / 60), current % 60, 0, 0)
      if (slotDateTime < nowPlusNotice) { current += duration; continue }

      const h12 = current >= 720 ? Math.floor(current / 60) - 12 || 12 : Math.floor(current / 60) || 12
      const ampm = current >= 720 ? 'PM' : 'AM'
      slots.push({ value: timeStr, label: `${h12}:${mm} ${ampm}` })
      current += duration
    }
    return slots
  }

  async function handleConfirmBooking() {
    if (!selectedService || !selectedDate || !selectedTime) { toast.error('Please complete all steps'); return }
    setBooking(true)

    const { error } = await supabase.from('appointments').insert({
      clinic_id: clinicId,
      customer_id: user.id,
      service_id: selectedService.id,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      appointment_time: selectedTime.value,
      notes,
      status: 'pending'
    })

    if (error) { toast.error(error.message); setBooking(false); return }

    // Notify clinic owner
    const { data: clinicData } = await supabase.from('clinics').select('owner_id').eq('id', clinicId).single()
    await supabase.from('notifications').insert({
      recipient_id: clinicData.owner_id,
      type: 'new_booking',
      title: '📅 New Appointment Request',
      message: `${profile?.full_name} booked ${selectedService.name} for ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime.label}.`,
      related_id: clinicId
    })

    setBooking(false)
    setDone(true)
  }

  const availableDates = getAvailableDates()
  const timeSlots = selectedDate ? getTimeSlots(selectedDate) : []

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Vacation mode banner
  const isOnVacation = clinic?.availability?.vacation_mode

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
        <h1 className="font-display font-bold text-slate-900 text-2xl mb-2">Booking Requested!</h1>
        <p className="text-slate-500 mb-2">Your appointment request has been sent to <strong>{clinic?.name}</strong>.</p>
        <p className="text-slate-400 text-sm mb-8">You'll receive a notification once the clinic confirms your appointment.</p>
        <div className="card p-5 text-left mb-6">
          <div className="space-y-3">
            {[
              { label: 'Clinic',   value: clinic?.name },
              { label: 'Service',  value: selectedService?.name },
              { label: 'Date',     value: format(selectedDate, 'EEEE, MMMM d, yyyy') },
              { label: 'Time',     value: selectedTime?.label },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-slate-400">{r.label}</span>
                <span className="font-semibold text-slate-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg rounded-2xl w-full">
          View My Appointments →
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="btn btn-secondary btn-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-md flex items-center justify-center"><span className="text-white text-xs">🦷</span></div>
            <span className="font-display font-bold text-slate-900 text-sm">{clinic?.name}</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Step number={1} label="Service"  active={step === 1} done={step > 1} />
          <div className={`flex-1 max-w-[60px] h-0.5 rounded-full ${step > 1 ? 'bg-teal-500' : 'bg-slate-200'}`} />
          <Step number={2} label="Schedule" active={step === 2} done={step > 2} />
          <div className={`flex-1 max-w-[60px] h-0.5 rounded-full ${step > 2 ? 'bg-teal-500' : 'bg-slate-200'}`} />
          <Step number={3} label="Confirm"  active={step === 3} done={done} />
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-slate-900 text-xl mb-1">Choose a Service</h2>
            <p className="text-slate-500 text-sm mb-6">Select the treatment you need</p>
            {isOnVacation && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-500 text-lg">🏖️</span>
                  <p className="font-semibold text-amber-700 text-sm">This clinic is currently on vacation</p>
                </div>
                {clinic.availability.vacation_from && clinic.availability.vacation_to && (
                  <p className="text-amber-600 text-xs mb-1">{clinic.availability.vacation_from} – {clinic.availability.vacation_to}</p>
                )}
                {clinic.availability.vacation_message && (
                  <p className="text-amber-600 text-xs leading-relaxed">{clinic.availability.vacation_message}</p>
                )}
                <p className="text-amber-500 text-xs mt-2 font-medium">Bookings are temporarily unavailable.</p>
              </div>
            )}
            {services.length === 0 ? (
              <div className="card p-10 text-center"><p className="text-slate-400">No services available yet.</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(s => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(2) }}
                    className={`card p-4 text-left hover:shadow-md hover:border-teal-200 transition-all group ${selectedService?.id === s.id ? 'border-teal-500 bg-teal-50/50' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">{s.name}</p>
                        {s.description && <p className="text-slate-400 text-xs mt-1">{s.description}</p>}
                        {s.duration_minutes && <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          {s.duration_minutes} min
                        </p>}
                      </div>
                      <span className="font-display font-bold text-teal-600 text-lg shrink-0">₱{parseFloat(s.price || 0).toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date + Time */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-slate-900 text-xl mb-1">Pick a Schedule</h2>
            <p className="text-slate-500 text-sm mb-6">Select your preferred date and time</p>

            {/* Selected service summary */}
            <div className="card p-4 mb-5 flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center text-lg">🦷</div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{selectedService?.name}</p>
                <p className="text-teal-600 text-xs font-semibold">₱{parseFloat(selectedService?.price || 0).toLocaleString()}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Change</button>
            </div>

            {/* Dates */}
            <div className="mb-6">
              <p className="font-semibold text-slate-700 text-sm mb-3">Available Dates</p>
              {availableDates.length === 0 ? (
                <div className="card p-6 text-center"><p className="text-slate-400 text-sm">No available dates. Please contact the clinic directly.</p></div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDates.map(d => (
                    <button key={d.toISOString()} onClick={() => { setSelectedDate(d); setSelectedTime(null) }}
                      className={`p-2.5 rounded-2xl text-center transition-all border ${selectedDate?.toDateString() === d.toDateString() ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700'}`}>
                      <p className="text-xs opacity-70">{format(d, 'EEE')}</p>
                      <p className="font-display font-bold text-lg leading-tight">{format(d, 'd')}</p>
                      <p className="text-xs opacity-70">{format(d, 'MMM')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Times */}
            {selectedDate && (
              <div className="mb-6">
                <p className="font-semibold text-slate-700 text-sm mb-3">Available Times — {format(selectedDate, 'EEEE, MMM d')}</p>
                {timeSlots.length === 0 ? (
                  <div className="card p-4 text-center"><p className="text-slate-400 text-sm">No time slots available for this day.</p></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {timeSlots.map(t => (
                      <button key={t.value} onClick={() => setSelectedTime(t)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold text-center transition-all border ${selectedTime?.value === t.value ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}
              className="btn btn-primary btn-lg w-full rounded-2xl">
              Continue →
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="font-display font-bold text-slate-900 text-xl mb-1">Confirm Booking</h2>
            <p className="text-slate-500 text-sm mb-6">Review your appointment details</p>

            <div className="card p-5 mb-5 divide-y divide-slate-100">
              {[
                { icon: '🏥', label: 'Clinic',   value: clinic?.name },
                { icon: '🦷', label: 'Service',  value: `${selectedService?.name} — ₱${parseFloat(selectedService?.price || 0).toLocaleString()}` },
                { icon: '📅', label: 'Date',     value: format(selectedDate, 'EEEE, MMMM d, yyyy') },
                { icon: '🕐', label: 'Time',     value: selectedTime?.label },
                { icon: '👤', label: 'Patient',  value: profile?.full_name },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="text-xl w-7 text-center">{r.icon}</span>
                  <div className="flex-1 flex justify-between items-center gap-2 flex-wrap">
                    <span className="text-slate-400 text-sm">{r.label}</span>
                    <span className="font-semibold text-slate-800 text-sm text-right">{r.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="card p-4 mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Any allergies, concerns, or things we should know..."
                className="input resize-none" />
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 mb-5">
              <p className="text-teal-700 text-xs font-medium">
                ℹ️ Your appointment will be sent as a request. The clinic will confirm it shortly.
              </p>
            </div>

            <button onClick={handleConfirmBooking} disabled={booking} className="btn btn-primary btn-lg w-full rounded-2xl">
              {booking
                ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Booking...</>
                : '🦷 Confirm Appointment'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}