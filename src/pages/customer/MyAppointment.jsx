import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { SubmitReview } from '../../components/Reviews'
import {
  Calendar, Clock, AlertCircle, CheckCircle2, XCircle,
  RefreshCw, Trophy, Ban, Building2, ChevronDown, DollarSign
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:             { label: 'Pending',             bg: 'bg-amber-50',  text: 'text-amber-600',  border:'border-amber-200',  Icon: AlertCircle,  iconClass:'text-amber-500 animate-pulse' },
  accepted:            { label: 'Confirmed',           bg: 'bg-green-50',  text: 'text-green-700',  border:'border-green-200',  Icon: CheckCircle2, iconClass:'text-green-500' },
  rejected:            { label: 'Declined',            bg: 'bg-red-50',    text: 'text-red-600',    border:'border-red-200',    Icon: XCircle,      iconClass:'text-red-500' },
  rescheduled:         { label: 'Rescheduled',         bg: 'bg-blue-50',   text: 'text-blue-700',   border:'border-blue-200',   Icon: RefreshCw,    iconClass:'text-blue-500 animate-spin' },
  reschedule_accepted: { label: 'Reschedule Confirmed',bg: 'bg-green-50',  text: 'text-green-700',  border:'border-green-200',  Icon: CheckCircle2, iconClass:'text-green-500' },
  reschedule_declined: { label: 'Reschedule Declined', bg: 'bg-red-50',    text: 'text-red-600',    border:'border-red-200',    Icon: XCircle,      iconClass:'text-red-500' },
  completed:           { label: 'Completed',           bg: 'bg-violet-50', text: 'text-violet-700', border:'border-violet-200', Icon: Trophy,       iconClass:'text-violet-500' },
  cancelled:           { label: 'Cancelled',           bg: 'bg-slate-50',  text: 'text-slate-500',  border:'border-slate-200',  Icon: Ban,          iconClass:'text-slate-400' },
}

export default function MyAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [reviewRefresh, setReviewRefresh] = useState(0)
  const [expanded, setExpanded] = useState(null)

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
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}}/>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Calendar className="w-6 h-6 text-sky-500"/> My Appointments
        </h1>
        <p className="page-subtitle">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} total</p>
      </div>

      {appointments.length === 0 ? (
        <div className="card p-14 text-center">
          <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-sky-200"/>
          </div>
          <p className="text-slate-600 font-semibold">No appointments yet</p>
          <p className="text-slate-400 text-sm mt-1">Book your first appointment to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => {
            const st = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending
            const isExpanded = expanded === appt.id
            const needsRescheduleResponse = appt.status === 'rescheduled'

            return (
              <div key={appt.id} className={`card overflow-hidden transition-all hover:shadow-md ${needsRescheduleResponse ? 'border-blue-200 border-l-4 border-l-blue-400' : ''}`}>

                {/* ── Compact header row (always visible) ── */}
                <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : appt.id)}>

                  {/* Clinic logo */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-sky-50 border border-sky-100">
                    {appt.clinics?.logo_url
                      ? <img src={appt.clinics.logo_url} alt="" className="w-full h-full object-cover"/>
                      : <Building2 className="w-5 h-5 text-sky-400"/>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{appt.clinics?.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span className="text-sky-600 font-medium">{appt.services?.name}</span>
                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3"/>{format(new Date(appt.appointment_date), 'MMM d, yyyy')}</span>
                      {appt.appointment_time && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3"/>{appt.appointment_time}</span>}
                    </div>
                  </div>

                  {/* Status + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`${st.bg} ${st.text} border ${st.border} text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1`}>
                      <st.Icon className={`w-3 h-3 ${st.iconClass}`}/>
                      {st.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                  </div>
                </div>

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3 animate-fade-in">

                    {/* Date grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-sky-50 rounded-xl p-3">
                        <p className="text-slate-400 text-xs mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3"/>Requested</p>
                        <p className="font-semibold text-slate-700">{format(new Date(appt.appointment_date), 'MMM d, yyyy')}</p>
                        {appt.appointment_time && <p className="text-slate-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3"/>{appt.appointment_time}</p>}
                      </div>
                      {appt.rescheduled_date && (
                        <div className="bg-blue-50 rounded-xl p-3">
                          <p className="text-blue-400 text-xs mb-0.5 flex items-center gap-1"><RefreshCw className="w-3 h-3"/>Rescheduled To</p>
                          <p className="font-semibold text-blue-700">{format(new Date(appt.rescheduled_date), 'MMM d, yyyy')}</p>
                          {appt.rescheduled_time && <p className="text-blue-500 text-xs">{appt.rescheduled_time}</p>}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    {appt.services?.price && (
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-sky-400"/>
                        ₱{parseFloat(appt.services.price).toLocaleString()}
                      </p>
                    )}

                    {/* Decline reason */}
                    {appt.rejection_reason && (
                      <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                        <p className="text-red-600 text-xs font-semibold mb-0.5">Reason for decline:</p>
                        <p className="text-red-500 text-sm">{appt.rejection_reason}</p>
                      </div>
                    )}

                    {/* Reschedule response */}
                    {appt.status === 'rescheduled' && (
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-blue-700 text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin"/> Clinic proposed a new time. Accept?
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => respondToReschedule(appt, true)} disabled={actionLoading === appt.id}
                            className="flex-1 btn btn-primary btn-sm">
                            <CheckCircle2 className="w-3.5 h-3.5"/> Accept
                          </button>
                          <button onClick={() => respondToReschedule(appt, false)} disabled={actionLoading === appt.id}
                            className="flex-1 btn btn-secondary btn-sm text-red-500 hover:bg-red-50">
                            <XCircle className="w-3.5 h-3.5"/> Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Review */}
                    {appt.status === 'completed' && (
                      <div className="pt-2 border-t border-slate-100">
                        <SubmitReview
                          appointmentId={appt.id}
                          clinicId={appt.clinic_id}
                          customerId={user.id}
                          onSubmitted={() => setReviewRefresh(r => r + 1)}
                        />
                      </div>
                    )}

                    <p className="text-xs text-slate-400">Booked on {format(new Date(appt.created_at), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}