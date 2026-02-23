import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { SubmitReview } from '../../components/Reviews'

const STATUS_CONFIG = {
  pending:             { label: 'Pending',             bg: 'bg-amber-100',  text: 'text-amber-700',  icon: '⏳' },
  accepted:            { label: 'Accepted',            bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅' },
  rejected:            { label: 'Declined',            bg: 'bg-red-100',    text: 'text-red-600',    icon: '❌' },
  rescheduled:         { label: 'Rescheduled',         bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '🔄' },
  reschedule_accepted: { label: 'Reschedule Accepted', bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅' },
  reschedule_declined: { label: 'Reschedule Declined', bg: 'bg-red-100',    text: 'text-red-600',    icon: '❌' },
  completed:           { label: 'Completed',           bg: 'bg-purple-100', text: 'text-purple-700', icon: '🎉' },
  cancelled:           { label: 'Cancelled',           bg: 'bg-stone-100',  text: 'text-stone-500',  icon: '🚫' },
}

export default function MyAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [reviewRefresh, setReviewRefresh] = useState(0)

  useEffect(() => { fetchAppointments() }, [user])

  async function fetchAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*, clinics(*), services(*)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    setAppointments(data || [])
    setLoading(false)
  }

  async function respondToReschedule(appt, accept) {
    setActionLoading(appt.id)
    const newStatus = accept ? 'reschedule_accepted' : 'reschedule_declined'
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', appt.id)
    if (error) { toast.error('Failed to respond'); setActionLoading(null); return }

    const { data: clinicData } = await supabase.from('clinics').select('owner_id').eq('id', appt.clinic_id).single()
    await supabase.from('notifications').insert({
      recipient_id: clinicData.owner_id,
      appointment_id: appt.id,
      type: accept ? 'reschedule_accepted' : 'reschedule_declined',
      title: accept ? 'Reschedule Accepted' : 'Reschedule Declined',
      message: accept
        ? `The patient accepted the rescheduled appointment on ${format(new Date(appt.rescheduled_date), 'MMM d, yyyy')} at ${appt.rescheduled_time}.`
        : 'The patient declined the rescheduled appointment.'
    })

    toast.success(accept ? 'Reschedule accepted!' : 'Reschedule declined.')
    fetchAppointments()
    setActionLoading(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-stone-800">My Appointments</h1>
        <p className="text-stone-500 mt-1">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} total</p>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-amber-100">
          <span className="text-5xl">📅</span>
          <p className="text-stone-500 mt-4 font-medium">No appointments yet</p>
          <p className="text-stone-400 text-sm mt-1">Book your first appointment to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(appt => {
            const st = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending
            return (
              <div key={appt.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                {/* Clinic banner */}
                {appt.clinics?.banner_url && (
                  <div className="h-24 rounded-xl overflow-hidden mb-4 -mx-1">
                    <img src={appt.clinics.banner_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                      {appt.clinics?.logo_url
                        ? <img src={appt.clinics.logo_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-lg">🦷</span>
                      }
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800">{appt.clinics?.name}</h3>
                      <p className="text-stone-500 text-sm">{appt.services?.name}</p>
                    </div>
                  </div>
                  <span className={`${st.bg} ${st.text} text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shrink-0`}>
                    {st.icon} {st.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-stone-400 text-xs mb-0.5">Requested</p>
                    <p className="font-semibold text-stone-700">{format(new Date(appt.appointment_date), 'MMM d, yyyy')}</p>
                    <p className="text-stone-500">{appt.appointment_time}</p>
                  </div>
                  {appt.rescheduled_date && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-blue-400 text-xs mb-0.5">Rescheduled To</p>
                      <p className="font-semibold text-blue-700">{format(new Date(appt.rescheduled_date), 'MMM d, yyyy')}</p>
                      <p className="text-blue-500">{appt.rescheduled_time}</p>
                    </div>
                  )}
                </div>

                {appt.services?.price && (
                  <p className="text-sm text-stone-500 mb-2">💰 ₱{parseFloat(appt.services.price).toLocaleString()}</p>
                )}

                {appt.rejection_reason && (
                  <div className="bg-red-50 rounded-xl p-3 mb-3 border border-red-100">
                    <p className="text-red-600 text-xs font-semibold mb-0.5">Reason for decline:</p>
                    <p className="text-red-500 text-sm">{appt.rejection_reason}</p>
                  </div>
                )}

                {/* Reschedule response */}
                {appt.status === 'rescheduled' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-blue-700 text-sm font-semibold mb-2">Clinic proposed a new time. Do you accept?</p>
                    <div className="flex gap-2">
                      <button onClick={() => respondToReschedule(appt, true)} disabled={actionLoading === appt.id}
                        className="flex-1 bg-green-400 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
                        ✓ Accept
                      </button>
                      <button onClick={() => respondToReschedule(appt, false)} disabled={actionLoading === appt.id}
                        className="flex-1 bg-red-400 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Review section — only for completed appointments */}
                {appt.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-amber-100">
                    <SubmitReview
                      appointmentId={appt.id}
                      clinicId={appt.clinic_id}
                      customerId={user.id}
                      onSubmitted={() => setReviewRefresh(r => r + 1)}
                    />
                  </div>
                )}

                <p className="text-xs text-stone-400 mt-3">Booked on {format(new Date(appt.created_at), 'MMM d, yyyy')}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}