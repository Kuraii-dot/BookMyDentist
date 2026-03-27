import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { Calendar, Trophy, Ban, BarChart2, Building2, Clock,
         ChevronRight, AlertCircle, CheckCircle2, XCircle, RefreshCw, Search } from 'lucide-react'
import { StatCard, StatusBadge, EmptyState, SkeletonCard, PageHeader, SectionCard } from '../../components/ui/shared'

function AppointmentRow({ appt, onCancel }) {
  const date = new Date(appt.appointment_date)
  const isUpcoming = !isPast(date) && !['cancelled','rejected'].includes(appt.status)

  return (
    <div className={`flex items-start gap-3 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors
      ${isUpcoming ? 'bg-sky-50/40' : ''}`}>
      {/* Clinic logo */}
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
        {appt.clinics?.logo_url
          ? <img src={appt.clinics.logo_url} alt="" className="w-full h-full object-cover"/>
          : <Building2 className="w-4 h-4 text-slate-400"/>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-slate-900 text-sm">{appt.clinics?.name}</p>
            <p className="text-xs text-sky-600 font-medium mt-0.5">{appt.services?.name}</p>
          </div>
          <StatusBadge status={appt.status}/>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
          <span className={`flex items-center gap-1 ${isToday(date)?'text-red-500 font-medium':isTomorrow(date)?'text-amber-500 font-medium':''}`}>
            <Calendar className="w-3 h-3"/>
            {isToday(date)?'Today':isTomorrow(date)?'Tomorrow':format(date,'MMM d, yyyy')}
          </span>
          {appt.appointment_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{appt.appointment_time}</span>}
          {appt.services?.price && <span className="font-semibold text-slate-600">₱{parseFloat(appt.services.price).toLocaleString()}</span>}
        </div>
        {appt.performed_services?.length > 0 && (
          <div className="mt-2 p-2 rounded-lg bg-sky-50 border border-sky-100 text-xs">
            <span className="font-semibold text-sky-700">Procedures: </span>
            {appt.performed_services.map(p=>p.name).join(', ')}
            <span className="font-bold text-sky-700 ml-2">
              ₱{appt.performed_services.reduce((s,p)=>s+(p.price||0),0).toLocaleString()}
            </span>
          </div>
        )}
        {appt.status==='cancelled' && appt.cancel_reason && (
          <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-xs text-red-600">
            Cancelled by {appt.cancelled_by==='customer'?'you':'clinic'}: {appt.cancel_reason}
          </div>
        )}
        {isUpcoming && ['pending','accepted'].includes(appt.status) && (
          <button onClick={()=>onCancel(appt)}
            className="mt-2 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
            Cancel appointment
          </button>
        )}
      </div>
    </div>
  )
}

export default function CustomerDashboard() {
  const { user, profile } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [showCancelled, setShowCancelled] = useState(false)

  useEffect(()=>{ loadAppointments() },[user])

  async function loadAppointments() {
    const { data } = await supabase.from('appointments')
      .select('*, clinics(name,logo_url,city), services(name,price)')
      .eq('customer_id', user.id)
      .order('appointment_date',{ascending:false}).limit(50)
    setAppointments(data||[])
    setLoading(false)
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return
    setCancelling(true)
    await supabase.from('appointments').update({status:'cancelled',cancelled_by:'customer',cancel_reason:cancelReason}).eq('id',cancelModal.id)
    const { data: clinic } = await supabase.from('clinics').select('owner_id').eq('id',cancelModal.clinic_id).single()
    if (clinic) await supabase.from('notifications').insert({
      recipient_id:clinic.owner_id, type:'appointment_cancelled', title:'Appointment Cancelled',
      message:`${profile?.full_name} cancelled their ${cancelModal.services?.name} on ${format(new Date(cancelModal.appointment_date),'MMM d, yyyy')}. Reason: ${cancelReason}`
    })
    setAppointments(prev=>prev.map(a=>a.id===cancelModal.id?{...a,status:'cancelled',cancelled_by:'customer',cancel_reason:cancelReason}:a))
    setCancelModal(null); setCancelReason(''); setCancelling(false)
  }

  const upcoming  = appointments.filter(a=>!isPast(new Date(a.appointment_date))&&!['cancelled','rejected'].includes(a.status))
  const past      = appointments.filter(a=>(isPast(new Date(a.appointment_date))||['rejected','completed'].includes(a.status))&&a.status!=='cancelled')
  const cancelled = appointments.filter(a=>a.status==='cancelled')
  const hour = new Date().getHours()
  const greeting = hour<12?'Good morning':hour<18?'Good afternoon':'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Welcome banner */}
      <div className="gradient-banner p-6 text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-100 text-sm">{greeting} 👋</p>
            <h1 className="font-display font-bold text-2xl mt-0.5">{profile?.full_name?.split(' ')[0]}</h1>
            <p className="text-sky-100 text-sm mt-1">
              {upcoming.length>0
                ? `You have ${upcoming.length} upcoming appointment${upcoming.length>1?'s':''}`
                : 'No upcoming appointments — book one today!'}
            </p>
          </div>
          <Link to="/dashboard/browse" className="btn btn-secondary btn-md flex items-center gap-2" style={{color:'var(--color-brand)'}}>
            <Search className="w-4 h-4"/> Browse Clinics
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Upcoming"  value={upcoming.length}                                       icon={Calendar}     iconClass="text-sky-500"    bg="bg-sky-50"    loading={loading}/>
        <StatCard label="Completed" value={appointments.filter(a=>a.status==='completed').length} icon={Trophy}       iconClass="text-violet-500" bg="bg-violet-50" loading={loading}/>
        <StatCard label="Cancelled" value={cancelled.length}                                      icon={Ban}          iconClass="text-slate-400"  bg="bg-slate-100" loading={loading}/>
        <StatCard label="Total"     value={appointments.length}                                   icon={BarChart2}    iconClass="text-amber-500"  bg="bg-amber-50"  loading={loading}/>
      </div>

      {/* Upcoming appointments */}
      <SectionCard
        title="Upcoming Appointments"
        action={upcoming.length>0 && <span className="badge badge-teal">{upcoming.length}</span>}>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2].map(i=><SkeletonCard key={i}/>)}</div>
        ) : upcoming.length===0 ? (
          <EmptyState icon={<Calendar className="w-7 h-7 text-slate-300"/>} title="No upcoming appointments"
            description="Find a great clinic near you"
            action={<Link to="/dashboard/browse" className="btn btn-primary btn-sm">Browse Clinics</Link>}/>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map(a=><AppointmentRow key={a.id} appt={a} onCancel={setCancelModal}/>)}
          </div>
        )}
      </SectionCard>

      {/* Past appointments */}
      {past.length>0 && (
        <SectionCard
          title="Past Appointments"
          action={
            <Link to="/dashboard/appointments" className="flex items-center gap-1 text-xs font-semibold text-sky-500 hover:text-sky-600">
              View all <ChevronRight className="w-3.5 h-3.5"/>
            </Link>
          }>
          <div className="divide-y divide-slate-100">
            {past.slice(0,3).map(a=><AppointmentRow key={a.id} appt={a} onCancel={setCancelModal}/>)}
          </div>
          {past.length>3 && (
            <Link to="/dashboard/appointments"
              className="flex items-center justify-center gap-1 py-3 text-xs font-semibold text-sky-500 hover:bg-slate-50 border-t border-slate-100 transition-colors">
              View all {past.length} past appointments <ChevronRight className="w-3.5 h-3.5"/>
            </Link>
          )}
        </SectionCard>
      )}

      {/* Cancelled (collapsible) */}
      {cancelled.length>0 && (
        <SectionCard
          title={
            <button onClick={()=>setShowCancelled(p=>!p)} className="flex items-center gap-2 text-slate-500">
              Cancelled <span className="badge badge-gray">{cancelled.length}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showCancelled?'rotate-90':''}`}/>
            </button>
          }>
          {showCancelled && (
            <div className="divide-y divide-slate-100 animate-fade-in">
              {cancelled.map(a=><AppointmentRow key={a.id} appt={a} onCancel={setCancelModal}/>)}
            </div>
          )}
        </SectionCard>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="modal-backdrop" onClick={()=>setCancelModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-900">Cancel Appointment</h3>
              <button onClick={()=>setCancelModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">
                <span className="font-semibold">{cancelModal.clinics?.name}</span> · {cancelModal.services?.name}<br/>
                {format(new Date(cancelModal.appointment_date),'EEEE, MMMM d, yyyy')}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ This cannot be undone. The clinic will be notified.
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Reason *</label>
                <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} rows={3}
                  placeholder="e.g. Schedule conflict..." className="input resize-none"/>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setCancelModal(null)} className="btn btn-secondary btn-md flex-1">Keep It</button>
                <button onClick={handleCancel} disabled={cancelling||!cancelReason.trim()} className="btn btn-danger btn-md flex-1">
                  {cancelling?'Cancelling...':'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}