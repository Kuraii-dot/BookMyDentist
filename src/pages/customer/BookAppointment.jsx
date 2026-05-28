import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format, addDays, startOfToday, addHours, getDay } from 'date-fns'
import toast from 'react-hot-toast'
import { sendBookingRequestedEmail, sendNewBookingAlertEmail } from '../../lib/email'
import { ChevronLeft, CheckCircle2, Calendar, Clock, Building2, User, Mail, Stethoscope, Umbrella, AlertTriangle, Plus, X, Check } from 'lucide-react'
import { Alert, Field } from '../../components/ui/shared'
import ToothIcon from '../../components/ToothIcon'

const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

function StepIndicator({ current, done }) {
  const steps = ['Services', 'Schedule', 'Confirm']
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const num      = i + 1
        const isActive = current === num
        const isDone   = done || current > num
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${isActive ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-200'
                  : isDone  ? 'bg-sky-100 border-sky-300 text-sky-600'
                  : 'border-slate-200 text-slate-400 bg-white'}`}>
                {isDone && !isActive ? '✓' : num}
              </div>
              <span className={`text-xs font-semibold hidden sm:block transition-colors
                ${isActive ? 'text-sky-600' : isDone ? 'text-sky-400' : 'text-slate-300'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 rounded-full transition-colors ${current > num ? 'bg-sky-300' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function BookAppointment() {
  const { clinicId }      = useParams()
  const [searchParams]    = useSearchParams()
  const navigate          = useNavigate()
  const { user, profile } = useAuth()

  const [step, setStep]                       = useState(1)
  const [clinic, setClinic]                   = useState(null)
  const [services, setServices]               = useState([])
  const [availability, setAvailability]       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [selectedServices, setSelectedServices] = useState([]) // array of service objects
  const [selectedDate, setSelectedDate]       = useState(null)
  const [selectedTime, setSelectedTime]       = useState(null)
  const [bookedSlots, setBookedSlots]         = useState([]) // [{time, durationMinutes}]
  const [notes, setNotes]                     = useState('')
  const [booking, setBooking]                 = useState(false)
  const [done, setDone]                       = useState(false)

  useEffect(() => {
    async function load() {
      const [c, s] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', clinicId).single(),
        supabase.from('services').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('price'),
      ])
      setClinic(c.data)
      setServices(s.data || [])
      setAvailability(c.data?.availability || null)

      // Pre-select service if passed via query param
      const preService = searchParams.get('service')
      if (preService && s.data) {
        const found = s.data.find(sv => sv.id === preService)
        if (found) {
          setSelectedServices([found])
          setStep(2)
        }
      }
      setLoading(false)
    }
    load()
  }, [clinicId])

  // Load booked slots for selected date (including their durations)
  useEffect(() => {
    if (!selectedDate || !clinicId) return
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    async function fetchBooked() {
      // Fetch appointments and their services to know durations
      const { data } = await supabase
        .from('appointments')
        .select('appointment_time, service_id, services(duration_minutes), selected_services, completed_at')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', dateStr)
        .not('status', 'in', '(cancelled,rejected)')

      if (!data) { setBookedSlots([]); return }

      const slots = data.map(appt => {
        const time = appt.appointment_time?.slice(0, 5)

        // Calculate total duration: sum of all selected services durations
        let durationMinutes = 0
        if (appt.selected_services && Array.isArray(appt.selected_services)) {
          durationMinutes = appt.selected_services.reduce((sum, s) => sum + (s.duration_minutes || 30), 0)
        } else {
          durationMinutes = appt.services?.duration_minutes || 30
        }

        // If appointment is completed, check if it completed early
        // completed_at is stored so we can recalculate available slots
        const completedAt = appt.completed_at ? new Date(appt.completed_at) : null

        return { time, durationMinutes, completedAt }
      }).filter(s => s.time)

      setBookedSlots(slots)
    }
    fetchBooked()
  }, [selectedDate, clinicId])

  function toggleService(service) {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) {
        return prev.filter(s => s.id !== service.id)
      } else {
        return [...prev, service]
      }
    })
  }

  // Calculate total duration of selected services
  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + (s.duration_minutes || 30), 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.price || 0), 0)

  function getAvailableDates() {
    const dates   = []
    const today   = startOfToday()
    const window  = availability?.booking_window_days || 30
    const blocked = (availability?.blocked_dates || []).map(b => b.date)
    const special = (availability?.special_dates || []).map(s => s.date)
    for (let i = 0; i <= window; i++) {
      const d       = addDays(today, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      if (blocked.includes(dateStr)) continue
      if (special.includes(dateStr)) { dates.push(d); continue }
      if (!availability?.schedule)   { dates.push(d); continue }
      if (availability.schedule[DAY_KEYS[getDay(d)]]?.enabled) dates.push(d)
    }
    return dates.slice(0, 21)
  }

  function getTimeSlots(date) {
    if (!date) return []
    const dateStr       = format(date, 'yyyy-MM-dd')
    const dayKey        = DAY_KEYS[getDay(date)]
    const advanceHours  = availability?.advance_notice_hours ?? 2
    const now           = new Date()
    const nowPlusNotice = addHours(now, advanceHours)
    const specialDate   = (availability?.special_dates || []).find(s => s.date === dateStr)
    const sched = specialDate
      ? { enabled: true, open: specialDate.open, close: specialDate.close }
      : availability?.schedule?.[dayKey]
    if (!sched?.enabled) return []

    const [oh, om]   = (sched.open  || '09:00').split(':').map(Number)
    const [ch, cm]   = (sched.close || '18:00').split(':').map(Number)
    const slotDuration = availability?.slot_duration || 30
    const breakStart = availability?.has_break ? availability.break_start : null
    const breakEnd   = availability?.has_break ? availability.break_end   : null
    const maxPerSlot = availability?.max_per_slot || 1

    // Build blocked time ranges from booked appointments
    // Each booked appointment blocks from its start time to start + duration
    // UNLESS the appointment was completed early (completed_at is set)
    const blockedRanges = bookedSlots.map(slot => {
      const [h, m] = slot.time.split(':').map(Number)
      const startMin = h * 60 + m

      let endMin
      if (slot.completedAt) {
        // Appointment completed early — use actual completion time
        const completedHour = slot.completedAt.getHours()
        const completedMin  = slot.completedAt.getMinutes()
        endMin = completedHour * 60 + completedMin
      } else {
        endMin = startMin + slot.durationMinutes
      }

      return { startMin, endMin, time: slot.time }
    })

    // Count overlapping bookings at each slot start time (for maxPerSlot)
    function countOverlapping(slotStartMin, slotEndMin) {
      return blockedRanges.filter(range => {
        // Check if the proposed slot overlaps with this booked range
        return slotStartMin < range.endMin && slotEndMin > range.startMin
      }).length
    }

    const slots = []
    let current = oh * 60 + om
    const end   = ch * 60 + cm

    while (current + totalDurationMinutes <= end) {
      const hh = Math.floor(current / 60).toString().padStart(2, '0')
      const mm = (current % 60).toString().padStart(2, '0')

      // Skip break time
      if (breakStart && breakEnd) {
        const [bsh, bsm] = breakStart.split(':').map(Number)
        const [beh, bem] = breakEnd.split(':').map(Number)
        const breakStartMin = bsh * 60 + bsm
        const breakEndMin   = beh * 60 + bem
        // If the multi-service block would overlap with break
        if (current < breakEndMin && current + totalDurationMinutes > breakStartMin) {
          current += slotDuration
          continue
        }
      }

      const slotDT = new Date(date)
      slotDT.setHours(Math.floor(current / 60), current % 60, 0, 0)
      if (slotDT <= now)           { current += slotDuration; continue }
      if (slotDT < nowPlusNotice)  { current += slotDuration; continue }

      const slotVal    = `${hh}:${mm}`
      const slotEndMin = current + totalDurationMinutes
      const overlapCount = countOverlapping(current, slotEndMin)

      if (overlapCount < maxPerSlot) {
        const h12  = current >= 720 ? Math.floor(current / 60) - 12 || 12 : Math.floor(current / 60) || 12
        const ampm = current >= 720 ? 'PM' : 'AM'
        const endH12  = slotEndMin >= 720 ? Math.floor(slotEndMin / 60) - 12 || 12 : Math.floor(slotEndMin / 60) || 12
        const endAmpm = slotEndMin >= 720 ? 'PM' : 'AM'
        const endMm   = (slotEndMin % 60).toString().padStart(2, '0')
        slots.push({
          value: slotVal,
          label: `${h12}:${mm} ${ampm}`,
          endLabel: `${endH12}:${endMm} ${endAmpm}`,
        })
      }

      current += slotDuration
    }
    return slots
  }

  async function handleConfirmBooking() {
    if (selectedServices.length === 0 || !selectedDate || !selectedTime) {
      toast.error('Please complete all steps')
      return
    }
    setBooking(true)

    // Store all selected services info in the appointment
    const selectedServicesData = selectedServices.map(s => ({
      service_id: s.id,
      name: s.name,
      price: parseFloat(s.price || 0),
      duration_minutes: s.duration_minutes || 30,
    }))

    // Primary service_id = first selected service (for backward compat)
    const primaryServiceId = selectedServices[0].id

    const appointmentDate = format(selectedDate, 'yyyy-MM-dd')
    const { data: bookedAppointment, error: rpcError } = await supabase.rpc('book_appointment_atomic', {
      p_clinic_id: clinicId,
      p_selected_services: selectedServicesData,
      p_appointment_date: appointmentDate,
      p_appointment_time: selectedTime.value,
      p_notes: notes,
    })

    const rpcMissing = ['42883', 'PGRST202'].includes(rpcError?.code)
    if (rpcError && !rpcMissing) {
      toast.error(rpcError.message || 'This slot is no longer available. Please choose another time.')
      setSelectedTime(null)
      setStep(2)
      setBooking(false)
      return
    }

    const insertedAppointment = Array.isArray(bookedAppointment) ? bookedAppointment[0] : bookedAppointment
    let appointmentId = insertedAppointment?.id

    if (rpcMissing) {
      const { data: fallbackAppointment, error } = await supabase.from('appointments').insert({
        clinic_id:         clinicId,
        customer_id:       user.id,
        service_id:        primaryServiceId,
        selected_services: selectedServicesData,
        appointment_date:  appointmentDate,
        appointment_time:  selectedTime.value,
        notes,
        status: 'pending',
      }).select('id').single()

      if (error) { toast.error(error.message); setBooking(false); return }
      appointmentId = fallbackAppointment?.id
      console.warn('book_appointment_atomic RPC is not deployed yet; used legacy booking insert.')
    }

    const { data: clinicOwnerData } = await supabase.from('clinics')
      .select('owner_id, email')
      .eq('id', clinicId)
      .single()

    let ownerName = 'Clinic Owner'
    let ownerEmail = null

    if (clinicOwnerData?.owner_id) {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', clinicOwnerData.owner_id)
        .maybeSingle()
      ownerName = ownerProfile?.full_name || ownerName
      ownerEmail = ownerProfile?.email || null
    }

    const clinicContactEmail = clinicOwnerData?.email || clinic?.email || null
    const clinicAlertRecipients = [...new Set([clinicContactEmail, ownerEmail].filter(Boolean))]

    if (clinicOwnerData?.owner_id) {
      await supabase.from('notifications').insert({
        recipient_id: clinicOwnerData.owner_id,
        type: 'new_booking',
        title: 'New Appointment Request',
        message: `${profile?.full_name} booked ${selectedServices.map(s => s.name).join(', ')} for ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime.label}. Total: ₱${totalPrice.toLocaleString()} (${totalDurationMinutes} min).`,
        appointment_id: appointmentId,
        related_id: appointmentId || clinicId,
      })
    }

    const formattedDate   = format(selectedDate, 'EEEE, MMMM d, yyyy')
    const serviceNamesStr = selectedServices.map(s => s.name).join(', ')

    const emailTasks = []

    emailTasks.push(sendBookingRequestedEmail({
      to: user.email,
      patientName: profile?.full_name || 'there',
      clinicName: clinic?.name,
      serviceName: serviceNamesStr,
      date: formattedDate,
      time: selectedTime.label,
    }, { bestEffort: false }))

    if (ownerEmail) {
      emailTasks.push(sendNewBookingAlertEmail({
        to: ownerEmail,
        ownerName,
        clinicName: clinic?.name,
        patientName: profile?.full_name || 'A patient',
        serviceName: serviceNamesStr,
        date: formattedDate,
        time: selectedTime.label,
      }, { bestEffort: false }))
    } else {
      console.warn('Clinic owner email missing. Booking email alert skipped.')
    }

    if (emailTasks.length) {
      const results = await Promise.allSettled(emailTasks)
      const failedCount = results.filter(r => r.status === 'rejected').length
      if (failedCount > 0) {
        console.warn('Some booking emails failed:', results)
        toast('Booking saved, but some email alerts failed. Clinic still has an in-app notification.', {
          icon: '⚠️',
        })
      }
    }

    setBooking(false)
    setDone(true)
  }

  const availableDates = getAvailableDates()
  const timeSlots      = selectedDate ? getTimeSlots(selectedDate) : []
  const isOnVacation   = clinic?.availability?.vacation_mode

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-7 h-7 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  // Success screen
  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="font-display font-bold text-slate-900 text-2xl mb-2">Booking Requested!</h1>
        <p className="text-slate-500 mb-1">Your request has been sent to <strong>{clinic?.name}</strong>.</p>
        <p className="text-slate-400 text-sm mb-2">You'll get a notification once the clinic confirms.</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700">
          <Mail className="w-3.5 h-3.5" /> Confirmation email sent to {user?.email}
        </div>
        <div className="card p-5 text-left mb-5">
          <div className="flex items-center gap-3 py-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-sm w-16">Clinic</span>
            <span className="font-semibold text-slate-800 text-sm">{clinic?.name}</span>
          </div>
          <div className="flex items-start gap-3 py-3 border-b border-slate-100">
            <Stethoscope className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-slate-400 text-sm w-16 shrink-0">Services</span>
            <div className="flex flex-col gap-1">
              {selectedServices.map(s => (
                <span key={s.id} className="font-semibold text-slate-800 text-sm">{s.name} — ₱{parseFloat(s.price||0).toLocaleString()}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 py-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-sm w-16">Date</span>
            <span className="font-semibold text-slate-800 text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3 py-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-sm w-16">Time</span>
            <span className="font-semibold text-slate-800 text-sm">{selectedTime?.label} – {selectedTime?.endLabel}</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-sm w-16">Duration</span>
            <span className="font-semibold text-slate-800 text-sm">{totalDurationMinutes} min · ₱{totalPrice.toLocaleString()} total</span>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg w-full">
          View My Appointments →
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="btn btn-ghost btn-sm flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" />{step > 1 ? 'Back' : 'Cancel'}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center">
              <ToothIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 text-sm">{clinic?.name}</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <StepIndicator current={step} done={done} />

        {/* ── Step 1: Select Services (multi-select) ── */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="font-display font-bold text-slate-900 text-2xl">Choose Services</h2>
              <p className="text-slate-500 text-sm mt-1">Select one or more treatments you need</p>
            </div>

            {isOnVacation && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Umbrella className="w-4 h-4 text-amber-500" />
                  <p className="font-bold text-amber-700 text-sm">This clinic is currently on vacation</p>
                </div>
                {clinic.availability.vacation_from && clinic.availability.vacation_to && (
                  <p className="text-amber-600 text-xs mb-1">{clinic.availability.vacation_from} – {clinic.availability.vacation_to}</p>
                )}
                {clinic.availability.vacation_message && (
                  <p className="text-amber-600 text-xs">{clinic.availability.vacation_message}</p>
                )}
                <p className="text-amber-500 text-xs mt-2 font-semibold">Bookings are temporarily unavailable.</p>
              </div>
            )}

            {services.length === 0 ? (
              <div className="card p-10 text-center text-slate-400 text-sm">No services available yet.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {services.map(s => {
                    const isSelected = selectedServices.some(sel => sel.id === s.id)
                    return (
                      <button key={s.id} onClick={() => toggleService(s)}
                        className={`card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md group relative
                          ${isSelected ? 'border-sky-400 ring-2 ring-sky-100 bg-sky-50/30' : ''}`}>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2 pr-6">
                          <div className="flex-1">
                            <p className={`font-semibold text-sm transition-colors ${isSelected ? 'text-sky-700' : 'text-slate-900 group-hover:text-sky-600'}`}>
                              {s.name}
                            </p>
                            {s.description && <p className="text-slate-400 text-xs mt-1 leading-relaxed">{s.description}</p>}
                            {s.duration_minutes && (
                              <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{s.duration_minutes} min
                              </p>
                            )}
                          </div>
                          <span className={`font-display font-bold text-lg shrink-0 ${isSelected ? 'text-sky-600' : 'text-sky-600'}`}>
                            ₱{parseFloat(s.price || 0).toLocaleString()}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Summary bar */}
                {selectedServices.length > 0 && (
                  <div className="card p-4 mb-5 bg-sky-50 border-sky-200">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-1">Selected Services</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedServices.map(s => (
                            <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-white text-sky-700 border border-sky-200 rounded-full px-2.5 py-1 font-medium">
                              {s.name}
                              <button onClick={(e) => { e.stopPropagation(); toggleService(s) }}
                                className="text-sky-400 hover:text-red-400 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-bold text-sky-700 text-xl">₱{totalPrice.toLocaleString()}</p>
                        <p className="text-sky-500 text-xs">{totalDurationMinutes} min total</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  disabled={selectedServices.length === 0}
                  onClick={() => setStep(2)}
                  className="btn btn-primary btn-lg w-full">
                  {selectedServices.length === 0
                    ? 'Select at least one service'
                    : `Continue with ${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} →`}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Schedule ── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="font-display font-bold text-slate-900 text-2xl">Pick a Schedule</h2>
              <p className="text-slate-500 text-sm mt-1">Select your preferred date and time</p>
            </div>

            {/* Selected services summary */}
            <div className="card p-3 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 shrink-0">
                  <Stethoscope className="w-4 h-4 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {selectedServices.map(s => (
                      <span key={s.id} className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-full px-2 py-0.5">{s.name}</span>
                    ))}
                  </div>
                  <p className="text-sky-600 text-xs font-bold">₱{totalPrice.toLocaleString()} · {totalDurationMinutes} min total</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs font-semibold text-sky-500 hover:text-sky-600 shrink-0">Change</button>
              </div>
            </div>

            {/* Duration notice */}
            {totalDurationMinutes > (availability?.slot_duration || 30) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-700 text-xs">
                  Your selected services take <strong>{totalDurationMinutes} minutes</strong>. Available times show slots where this full block fits before closing time.
                </p>
              </div>
            )}

            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Available Dates</p>
              {availableDates.length === 0 ? (
                <div className="card p-6 text-center text-slate-400 text-sm">No available dates. Contact the clinic directly.</div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDates.map(d => {
                    const isSelected = selectedDate?.toDateString() === d.toDateString()
                    return (
                      <button key={d.toISOString()}
                        onClick={() => { setSelectedDate(d); setSelectedTime(null); setBookedSlots([]) }}
                        className={`py-2.5 rounded-xl text-center border transition-all hover:-translate-y-0.5
                          ${isSelected ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200' : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'}`}>
                        <p className="text-xs opacity-70">{format(d, 'EEE')}</p>
                        <p className="font-display font-bold text-lg leading-tight">{format(d, 'd')}</p>
                        <p className="text-xs opacity-70">{format(d, 'MMM')}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Available Times — {format(selectedDate, 'EEEE, MMM d')}
                </p>
                {timeSlots.length === 0 ? (
                  <div className="card p-4 text-center text-slate-400 text-sm">
                    No time slots for this day that can fit all your selected services.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map(t => {
                      const isSelected = selectedTime?.value === t.value
                      return (
                        <button key={t.value} onClick={() => setSelectedTime(t)}
                          className={`py-2.5 px-3 rounded-xl text-sm font-semibold text-center border transition-all hover:-translate-y-0.5
                            ${isSelected ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200' : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'}`}>
                          <div>{t.label}</div>
                          <div className={`text-xs mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>until {t.endLabel}</div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}
              className="btn btn-primary btn-lg w-full">
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="font-display font-bold text-slate-900 text-2xl">Confirm Booking</h2>
              <p className="text-slate-500 text-sm mt-1">Review your appointment details</p>
            </div>

            <div className="card p-5 mb-4">
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400 text-sm w-16 shrink-0">Clinic</span>
                <span className="font-semibold text-slate-800 text-sm">{clinic?.name}</span>
              </div>
              <div className="flex items-start gap-3 py-3 border-b border-slate-100">
                <Stethoscope className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm w-16 shrink-0">Services</span>
                <div className="flex flex-col gap-1.5 flex-1">
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-sm">{s.name}</span>
                      <span className="text-sky-600 font-bold text-sm">₱{parseFloat(s.price||0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between">
                    <span className="text-slate-500 text-xs">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} · {totalDurationMinutes} min</span>
                    <span className="font-display font-bold text-sky-700">₱{totalPrice.toLocaleString()} total</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400 text-sm w-16">Date</span>
                <span className="font-semibold text-slate-800 text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400 text-sm w-16">Time</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedTime?.label} – {selectedTime?.endLabel}</span>
              </div>
              <div className="flex items-center gap-3 py-3">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400 text-sm w-16">Patient</span>
                <span className="font-semibold text-slate-800 text-sm">{profile?.full_name}</span>
              </div>
            </div>

            <div className="card p-4 mb-4">
              <Field label="Additional Notes">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Allergies, concerns, or anything we should know..."
                  className="input resize-none" />
              </Field>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-2.5 text-sm text-emerald-700">
              <Mail className="w-4 h-4 shrink-0" />
              A confirmation email will be sent to <strong>{user?.email}</strong>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-5 flex items-start gap-2 text-xs text-sky-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Your appointment will be sent as a request. The clinic will confirm it shortly.
            </div>

            <button onClick={handleConfirmBooking} disabled={booking} className="btn btn-primary btn-lg w-full">
              {booking
                ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Booking...</>
                : 'Confirm Appointment'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
