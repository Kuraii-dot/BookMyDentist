import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { AlertCircle, Calendar, BarChart2, CheckCircle2, Wrench, Clock, Building2, User, ChevronRight } from 'lucide-react'
import { StatCard, StatusBadge, EmptyState, SectionCard, PageHeader, SkeletonRows } from '../../components/ui/shared'
import CoverageBadge from '../../components/CoverageBadge'

const STATUS_CONFIG = {
  pending:    { label:'Pending',    cls:'badge-warning' },
  accepted:   { label:'Confirmed',  cls:'badge-success' },
  rejected:   { label:'Declined',   cls:'badge-danger'  },
  completed:  { label:'Completed',  cls:'badge-purple'  },
  cancelled:  { label:'Cancelled',  cls:'badge-gray'    },
  rescheduled:{ label:'Rescheduled',cls:'badge-info'    },
}

export default function ClinicDashboard() {
  const { user, profile } = useAuth()
  const [clinic, setClinic]           = useState(null)
  const [stats, setStats]             = useState({pending:0,today:0,thisMonth:0,completed:0})
  const [todayAppts, setTodayAppts]   = useState([])
  const [recentAppts, setRecentAppts] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!user?.id) return

    loadData()

    // AJAX-style polling fallback so dashboard stays fresh even if realtime drops.
    const intervalId = setInterval(loadData, 20000)
    return () => clearInterval(intervalId)
  }, [user?.id])

  useEffect(() => {
    if (!clinic?.id) return

    // Realtime updates for new/updated appointments in this clinic.
    const channel = supabase
      .channel(`clinic-dashboard-${clinic.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `clinic_id=eq.${clinic.id}` },
        () => loadData()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clinic?.id])

  async function loadData() {
    if (!user?.id) return

    const { data:c } = await supabase.from('clinics').select('*').eq('owner_id',user.id).maybeSingle()
    setClinic(c)
    if (!c) { setLoading(false); return }
    const now = new Date()
    const todayStr = format(now,'yyyy-MM-dd')
    const monthStart = format(startOfMonth(now),'yyyy-MM-dd')
    const monthEnd   = format(endOfMonth(now),'yyyy-MM-dd')
    const { data:all } = await supabase.from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(full_name,avatar_url), services(name,price,covered)')
      .eq('clinic_id',c.id).order('appointment_date',{ascending:false}).limit(50)
    const appts = all||[]
    setStats({
      pending:   appts.filter(a=>a.status==='pending').length,
      today:     appts.filter(a=>a.appointment_date===todayStr).length,
      thisMonth: appts.filter(a=>a.appointment_date>=monthStart&&a.appointment_date<=monthEnd).length,
      completed: appts.filter(a=>a.status==='completed').length,
    })
    setTodayAppts(appts.filter(a=>a.appointment_date===todayStr))
    setRecentAppts(appts.slice(0,6))
    setLoading(false)
  }

  const hour = new Date().getHours()
  const greeting = hour<12?'Good morning':hour<18?'Good afternoon':'Good evening'

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}}/>
    </div>
  )

  const quickLinks = [
    { to:'/clinic/appointments', Icon:Calendar,  label:'Appointments', iconClass:'text-sky-500',    bg:'bg-sky-50'    },
    { to:'/clinic/services',     Icon:Wrench,    label:'Services',     iconClass:'text-amber-500',  bg:'bg-amber-50'  },
    { to:'/clinic/availability', Icon:Clock,     label:'Schedule',     iconClass:'text-violet-500', bg:'bg-violet-50' },
    { to:'/clinic/profile',      Icon:Building2, label:'Profile',      iconClass:'text-emerald-500',bg:'bg-emerald-50'},
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Welcome banner */}
      <div className="gradient-banner p-6 text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-100 text-sm">{greeting} 👋</p>
            <h1 className="font-display font-bold text-2xl mt-0.5">{clinic?.name||profile?.full_name}</h1>
            <p className="text-sky-100 text-sm mt-1">
              {stats.pending>0
                ? `${stats.pending} request${stats.pending>1?'s':''} awaiting your response`
                : 'All caught up — no pending requests!'}
            </p>
          </div>
          {stats.pending>0 && (
            <Link to="/clinic/appointments" className="btn btn-secondary btn-md flex items-center gap-2" style={{color:'var(--color-brand)'}}>
              Review Requests <ChevronRight className="w-4 h-4"/>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending"    value={stats.pending}   icon={AlertCircle}  iconClass="text-amber-500 animate-pulse" bg="bg-amber-50"   loading={loading}/>
        <StatCard label="Today"      value={stats.today}     icon={Calendar}     iconClass="text-sky-500"                 bg="bg-sky-50"     loading={loading}/>
        <StatCard label="This Month" value={stats.thisMonth} icon={BarChart2}    iconClass="text-violet-500"              bg="bg-violet-50"  loading={loading}/>
        <StatCard label="Completed"  value={stats.completed} icon={CheckCircle2} iconClass="text-emerald-500"             bg="bg-emerald-50" loading={loading}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's schedule */}
        <SectionCard
          title={`Today's Schedule — ${format(new Date(),'MMM d')}`}
          action={<span className="badge badge-teal">{todayAppts.length} appt{todayAppts.length!==1?'s':''}</span>}>
          {todayAppts.length===0 ? (
            <EmptyState icon={<Calendar className="w-6 h-6 text-slate-300"/>} title="No appointments today"/>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayAppts.map(a=>{
                const st = STATUS_CONFIG[a.status]||STATUS_CONFIG.pending
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center shrink-0 overflow-hidden border border-sky-100">
                      {a.profiles?.avatar_url
                        ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover"/>
                        : <User className="w-3.5 h-3.5 text-sky-400"/>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{a.profiles?.full_name}</p>
                      <p className="text-sky-600 text-xs inline-flex items-center gap-1.5 flex-wrap">
                        {a.services?.name}
                        {a.services && <CoverageBadge value={a.services.covered} className="text-xs" />}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {a.appointment_time && <p className="text-slate-500 text-xs flex items-center gap-1 justify-end"><Clock className="w-3 h-3"/>{a.appointment_time}</p>}
                      <span className={`badge ${st.cls} mt-0.5`}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* Recent activity */}
        <SectionCard
          title="Recent Activity"
          action={<Link to="/clinic/appointments" className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-0.5">View all <ChevronRight className="w-3.5 h-3.5"/></Link>}>
          {recentAppts.length===0 ? (
            <EmptyState icon={<BarChart2 className="w-6 h-6 text-slate-300"/>} title="No appointments yet"/>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAppts.map(a=>{
                const st = STATUS_CONFIG[a.status]||STATUS_CONFIG.pending
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center shrink-0 overflow-hidden border border-sky-100">
                      {a.profiles?.avatar_url
                        ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full object-cover"/>
                        : <User className="w-3.5 h-3.5 text-sky-400"/>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{a.profiles?.full_name}</p>
                      <p className="text-slate-400 text-xs inline-flex items-center gap-1.5 flex-wrap">
                        {a.services?.name} · {format(new Date(a.appointment_date),'MMM d')}
                        {a.services && <CoverageBadge value={a.services.covered} className="text-xs" />}
                      </p>
                    </div>
                    <span className={`badge ${st.cls} shrink-0`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickLinks.map(l=>(
          <Link key={l.to} to={l.to}
            className="card p-4 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className={`w-10 h-10 ${l.bg} rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110`}>
              <l.Icon className={`w-5 h-5 ${l.iconClass}`}/>
            </div>
            <span className="text-xs font-semibold text-slate-600 group-hover:text-sky-600 transition-colors">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
