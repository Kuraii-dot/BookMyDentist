import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
]

export default function BookAppointment() {
  const { clinicId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [clinic, setClinic] = useState(null)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: service, 2: datetime, 3: confirm

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', clinicId).single(),
        supabase.from('services').select('*').eq('clinic_id', clinicId).eq('is_active', true)
      ])
      setClinic(c)
      setServices(s || [])
    }
    load()
  }, [clinicId])

  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const maxDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')

  async function handleBook() {
    setLoading(true)
    try {
      // Create appointment
      const { data: appt, error: apptError } = await supabase.from('appointments').insert({
        clinic_id: clinicId,
        service_id: selectedService.id,
        customer_id: user.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        notes,
        status: 'pending'
      }).select().single()

      if (apptError) throw apptError

      // Notify clinic owner
      const { data: clinicData } = await supabase.from('clinics').select('owner_id').eq('id', clinicId).single()
      await supabase.from('notifications').insert({
        recipient_id: clinicData.owner_id,
        appointment_id: appt.id,
        type: 'new_booking',
        title: 'New Appointment Request',
        message: `${profile.full_name} wants to book ${selectedService.name} on ${format(new Date(selectedDate), 'MMM d, yyyy')} at ${selectedTime}.`
      })

      toast.success('Appointment booked! Waiting for clinic confirmation.')
      navigate('/dashboard/appointments')
    } catch (err) {
      toast.error(err.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  if (!clinic) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-2 text-stone-500 hover:text-amber-600 text-sm font-medium mb-6 transition-colors">
        ← {step > 1 ? 'Back' : 'All Clinics'}
      </button>

      {/* Clinic header */}
      <div className="bg-white rounded-2xl border border-amber-100 p-4 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">🦷</div>
        <div>
          <h2 className="font-bold text-stone-800">{clinic.name}</h2>
          <p className="text-stone-500 text-sm">📍 {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['Service', 'Date & Time', 'Confirm'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step > i + 1 ? 'bg-green-400 text-white' : step === i + 1 ? 'bg-amber-400 text-white' : 'bg-amber-100 text-amber-400'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${step === i + 1 ? 'text-amber-700' : 'text-stone-400'}`}>{s}</span>
            {i < 2 && <div className="w-8 h-px bg-amber-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div>
          <h3 className="font-bold text-stone-800 mb-4">Choose a Service</h3>
          {services.length === 0 ? (
            <p className="text-stone-400 text-sm">No services available</p>
          ) : (
            <div className="space-y-3">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedService?.id === s.id ? 'border-amber-400 bg-amber-50' : 'border-amber-100 bg-white hover:border-amber-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-stone-800">{s.name}</p>
                      {s.description && <p className="text-stone-500 text-sm mt-0.5">{s.description}</p>}
                      {s.duration_minutes && <p className="text-stone-400 text-xs mt-1">⏱ {s.duration_minutes} mins</p>}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {s.price && <p className="font-bold text-amber-600">₱{parseFloat(s.price).toLocaleString()}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            disabled={!selectedService}
            onClick={() => setStep(2)}
            className="w-full mt-5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div>
          <h3 className="font-bold text-stone-800 mb-4">Pick a Date & Time</h3>
          <div className="bg-white rounded-2xl border border-amber-100 p-4 mb-4">
            <label className="block text-sm font-semibold text-stone-700 mb-2">Date</label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {selectedDate && (
            <div className="bg-white rounded-2xl border border-amber-100 p-4 mb-4">
              <label className="block text-sm font-semibold text-stone-700 mb-3">Time Slot</label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${selectedTime === t ? 'bg-amber-400 text-white border-amber-400' : 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-amber-100 p-4 mb-4">
            <label className="block text-sm font-semibold text-stone-700 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any concerns or details for the clinic..."
              rows={3}
              className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
            />
          </div>

          <button
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep(3)}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Review Booking
          </button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div>
          <h3 className="font-bold text-stone-800 mb-4">Confirm Your Booking</h3>
          <div className="bg-white rounded-2xl border border-amber-100 p-5 space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Clinic</span>
              <span className="font-semibold text-stone-800">{clinic.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Service</span>
              <span className="font-semibold text-stone-800">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Rate</span>
              <span className="font-semibold text-amber-600">₱{selectedService?.price ? parseFloat(selectedService.price).toLocaleString() : 'TBD'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Duration</span>
              <span className="font-semibold text-stone-800">{selectedService?.duration_minutes} mins</span>
            </div>
            <hr className="border-amber-100" />
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Date</span>
              <span className="font-semibold text-stone-800">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Time</span>
              <span className="font-semibold text-stone-800">{selectedTime}</span>
            </div>
            {notes && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Notes</span>
                <span className="font-semibold text-stone-800 text-right max-w-[180px]">{notes}</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50 rounded-xl p-3 mb-5 border border-amber-100">
            <p className="text-amber-700 text-xs text-center">📋 Your booking will be sent to the clinic for approval. You'll be notified once confirmed.</p>
          </div>

          <button
            disabled={loading}
            onClick={handleBook}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking...</> : '✓ Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  )
}