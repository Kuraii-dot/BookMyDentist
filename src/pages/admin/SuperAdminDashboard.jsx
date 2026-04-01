import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { sendClinicApprovedEmail, sendClinicRejectedEmail } from '../../lib/email'
import { Building2, Users, User, Calendar, Search, LogOut, CheckCircle2, XCircle } from 'lucide-react'
import { StatCard, EmptyState, Modal, Field, Alert, SkeletonRows, TableWrapper, TableHead, StatusBadge, PageHeader } from '../../components/ui/shared'

const TABS = [
  { key:'pending',      label:'Pending Clinics' },
  { key:'active',       label:'Active Clinics'  },
  { key:'owners',       label:'Clinic Owners'   },
  { key:'customers',    label:'Customers'       },
  { key:'appointments', label:'Appointments'    },
]

// ── Pending Clinics ───────────────────────────────────────────────────────────
function PendingTab({ onRefreshStats }) {
  const [clinics, setClinics]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [rejectModal, setRejectModal]   = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(()=>{
    supabase.from('clinics')
      .select('*, profiles!clinics_owner_id_fkey(id,full_name,email)')
      .eq('verification_status','pending').order('created_at')
      .then(({data})=>{ setClinics(data||[]); setLoading(false) })
  },[])

  async function approve(clinic) {
    setActionLoading(clinic.id)
    await supabase.from('clinics').update({verification_status:'approved',is_active:true}).eq('id',clinic.id)
    await supabase.from('notifications').insert({
      recipient_id:clinic.profiles.id, type:'accepted',
      title:'Clinic Approved!',
      message:`Your clinic "${clinic.name}" has been approved and is now live on BookMyDentistPH!`
    })
    await sendClinicApprovedEmail?.({to:clinic.profiles.email, ownerName:clinic.profiles.full_name, clinicName:clinic.name})
    toast.success(`${clinic.name} approved!`)
    setClinics(p=>p.filter(c=>c.id!==clinic.id))
    setActionLoading(null); onRefreshStats()
  }

  async function reject() {
    if (!rejectReason.trim()) { toast.error('Please add a reason'); return }
    setActionLoading(rejectModal.id)
    await supabase.from('clinics').update({verification_status:'rejected',rejection_reason:rejectReason}).eq('id',rejectModal.id)
    await supabase.from('notifications').insert({
      recipient_id:rejectModal.profiles.id, type:'rejected',
      title:'Clinic Not Approved',
      message:`Your clinic "${rejectModal.name}" was not approved. Reason: ${rejectReason}`
    })
    await sendClinicRejectedEmail?.({to:rejectModal.profiles.email, ownerName:rejectModal.profiles.full_name, reason:rejectReason, clinicName:rejectModal.name})
    toast.success('Rejected & owner notified')
    setClinics(p=>p.filter(c=>c.id!==rejectModal.id))
    setRejectModal(null); setRejectReason(''); setActionLoading(null); onRefreshStats()
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}}/></div>

  return (
    <>
      {clinics.length===0 ? (
        <EmptyState icon={<CheckCircle2 className="w-7 h-7 text-emerald-300"/>} title="All caught up!" description="No pending clinic applications."/>
      ) : (
        <div className="space-y-3">
          {clinics.map(c=>(
            <div key={c.id} className="card p-5 border-l-4 border-l-amber-400">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                  {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover"/> : <Building2 className="w-6 h-6 text-slate-300"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-base">{c.name}</h3>
                      <p className="text-slate-400 text-sm">{c.address}{c.city?`, ${c.city}`:''}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Owner: <span className="font-medium text-slate-600">{c.profiles?.full_name}</span> · {c.profiles?.email}
                      </p>
                      <p className="text-slate-300 text-xs mt-0.5">Submitted {format(new Date(c.created_at),'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={()=>approve(c)} disabled={actionLoading===c.id}
                        className="btn btn-primary btn-sm flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/>Approve</button>
                      <button onClick={()=>setRejectModal(c)} disabled={actionLoading===c.id}
                        className="btn btn-secondary btn-sm text-red-500 hover:bg-red-50 flex items-center gap-1"><XCircle className="w-3.5 h-3.5"/>Reject</button>
                    </div>
                  </div>
                  {c.description && <p className="text-slate-500 text-sm mt-2 bg-slate-50 rounded-xl p-3">{c.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!rejectModal} onClose={()=>{setRejectModal(null);setRejectReason('')}} title="Reject Clinic Application">
        <p className="text-slate-600 text-sm mb-4"><strong>{rejectModal?.name}</strong> · {rejectModal?.profiles?.email}</p>
        <Field label="Reason for rejection" required hint="This will be sent to the clinic owner via email and notification.">
          <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3}
            placeholder="e.g. Missing required documents, incomplete profile..." className="input resize-none"/>
        </Field>
        <div className="flex gap-3 mt-5">
          <button onClick={()=>{setRejectModal(null);setRejectReason('')}} className="btn btn-secondary btn-md flex-1">Cancel</button>
          <button onClick={reject} disabled={!rejectReason.trim()||!!actionLoading} className="btn btn-danger btn-md flex-1">
            {actionLoading ? 'Rejecting...' : 'Reject & Notify'}
          </button>
        </div>
      </Modal>
    </>
  )
}

// ── Active Clinics ────────────────────────────────────────────────────────────
function ActiveClinicsTab() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(()=>{
    supabase.from('clinics').select('*, profiles!clinics_owner_id_fkey(full_name)')
      .eq('verification_status','approved').order('created_at',{ascending:false})
      .then(({data})=>{ setClinics(data||[]); setLoading(false) })
  },[])

  async function toggleActive(c) {
    await supabase.from('clinics').update({is_active:!c.is_active}).eq('id',c.id)
    setClinics(p=>p.map(cl=>cl.id===c.id?{...cl,is_active:!cl.is_active}:cl))
    toast.success(`Clinic ${!c.is_active?'activated':'deactivated'}`)
  }

  const filtered = clinics.filter(c=>!search||c.name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}}/></div>

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
        <input type="text" placeholder="Search clinics..." value={search} onChange={e=>setSearch(e.target.value)} className="input pl-9"/>
      </div>
      <TableWrapper>
        <TableHead cols={['Clinic','Location','Owner','Status','']}/>
        <tbody className="divide-y divide-slate-100">
          {filtered.map(c=>(
            <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover"/> : <Building2 className="w-4 h-4 text-slate-300"/>}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm">{c.city||'—'}</td>
              <td className="px-4 py-3 text-slate-500 text-sm">{c.profiles?.full_name||'—'}</td>
              <td className="px-4 py-3">
                <span className={`badge ${c.is_active?'badge-success':'badge-gray'}`}>{c.is_active?'Active':'Inactive'}</span>
              </td>
              <td className="px-4 py-3">
                <button onClick={()=>toggleActive(c)}
                  className={`btn btn-sm opacity-0 group-hover:opacity-100 transition-opacity ${c.is_active?'text-red-500 border-red-200 hover:bg-red-50':'btn-primary'}`}
                  style={c.is_active?{border:'1px solid'}:{}}>
                  {c.is_active?'Deactivate':'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
      {filtered.length===0 && <EmptyState title="No clinics found"/>}
    </div>
  )
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ role }) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(()=>{
    supabase.from('profiles').select('*').eq('role',role).order('created_at',{ascending:false})
      .then(({data})=>{ setUsers(data||[]); setLoading(false) })
  },[])

  const filtered = users.filter(u=>!search||
    u.full_name?.toLowerCase().includes(search.toLowerCase())||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}}/></div>

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
        <input type="text" placeholder={`Search ${role==='clinic_owner'?'clinic owners':'customers'}...`}
          value={search} onChange={e=>setSearch(e.target.value)} className="input pl-9"/>
      </div>
      <TableWrapper>
        <TableHead cols={['User','Phone','Joined']}/>
        <tbody className="divide-y divide-slate-100">
          {filtered.map(u=>(
            <tr key={u.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-sky-200">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover"/>
                      : <span className="text-sky-600 font-bold text-xs">{u.full_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{u.full_name}</p>
                    <p className="text-slate-400 text-xs">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm">{u.phone||'—'}</td>
              <td className="px-4 py-3 text-slate-400 text-sm">{format(new Date(u.created_at),'MMM d, yyyy')}</td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
      {filtered.length===0 && <EmptyState title="No users found"/>}
    </div>
  )
}

// ── Appointments Tab ──────────────────────────────────────────────────────────
function AppointmentsTab() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    supabase.from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(full_name), clinics(name), services(name)')
      .order('created_at',{ascending:false}).limit(50)
      .then(({data})=>{ setAppointments(data||[]); setLoading(false) })
  },[])

  if (loading) return (
    <TableWrapper>
      <TableHead cols={['Patient','Clinic','Service','Date','Status']}/>
      <tbody><SkeletonRows n={8} cols={5}/></tbody>
    </TableWrapper>
  )

  return (
    <TableWrapper>
      <TableHead cols={['Patient','Clinic','Service','Date','Status']}/>
      <tbody className="divide-y divide-slate-100">
        {appointments.map(a=>(
          <tr key={a.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-800 text-sm">{a.profiles?.full_name||'—'}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{a.clinics?.name||'—'}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{a.services?.name||'—'}</td>
            <td className="px-4 py-3 text-slate-400 text-sm">{format(new Date(a.appointment_date),'MMM d, yyyy')}</td>
            <td className="px-4 py-3"><StatusBadge status={a.status}/></td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]           = useState('pending')
  const [stats, setStats]       = useState({clinics:0,owners:0,customers:0,appointments:0})
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading]   = useState(true)

  useEffect(()=>{ loadStats() },[])

  async function loadStats() {
    const [c,o,cu,a,p] = await Promise.all([
      supabase.from('clinics').select('id',{count:'exact',head:true}).eq('verification_status','approved'),
      supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','clinic_owner'),
      supabase.from('profiles').select('id',{count:'exact',head:true}).eq('role','customer'),
      supabase.from('appointments').select('id',{count:'exact',head:true}),
      supabase.from('clinics').select('id',{count:'exact',head:true}).eq('verification_status','pending'),
    ])
    setStats({clinics:c.count||0,owners:o.count||0,customers:cu.count||0,appointments:a.count||0})
    setPendingCount(p.count||0)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <span className="text-white text-xs">[DENTAL]</span>
            </div>
            <span className="font-display font-bold text-slate-900 text-sm">BookMyDentistPH</span>
            <span className="badge badge-info ml-1">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center ring-1 ring-sky-200">
              <span className="text-sky-600 font-bold text-xs">{profile?.full_name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile?.full_name}</span>
            <button onClick={async()=>{await signOut();navigate('/')}}
              className="btn btn-ghost btn-sm text-red-400 hover:bg-red-50 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5"/>Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader title="Admin Dashboard" subtitle={`${new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}`}/>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Clinics"   value={stats.clinics}      icon={Building2} iconClass="text-sky-500"    bg="bg-sky-50"    loading={loading}/>
          <StatCard label="Clinic Owners"    value={stats.owners}       icon={Users}     iconClass="text-blue-500"   bg="bg-blue-50"   loading={loading}/>
          <StatCard label="Customers"        value={stats.customers}    icon={User}      iconClass="text-violet-500" bg="bg-violet-50" loading={loading}/>
          <StatCard label="Appointments"     value={stats.appointments} icon={Calendar}  iconClass="text-amber-500"  bg="bg-amber-50"  loading={loading}/>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 card p-1 mb-6 rounded-xl overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                ${tab===t.key?'text-white shadow-sm':'text-slate-500 hover:text-slate-700'}`}
              style={tab===t.key?{backgroundColor:'var(--color-brand)'}:{}}>
              {t.label}
              {t.key==='pending'&&pendingCount>0&&(
                <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center
                  ${tab===t.key?'bg-white/20 text-white':'bg-red-500 text-white'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab==='pending'      && <PendingTab onRefreshStats={loadStats}/>}
        {tab==='active'       && <ActiveClinicsTab/>}
        {tab==='owners'       && <UsersTab role="clinic_owner"/>}
        {tab==='customers'    && <UsersTab role="customer"/>}
        {tab==='appointments' && <AppointmentsTab/>}
      </div>
    </div>
  )
}