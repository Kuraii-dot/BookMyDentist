import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { sendClinicApprovedEmail, sendClinicRejectedEmail } from '../../lib/email'

const TABS = ['Pending Clinics', 'Active Clinics', 'Clinic Owners', 'Customers', 'Appointments']

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="card p-5">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center text-2xl mb-3`}>{icon}</div>
      <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-slate-400 text-xs font-medium mt-0.5">{label}</p>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Pending Clinics')
  const [stats, setStats] = useState({ clinics: 0, owners: 0, customers: 0, appointments: 0 })
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [c, o, cu, a, p] = await Promise.all([
      supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'clinic_owner'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    ])
    setStats({ clinics: c.count || 0, owners: o.count || 0, customers: cu.count || 0, appointments: a.count || 0 })
    setPendingCount(p.count || 0)
  }

  // ---- Pending clinics tab ----
  function PendingTab() {
    const [clinics, setClinics] = useState([])
    const [loading, setLoading] = useState(true)
    const [rejectModal, setRejectModal] = useState(null)
    const [rejectReason, setRejectReason] = useState('')
    const [actionLoading, setActionLoading] = useState(null)

    useEffect(() => {
      supabase.from('clinics')
        .select('*, profiles!clinics_owner_id_fkey(id, full_name, email)')
        .eq('verification_status', 'pending')
        .order('created_at')
        .then(({ data }) => { setClinics(data || []); setPendingCount(data?.length || 0); setLoading(false) })
    }, [])

    async function approve(clinic) {
      setActionLoading(clinic.id)
      await supabase.from('clinics').update({ verification_status: 'approved', is_active: true }).eq('id', clinic.id)
      await supabase.from('notifications').insert({ recipient_id: clinic.profiles.id, type: 'clinic_approved', title: '🎉 Clinic Approved!', message: `Your clinic "${clinic.name}" has been approved and is now live on DentBook!` })
      await sendClinicApprovedEmail?.({ to: clinic.profiles.email, name: clinic.profiles.full_name, clinicName: clinic.name })
      toast.success(`${clinic.name} approved!`)
      setClinics(prev => prev.filter(c => c.id !== clinic.id))
      setActionLoading(null)
      loadStats()
    }

    async function reject() {
      if (!rejectReason.trim()) { toast.error('Please add a reason'); return }
      setActionLoading(rejectModal.id)
      await supabase.from('clinics').update({ verification_status: 'rejected', rejection_reason: rejectReason }).eq('id', rejectModal.id)
      await supabase.from('notifications').insert({ recipient_id: rejectModal.profiles.id, type: 'clinic_rejected', title: 'Clinic Not Approved', message: `Your clinic "${rejectModal.name}" was not approved. Reason: ${rejectReason}` })
      await sendClinicRejectedEmail?.({ to: rejectModal.profiles.email, name: rejectModal.profiles.full_name, reason: rejectReason })
      toast.success('Rejected & owner notified')
      setClinics(prev => prev.filter(c => c.id !== rejectModal.id))
      setRejectModal(null); setRejectReason(''); setActionLoading(null)
      loadStats()
    }

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:"var(--color-brand)",borderTopColor:"transparent"}} /></div>

    return (
      <>
        {clinics.length === 0 ? (
          <div className="card p-14 text-center"><span className="text-4xl">🎉</span><p className="text-slate-400 mt-3 font-medium">All caught up! No pending clinics.</p></div>
        ) : (
          <div className="space-y-4">
            {clinics.map(c => (
              <div key={c.id} className="card p-5 border-l-4 border-l-amber-400">
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-xl bg-sky-50 overflow-hidden shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🦷</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-lg">{c.name}</h3>
                        <p className="text-slate-400 text-sm">📍 {c.address}{c.city ? `, ${c.city}` : ''}</p>
                        <p className="text-slate-400 text-xs mt-1">Owner: <span className="font-medium text-slate-600">{c.profiles?.full_name}</span> · {c.profiles?.email}</p>
                        <p className="text-slate-300 text-xs">Submitted {format(new Date(c.created_at), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => approve(c)} disabled={actionLoading === c.id}
                          className="btn btn-primary btn-sm">✓ Approve</button>
                        <button onClick={() => setRejectModal(c)} disabled={actionLoading === c.id}
                          className="btn btn-secondary btn-sm text-red-500 hover:bg-red-50">✗ Reject</button>
                      </div>
                    </div>
                    {c.description && <p className="text-slate-500 text-sm mt-2 bg-slate-50 rounded-xl p-3">{c.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {rejectModal && (
          <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
            <div className="modal p-6" onClick={e => e.stopPropagation()}>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-1">Reject Clinic</h3>
              <p className="text-slate-500 text-sm mb-4">{rejectModal.name}</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="Reason for rejection (will be sent to owner)..." className="input resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} className="btn btn-secondary btn-md flex-1">Cancel</button>
                <button onClick={reject} disabled={!rejectReason.trim() || actionLoading} className="btn btn-danger btn-md flex-1">
                  {actionLoading ? 'Rejecting...' : 'Reject & Notify'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // ---- Active clinics tab ----
  function ActiveClinicsTab() {
    const [clinics, setClinics] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
      supabase.from('clinics').select('*, profiles!clinics_owner_id_fkey(full_name)').eq('verification_status', 'approved').order('created_at', { ascending: false })
        .then(({ data }) => { setClinics(data || []); setLoading(false) })
    }, [])

    async function toggleActive(c) {
      await supabase.from('clinics').update({ is_active: !c.is_active }).eq('id', c.id)
      setClinics(prev => prev.map(cl => cl.id === c.id ? { ...cl, is_active: !cl.is_active } : cl))
      toast.success(`Clinic ${!c.is_active ? 'activated' : 'deactivated'}`)
    }

    const filtered = clinics.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()))

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:"var(--color-brand)",borderTopColor:"transparent"}} /></div>

    return (
      <div>
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Search clinics..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className={`card p-4 flex items-center gap-4 flex-wrap ${!c.is_active ? 'opacity-60' : ''}`}>
              <div className="w-11 h-11 rounded-xl bg-sky-50 overflow-hidden shrink-0">
                {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🦷</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  {!c.is_active && <span className="badge badge-gray">Inactive</span>}
                </div>
                <p className="text-slate-400 text-xs">{c.address}{c.city ? `, ${c.city}` : ''} · Owner: {c.profiles?.full_name}</p>
              </div>
              <button onClick={() => toggleActive(c)}
                className={`btn btn-sm shrink-0 ${c.is_active ? 'btn-secondary text-red-500 hover:bg-red-50' : 'btn-primary'}`}>
                {c.is_active ? '🔴 Deactivate' : '🟢 Activate'}
              </button>
            </div>
          ))}
          {filtered.length === 0 && <div className="card p-10 text-center"><p className="text-slate-400">No clinics found</p></div>}
        </div>
      </div>
    )
  }

  // ---- Users tab ----
  function UsersTab({ role }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
      supabase.from('profiles').select('*').eq('role', role).order('created_at', { ascending: false })
        .then(({ data }) => { setUsers(data || []); setLoading(false) })
    }, [])

    const filtered = users.filter(u => !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:"var(--color-brand)",borderTopColor:"transparent"}} /></div>

    return (
      <div>
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder={`Search ${role === 'clinic_owner' ? 'clinic owners' : 'customers'}...`} value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left font-semibold text-slate-600">User</th>
                <th className="table-cell text-left font-semibold text-slate-600 hidden sm:table-cell">Phone</th>
                <th className="table-cell text-left font-semibold text-slate-600 hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sky-600 font-bold text-sm">{u.full_name?.[0]?.toUpperCase()}</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{u.full_name}</p>
                        <p className="text-slate-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-slate-500 hidden sm:table-cell">{u.phone || '—'}</td>
                  <td className="table-cell text-slate-400 hidden md:table-cell">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-slate-400 py-10">No users found</p>}
        </div>
      </div>
    )
  }

  // ---- Appointments tab ----
  function AppointmentsTab() {
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      supabase.from('appointments')
        .select('*, profiles!appointments_customer_id_fkey(full_name), clinics(name), services(name)')
        .order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => { setAppointments(data || []); setLoading(false) })
    }, [])

    const STATUS_COLORS = { pending: 'badge-warning', accepted: 'badge-success', rejected: 'badge-danger', completed: 'badge-purple', cancelled: 'badge-gray', rescheduled: 'badge-info' }

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:"var(--color-brand)",borderTopColor:"transparent"}} /></div>

    return (
      <div className="table-container overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="table-header">
            <tr>
              <th className="table-cell text-left font-semibold text-slate-600">Patient</th>
              <th className="table-cell text-left font-semibold text-slate-600">Clinic</th>
              <th className="table-cell text-left font-semibold text-slate-600">Service</th>
              <th className="table-cell text-left font-semibold text-slate-600">Date</th>
              <th className="table-cell text-left font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {appointments.map(a => (
              <tr key={a.id} className="table-row">
                <td className="table-cell font-medium text-slate-800">{a.profiles?.full_name}</td>
                <td className="table-cell text-slate-500">{a.clinics?.name}</td>
                <td className="table-cell text-slate-500">{a.services?.name}</td>
                <td className="table-cell text-slate-400">{format(new Date(a.appointment_date), 'MMM d, yyyy')}</td>
                <td className="table-cell"><span className={`badge capitalize ${STATUS_COLORS[a.status] || 'badge-gray'}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments.length === 0 && <p className="text-center text-slate-400 py-10">No appointments yet</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{backgroundColor:"#f0f9ff"}}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm shadow-sky-200"><span className="text-white text-sm">🦷</span></div>
            <span className="font-display font-bold text-slate-900">DentBook</span>
            <span className="ml-2 badge bg-sky-100 text-sky-700 border-sky-200">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center ring-2 ring-sky-200">
              <span className="text-sky-600 font-bold text-sm">{profile?.full_name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile?.full_name}</span>
            <button onClick={async () => { await signOut(); navigate('/') }}
              className="btn btn-secondary btn-sm text-red-500 hover:bg-red-50">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 stagger">
          <StatCard icon="🏥" label="Active Clinics"   value={stats.clinics}      color="text-sky-600" bg="bg-sky-50" />
          <StatCard icon="👨‍⚕️" label="Clinic Owners"  value={stats.owners}       color="text-blue-600"   bg="bg-blue-50" />
          <StatCard icon="👥" label="Customers"         value={stats.customers}    color="text-violet-600" bg="bg-violet-50" />
          <StatCard icon="📅" label="Total Appointments"value={stats.appointments} color="text-amber-600"  bg="bg-amber-50" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 p-1 shadow-sm mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'} style={tab === t ? {backgroundColor:'var(--color-brand)'} : {}}`}>
              {t}
              {t === 'Pending Clinics' && pendingCount > 0 && (
                <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${tab === t ? 'bg-white text-sky-600' : 'bg-red-500 text-white'}`}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'Pending Clinics' && <PendingTab />}
        {tab === 'Active Clinics' && <ActiveClinicsTab />}
        {tab === 'Clinic Owners' && <UsersTab role="clinic_owner" />}
        {tab === 'Customers' && <UsersTab role="customer" />}
        {tab === 'Appointments' && <AppointmentsTab />}
      </div>
    </div>
  )
}