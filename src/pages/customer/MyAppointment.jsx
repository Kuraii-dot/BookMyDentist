import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { SubmitReview } from '../../components/Reviews'
import {
  Calendar, Clock, ChevronDown, Building2, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Trophy, Ban, DollarSign
} from 'lucide-react'
import { PageHeader, EmptyState, StatusBadge, SkeletonCard } from '../../components/ui/shared'

const STATUS_ICON = {
  pending:             { Icon: AlertCircle,  cls: 'text-amber-500 animate-pulse' },
  accepted:            { Icon: CheckCircle2, cls: 'text-emerald-500' },
  rejected:            { Icon: XCircle,      cls: 'text-red-500' },
  rescheduled:         { Icon: RefreshCw,    cls: 'text-blue-500 animate-spin' },
  reschedule_accepted: { Icon: CheckCircle2, cls: 'text-emerald-500' },
  reschedule_declined: { Icon: XCircle,      cls: 'text-red-500' },
  completed:           { Icon: Trophy,       cls: 'text-violet-500' },
  cancelled:           { Icon: Ban,          cls: 'text-slate-400' },
}

export default function MyAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [expanded, setExpanded]         = useState(null)

  useEffect(() => {
    if (!user?.id) return
    fetchAppointments()
  }, [user])

  async function fetchAppointments() {
    if (!user?.id) return

    const { data } = await supabase
      .from('appointments')
      .select(`
        id, clinic_id, status, appointment_date, appointment_time, rescheduled_date,
        rescheduled_time, rejection_reason, created_at,
        clinics(id, name, logo_url), services(id, name, price)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    setAppointments(data||[])
    setLoading(false)
  }

  async function respondToReschedule(appt, accept) {
    setActionLoading(appt.id)
    const newStatus = accept ? 'reschedule_accepted' : 'reschedule_declined'
    const { error } = await supabase.from('appointments').update({status:newStatus}).eq('id',appt.id)
    if (error) { toast.error('Failed to respond'); setActionLoading(null); return }
    const { data: clinicData } = await supabase.from('clinics').select('owner_id').eq('id',appt.clinic_id).single()
    await supabase.from('notifications').insert({
      recipient_id: clinicData.owner_id,
      appointment_id: appt.id,
      type: accept?'reschedule_accepted':'reschedule_declined',
      title: accept?'Reschedule Accepted':'Reschedule Declined',
      message: accept
        ? `The patient accepted the rescheduled appointment on ${format(new Date(appt.rescheduled_date),'MMM d, yyyy')} at ${appt.rescheduled_time}.`
        : 'The patient declined the rescheduled appointment.'
    })
    toast.success(accept?'Reschedule accepted!':'Reschedule declined.')
    fetchAppointments()
    setActionLoading(null)
  }

  if (loading) return (
    <div className="space-y-3">
      <div className="skeleton h-8 w-40 mb-6"/>
      {[1,2,3].map(i=><SkeletonCard key={i}/>)}
    </div>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Appointments" subtitle={`${appointments.length} appointment${appointments.length!==1?'s':''} total`}/>

      {appointments.length===0 ? (
        <EmptyState
          icon={<Calendar className="w-7 h-7 text-slate-300"/>}
          title="No appointments yet"
          description="Book your first appointment to get started"/>
      ) : (
        <div className="space-y-2">
          {appointments.map(appt => {
            const si = STATUS_ICON[appt.status] || STATUS_ICON.pending
            const isExpanded = expanded === appt.id
            const needsRescheduleResponse = appt.status === 'rescheduled'

            return (
              <div key={appt.id}
                className={`card overflow-hidden transition-all
                  ${needsRescheduleResponse ? 'border-l-4 border-l-blue-400' : ''}
                `}>

                {/* ── Compact header row ── */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={()=>setExpanded(isExpanded ? null : appt.id)}>

                  {/* Clinic logo */}
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                    {appt.clinics?.logo_url
                      ? <img src={appt.clinics.logo_url} alt="" className="w-full h-full object-cover"/>
                      : <Building2 className="w-4 h-4 text-slate-400"/>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{appt.clinics?.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span className="text-sky-600 font-medium">{appt.services?.name}</span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3"/>
                        {format(new Date(appt.appointment_date),'MMM d, yyyy')}
                      </span>
                      {appt.appointment_time && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3"/>{appt.appointment_time}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <si.Icon className={`w-3.5 h-3.5 ${si.cls}`}/>
                      <StatusBadge status={appt.status}/>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isExpanded?'rotate-180':''}`}/>
                  </div>
                </div>

                {/* ── Expanded detail panel ── */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3 animate-fade-in bg-slate-50/50">

                    {/* Date grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Requested</p>
                        <p className="font-semibold text-slate-800 text-sm">{format(new Date(appt.appointment_date),'EEEE, MMM d, yyyy')}</p>
                        {appt.appointment_time && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3"/>{appt.appointment_time}
                          </p>
                        )}
                      </div>
                      {appt.rescheduled_date && (
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Rescheduled To</p>
                          <p className="font-semibold text-blue-800 text-sm">{format(new Date(appt.rescheduled_date),'EEEE, MMM d, yyyy')}</p>
                          {appt.rescheduled_time && (
                            <p className="text-xs text-blue-500 mt-0.5">{appt.rescheduled_time}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    {appt.services?.price && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400"/>
                        ₱{parseFloat(appt.services.price).toLocaleString()}
                      </p>
                    )}

                    {/* Rejection reason */}
                    {appt.rejection_reason && (
                      <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                        <p className="text-xs font-semibold text-red-600 mb-0.5">Reason for decline</p>
                        <p className="text-red-500 text-sm">{appt.rejection_reason}</p>
                      </div>
                    )}

                    {/* Reschedule response */}
                    {appt.status==='rescheduled' && (
                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-blue-800 text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin"/>
                          Clinic proposed a new time — do you accept?
                        </p>
                        <div className="flex gap-2">
                          <button onClick={()=>respondToReschedule(appt,true)}
                            disabled={actionLoading===appt.id}
                            className="flex-1 btn btn-primary btn-sm flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5"/> Accept
                          </button>
                          <button onClick={()=>respondToReschedule(appt,false)}
                            disabled={actionLoading===appt.id}
                            className="flex-1 btn btn-secondary btn-sm text-red-500 hover:bg-red-50 flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5"/> Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Review */}
                    {appt.status==='completed' && (
                      <div className="pt-2 border-t border-slate-100">
                        <SubmitReview
                          appointmentId={appt.id}
                          clinicId={appt.clinic_id}
                          customerId={user.id}
                          onSubmitted={fetchAppointments}
                        />
                      </div>
                    )}

                    <p className="text-xs text-slate-400">Booked on {format(new Date(appt.created_at),'MMM d, yyyy')}</p>
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
