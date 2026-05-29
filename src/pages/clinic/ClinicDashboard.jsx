import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { AlertCircle, Calendar, BarChart2, CheckCircle2, Wrench, Clock, Building2, User, ChevronRight, Users, DollarSign, Activity } from 'lucide-react'
import { StatCard, EmptyState, SectionCard } from '../../components/ui/shared'
import CoverageBadge from '../../components/CoverageBadge'

const STATUS_CONFIG = {
  pending:    { label:'Pending',    cls:'badge-warning' },
  accepted:   { label:'Confirmed',  cls:'badge-success' },
  rejected:   { label:'Declined',   cls:'badge-danger'  },
  completed:  { label:'Completed',  cls:'badge-purple'  },
  cancelled:  { label:'Cancelled',  cls:'badge-gray'    },
  rescheduled:{ label:'Rescheduled',cls:'badge-info'    },
}

const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']
const CLOSED_STATUSES = new Set(['cancelled', 'rejected', 'reschedule_declined'])
const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

function formatPeso(value) {
  return pesoFormatter.format(Number.isFinite(value) ? value : 0)
}

function formatCompactPeso(value) {
  const amount = Number.isFinite(value) ? value : 0
  if (amount >= 1000000) return `${pesoFormatter.format(amount / 1000000)}M`
  if (amount >= 1000) return `${pesoFormatter.format(amount / 1000)}k`
  return pesoFormatter.format(amount)
}

function toNumber(value) {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function getAppointmentServices(appointment) {
  const performed = Array.isArray(appointment.performed_services) ? appointment.performed_services : []
  const selected = Array.isArray(appointment.selected_services) ? appointment.selected_services : []

  const source = performed.length ? performed : selected.length ? selected : appointment.services ? [appointment.services] : []
  return source
    .map((service) => ({
      name: service.name || service.service_name || appointment.services?.name || 'Service',
      price: toNumber(service.price ?? service.cost ?? appointment.services?.price),
    }))
    .filter((service) => service.name)
}

function getAppointmentRevenue(appointment) {
  return getAppointmentServices(appointment).reduce((sum, service) => sum + service.price, 0)
}

function buildDashboardAnalytics(appointments = []) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = startOfMonth(subMonths(now, 5 - index))
    return {
      key: format(date, 'yyyy-MM'),
      label: format(date, 'MMM'),
      customers: 0,
      revenue: 0,
    }
  })

  const monthMap = new Map(months.map((month) => [month.key, month]))
  const serviceMap = new Map()

  appointments.forEach((appointment) => {
    if (!appointment.appointment_date) return

    const month = monthMap.get(format(new Date(`${appointment.appointment_date}T00:00:00`), 'yyyy-MM'))
    if (!month || CLOSED_STATUSES.has(appointment.status)) return

    month.customers += 1

    const services = getAppointmentServices(appointment)
    services.forEach((service) => {
      const current = serviceMap.get(service.name) || { name: service.name, count: 0 }
      current.count += 1
      serviceMap.set(service.name, current)
    })

    if (appointment.status === 'completed') {
      month.revenue += getAppointmentRevenue(appointment)
    }
  })

  const services = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const topServices = services.slice(0, 5)
  const otherCount = services.slice(5).reduce((sum, service) => sum + service.count, 0)
  if (otherCount) topServices.push({ name: 'Other services', count: otherCount })

  return {
    months,
    serviceBreakdown: topServices,
    totalCustomers: months.reduce((sum, month) => sum + month.customers, 0),
    totalRevenue: months.reduce((sum, month) => sum + month.revenue, 0),
    topService: services[0] || null,
  }
}

function ChartEmpty({ title, description }) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <BarChart2 className="w-6 h-6 text-slate-300" />
      </div>
      <p className="font-semibold text-slate-700 text-sm">{title}</p>
      {description && <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto leading-relaxed">{description}</p>}
    </div>
  )
}

function MonthlyCustomersChart({ data }) {
  const maxCustomers = Math.max(...data.map((month) => month.customers), 1)
  const hasData = data.some((month) => month.customers > 0)

  if (!hasData) {
    return <ChartEmpty title="No customer visits yet" description="Bookings from the last six months will appear here." />
  }

  return (
    <div className="px-5 py-5">
      <p className="text-slate-400 text-xs mb-5">Cancelled and declined bookings are excluded.</p>
      <div className="h-44 flex items-end gap-2 sm:gap-3">
        {data.map((month) => {
          const height = month.customers ? Math.max(10, (month.customers / maxCustomers) * 100) : 3
          return (
            <div key={month.key} className="flex-1 min-w-0 flex flex-col items-center gap-2 group">
              <div className="relative w-full h-32 flex items-end">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  {month.customers} visit{month.customers === 1 ? '' : 's'}
                </div>
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-sky-500 to-cyan-300 shadow-sm transition-all duration-500"
                  style={{ height: `${height}%` }}
                  aria-label={`${month.label}: ${month.customers} customer visits`}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-600">{month.label}</p>
                <p className="text-[11px] text-slate-400">{month.customers}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfitHistogram({ data }) {
  const maxRevenue = Math.max(...data.map((month) => month.revenue), 1)
  const hasData = data.some((month) => month.revenue > 0)

  if (!hasData) {
    return <ChartEmpty title="No completed revenue yet" description="Completed appointments with service prices will create the profit histogram." />
  }

  return (
    <div className="px-5 py-5">
      <p className="text-slate-400 text-xs mb-5">Estimated profit uses completed appointment service prices before expenses.</p>
      <div className="h-44 flex items-end gap-2 sm:gap-3">
        {data.map((month) => {
          const height = month.revenue ? Math.max(10, (month.revenue / maxRevenue) * 100) : 3
          return (
            <div key={month.key} className="flex-1 min-w-0 flex flex-col items-center gap-2 group">
              <div className="relative w-full h-32 flex items-end">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  {formatPeso(month.revenue)}
                </div>
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-500 to-lime-300 shadow-sm transition-all duration-500"
                  style={{ height: `${height}%` }}
                  aria-label={`${month.label}: ${formatPeso(month.revenue)} estimated profit`}
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-600">{month.label}</p>
                <p className="text-[11px] text-slate-400">{formatCompactPeso(month.revenue)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ServicesPieChart({ data }) {
  const total = data.reduce((sum, service) => sum + service.count, 0)

  if (!total) {
    return <ChartEmpty title="No booked services yet" description="Service popularity will show once patients start booking." />
  }

  let start = 0
  const gradient = data.map((service, index) => {
    const end = start + (service.count / total) * 360
    const segment = `${CHART_COLORS[index % CHART_COLORS.length]} ${start}deg ${end}deg`
    start = end
    return segment
  }).join(', ')

  return (
    <div className="px-5 py-5">
      <p className="text-slate-400 text-xs mb-5">Based on booked services in the last six months.</p>
      <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-5 items-center">
        <div className="relative w-36 h-36 mx-auto rounded-full shadow-inner" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-5 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
            <p className="font-display font-bold text-2xl text-slate-900">{total}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Bookings</p>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((service, index) => (
            <div key={service.name} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
              <span className="flex-1 min-w-0 truncate text-slate-600">{service.name}</span>
              <span className="font-bold text-slate-900">{service.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalyticsCharts({ analytics }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="section-label mb-0.5">6-Month Customers</p>
            <p className="font-display font-bold text-xl text-slate-900">{analytics.totalCustomers}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="section-label mb-0.5">Estimated Profit</p>
            <p className="font-display font-bold text-xl text-slate-900">{formatPeso(analytics.totalRevenue)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-violet-500" />
          </div>
          <div className="min-w-0">
            <p className="section-label mb-0.5">Top Service</p>
            <p className="font-display font-bold text-xl text-slate-900 truncate">{analytics.topService?.name || 'None yet'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <SectionCard title="Customer Bar Chart" action={<span className="badge badge-info">Last 6 months</span>}>
          <MonthlyCustomersChart data={analytics.months} />
        </SectionCard>
        <SectionCard title="Profit Histogram" action={<span className="badge badge-success">Completed only</span>}>
          <ProfitHistogram data={analytics.months} />
        </SectionCard>
        <SectionCard title="Booked Services Pie Chart" action={<span className="badge badge-purple">Most booked</span>}>
          <ServicesPieChart data={analytics.serviceBreakdown} />
        </SectionCard>
      </div>
    </div>
  )
}

export default function ClinicDashboard() {
  const { user, profile } = useAuth()
  const [clinic, setClinic]           = useState(null)
  const [stats, setStats]             = useState({pending:0,today:0,thisMonth:0,completed:0})
  const [todayAppts, setTodayAppts]   = useState([])
  const [recentAppts, setRecentAppts] = useState([])
  const [analytics, setAnalytics]     = useState(() => buildDashboardAnalytics([]))
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
    const analyticsStart = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')

    const [{ data:all }, { data:analyticsRows }] = await Promise.all([
      supabase.from('appointments')
        .select('*, profiles!appointments_customer_id_fkey(full_name,avatar_url), services(name,price,covered)')
        .eq('clinic_id',c.id).order('appointment_date',{ascending:false}).limit(50),
      supabase.from('appointments')
        .select('id,status,appointment_date,customer_id,guest_name,selected_services,performed_services,services(id,name,price,covered)')
        .eq('clinic_id',c.id)
        .gte('appointment_date', analyticsStart)
        .lte('appointment_date', todayStr)
        .order('appointment_date',{ascending:true})
        .limit(5000),
    ])

    const appts = all||[]
    setAnalytics(buildDashboardAnalytics(analyticsRows || []))
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

      <AnalyticsCharts analytics={analytics} />

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
