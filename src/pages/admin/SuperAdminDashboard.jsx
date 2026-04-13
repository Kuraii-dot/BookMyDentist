import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { sendClinicApprovedEmail, sendClinicRejectedEmail } from '../../lib/email'
import { Building2, Users, User, Calendar, Search, LogOut, CheckCircle2, XCircle } from 'lucide-react'
import { StatCard, EmptyState, Modal, Field, Alert, SkeletonRows, TableWrapper, TableHead, StatusBadge, PageHeader } from '../../components/ui/shared'

// Tooth SVG icon
function ToothIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 2C9.5 2 7 4 7 6.5c0 1.5.5 2.8 1 4 .6 1.4.8 2.8.8 4.2 0 1.5.3 5.3 1.7 5.3.9 0 1.2-1.3 1.5-3 .3-1.7.5-3 1-3s.7 1.3 1 3c.3 1.7.6 3 1.5 3 1.4 0 1.7-3.8 1.7-5.3 0-1.4.2-2.8.8-4.2.5-1.2 1-2.5 1-4C18 4 15.5 2 12 2z"/>
    </svg>
  )
}

const TABS = [
  { key: 'pending',       label: 'Pending Clinics'  },
  { key: 'active',        label: 'Active Clinics'   },
  { key: 'owners',        label: 'Clinic Owners'    },
  { key: 'customers',     label: 'Customers'        },
  { key: 'appointments',  label: 'Appointments'     },
  { key: 'announcements', label: 'Announcements'    },
  { key: 'reports',       label: 'Reports'          },
  { key: 'revenue',       label: 'Revenue'          },
  { key: 'analytics',     label: 'Analytics'        },
  { key: 'reviews',       label: 'Reviews'          },
  { key: 'performance',   label: 'Performance'      },
]

// ── Pending Clinics ───────────────────────────────────────────────────────────
function PendingTab({ onRefreshStats }) {
  const [clinics, setClinics]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [rejectModal, setRejectModal]     = useState(null)
  const [rejectReason, setRejectReason]   = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    supabase.from('clinics')
      .select('*, profiles!clinics_owner_id_fkey(id,full_name,email)')
      .eq('verification_status', 'pending').order('created_at')
      .then(({ data }) => { setClinics(data || []); setLoading(false) })
  }, [])

  async function approve(clinic) {
    setActionLoading(clinic.id)
    await supabase.from('clinics').update({ verification_status: 'approved', is_active: true }).eq('id', clinic.id)
    await supabase.from('notifications').insert({
      recipient_id: clinic.profiles.id, type: 'accepted',
      title: 'Clinic Approved!',
      message: `Your clinic "${clinic.name}" has been approved and is now live on BookMyDentistPH!`,
    })
    await sendClinicApprovedEmail?.({ to: clinic.profiles.email, ownerName: clinic.profiles.full_name, clinicName: clinic.name })
    toast.success(`${clinic.name} approved!`)
    setClinics(p => p.filter(c => c.id !== clinic.id))
    setActionLoading(null); onRefreshStats()
  }

  async function reject() {
    if (!rejectReason.trim()) { toast.error('Please add a reason'); return }
    setActionLoading(rejectModal.id)
    await supabase.from('clinics').update({ verification_status: 'rejected', rejection_reason: rejectReason }).eq('id', rejectModal.id)
    await supabase.from('notifications').insert({
      recipient_id: rejectModal.profiles.id, type: 'rejected',
      title: 'Clinic Not Approved',
      message: `Your clinic "${rejectModal.name}" was not approved. Reason: ${rejectReason}`,
    })
    await sendClinicRejectedEmail?.({ to: rejectModal.profiles.email, ownerName: rejectModal.profiles.full_name, reason: rejectReason, clinicName: rejectModal.name })
    toast.success('Rejected & owner notified')
    setClinics(p => p.filter(c => c.id !== rejectModal.id))
    setRejectModal(null); setRejectReason(''); setActionLoading(null); onRefreshStats()
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <>
      {clinics.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="w-7 h-7 text-emerald-300" />} title="All caught up!" description="No pending clinic applications." />
      ) : (
        <div className="space-y-3">
          {clinics.map(c => (
            <div key={c.id} className="card p-5 border-l-4 border-l-amber-400">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                  {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-base">{c.name}</h3>
                      <p className="text-slate-400 text-sm">{c.address}{c.city ? `, ${c.city}` : ''}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Owner: <span className="font-medium text-slate-600">{c.profiles?.full_name}</span> · {c.profiles?.email}
                      </p>
                      <p className="text-slate-300 text-xs mt-0.5">Submitted {format(new Date(c.created_at), 'MMM d, yyyy')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => approve(c)} disabled={actionLoading === c.id}
                        className="btn btn-primary btn-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />Approve
                      </button>
                      <button onClick={() => setRejectModal(c)} disabled={actionLoading === c.id}
                        className="btn btn-secondary btn-sm text-red-500 hover:bg-red-50 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />Reject
                      </button>
                    </div>
                  </div>
                  {c.description && <p className="text-slate-500 text-sm mt-2 bg-slate-50 rounded-xl p-3">{c.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason('') }} title="Reject Clinic Application">
        <p className="text-slate-600 text-sm mb-4"><strong>{rejectModal?.name}</strong> · {rejectModal?.profiles?.email}</p>
        <Field label="Reason for rejection" required hint="This will be sent to the clinic owner via email and notification.">
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
            placeholder="e.g. Missing required documents, incomplete profile..." className="input resize-none" />
        </Field>
        <div className="flex gap-3 mt-5">
          <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="btn btn-secondary btn-md flex-1">Cancel</button>
          <button onClick={reject} disabled={!rejectReason.trim() || !!actionLoading} className="btn btn-danger btn-md flex-1">
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

  useEffect(() => {
    supabase.from('clinics').select('*, profiles!clinics_owner_id_fkey(full_name)')
      .eq('verification_status', 'approved').order('created_at', { ascending: false })
      .then(({ data }) => { setClinics(data || []); setLoading(false) })
  }, [])

  async function toggleActive(c) {
    await supabase.from('clinics').update({ is_active: !c.is_active }).eq('id', c.id)
    setClinics(p => p.map(cl => cl.id === c.id ? { ...cl, is_active: !cl.is_active } : cl))
    toast.success(`Clinic ${!c.is_active ? 'activated' : 'deactivated'}`)
  }

  const filtered = clinics.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search clinics..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>
      <TableWrapper>
        <TableHead cols={['Clinic', 'Location', 'Owner', 'Status', '']} />
        <tbody className="divide-y divide-slate-100">
          {filtered.map(c => (
            <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4 text-slate-300" />}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm">{c.city || '—'}</td>
              <td className="px-4 py-3 text-slate-500 text-sm">{c.profiles?.full_name || '—'}</td>
              <td className="px-4 py-3">
                <span className={`badge ${c.is_active ? 'badge-success' : 'badge-gray'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
              </td>
              <td className="px-4 py-3">
                <button onClick={() => toggleActive(c)}
                  className={`btn btn-sm opacity-0 group-hover:opacity-100 transition-opacity ${c.is_active ? 'text-red-500 border-red-200 hover:bg-red-50' : 'btn-primary'}`}
                  style={c.is_active ? { border: '1px solid' } : {}}>
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
      {filtered.length === 0 && <EmptyState title="No clinics found" />}
    </div>
  )
}

// ── Users Tab (with suspend/ban) ──────────────────────────────────────────────
function UsersTab({ role }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', role).order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }, [])

  async function toggleSuspend(u) {
    await supabase.from('profiles').update({ is_suspended: !u.is_suspended }).eq('id', u.id)
    setUsers(p => p.map(x => x.id === u.id ? { ...x, is_suspended: !u.is_suspended } : x))
    toast.success(u.is_suspended ? 'User unsuspended' : 'User suspended')
  }

  async function banUser(u) {
    if (!confirm(`Permanently ban ${u.full_name}? This cannot be undone.`)) return
    await supabase.from('profiles').update({ banned_at: new Date().toISOString() }).eq('id', u.id)
    setUsers(p => p.map(x => x.id === u.id ? { ...x, banned_at: new Date().toISOString() } : x))
    toast.success('User banned')
  }

  const filtered = users.filter(u => !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder={`Search ${role === 'clinic_owner' ? 'clinic owners' : 'customers'}...`}
          value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>
      <TableWrapper>
        <TableHead cols={['User', 'Phone', 'Joined', 'Status', '']} />
        <tbody className="divide-y divide-slate-100">
          {filtered.map(u => (
            <tr key={u.id} className="hover:bg-slate-50 group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-sky-200">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sky-600 font-bold text-xs">{u.full_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{u.full_name}</p>
                    <p className="text-slate-400 text-xs">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm">{u.phone || '—'}</td>
              <td className="px-4 py-3 text-slate-400 text-sm">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
              <td className="px-4 py-3">
                {u.banned_at
                  ? <span className="badge badge-danger">Banned</span>
                  : u.is_suspended
                    ? <span className="badge badge-warning">Suspended</span>
                    : <span className="badge badge-success">Active</span>
                }
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!u.banned_at && (
                    <button onClick={() => toggleSuspend(u)}
                      className={`btn btn-sm text-xs ${u.is_suspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                      style={{ border: '1px solid currentColor' }}>
                      {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  )}
                  {!u.banned_at && !u.is_suspended && (
                    <button onClick={() => banUser(u)}
                      className="btn btn-sm text-xs text-red-500 hover:bg-red-50"
                      style={{ border: '1px solid #fca5a5' }}>
                      Ban
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
      {filtered.length === 0 && <EmptyState title="No users found" />}
    </div>
  )
}

// ── Appointments Tab ──────────────────────────────────────────────────────────
function AppointmentsTab() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    supabase.from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(full_name), clinics(name), services(name)')
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { setAppointments(data || []); setLoading(false) })
  }, [])

  if (loading) return (
    <TableWrapper>
      <TableHead cols={['Patient', 'Clinic', 'Service', 'Date', 'Status']} />
      <tbody><SkeletonRows n={8} cols={5} /></tbody>
    </TableWrapper>
  )

  return (
    <TableWrapper>
      <TableHead cols={['Patient', 'Clinic', 'Service', 'Date', 'Status']} />
      <tbody className="divide-y divide-slate-100">
        {appointments.map(a => (
          <tr key={a.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-800 text-sm">{a.profiles?.full_name || '—'}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{a.clinics?.name || '—'}</td>
            <td className="px-4 py-3 text-slate-500 text-sm">{a.services?.name || '—'}</td>
            <td className="px-4 py-3 text-slate-400 text-sm">{format(new Date(a.appointment_date), 'MMM d, yyyy')}</td>
            <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  )
}

// ── Announcements Tab ─────────────────────────────────────────────────────────
function AnnouncementsTab() {
  const [open, setOpen]     = useState(false)
  const [form, setForm]     = useState({ title: '', message: '', audience: 'all', clinic_id: '' })
  const [clinics, setClinics] = useState([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.from('clinics').select('id,name').eq('verification_status', 'approved')
      .then(({ data }) => setClinics(data || []))
  }, [])

  async function send() {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message required'); return }
    setSending(true)

    let query = supabase.from('profiles').select('id,email')
    if (form.audience === 'owners')           query = query.eq('role', 'clinic_owner')
    else if (form.audience === 'customers')   query = query.eq('role', 'customer')
    else if (form.audience === 'specific_clinic') {
      const { data: clinic } = await supabase.from('clinics').select('owner_id').eq('id', form.clinic_id).single()
      if (clinic) query = query.eq('id', clinic.owner_id)
    }

    const { data: recipients } = await query
    if (!recipients?.length) { toast.error('No recipients found'); setSending(false); return }

    await supabase.from('notifications').insert(
      recipients.map(r => ({
        recipient_id: r.id,
        type: 'announcement',
        title: form.title,
        message: form.message,
        audience_type: form.audience,
        target_clinic_id: form.audience === 'specific_clinic' ? form.clinic_id : null,
      }))
    )

    toast.success(`Announcement sent to ${recipients.length} recipient(s)!`)
    setOpen(false)
    setForm({ title: '', message: '', audience: 'all', clinic_id: '' })
    setSending(false)
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-md mb-4">+ New Announcement</button>

      <Modal open={open} onClose={() => setOpen(false)} title="Send Announcement">
        <div className="space-y-4">
          <Field label="Title" required>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. Platform maintenance on Friday" />
          </Field>
          <Field label="Message" required>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              rows={4} className="input resize-none" placeholder="Write your announcement here..." />
          </Field>
          <Field label="Audience">
            <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="input">
              <option value="all">Everyone</option>
              <option value="owners">Clinic Owners only</option>
              <option value="customers">Patients only</option>
              <option value="specific_clinic">Specific Clinic</option>
            </select>
          </Field>
          {form.audience === 'specific_clinic' && (
            <Field label="Select Clinic">
              <select value={form.clinic_id} onChange={e => setForm({ ...form, clinic_id: e.target.value })} className="input">
                <option value="">Choose...</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setOpen(false)} className="btn btn-secondary btn-md flex-1">Cancel</button>
            <button onClick={send} disabled={sending} className="btn btn-primary btn-md flex-1">
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </div>
      </Modal>

      <p className="text-slate-400 text-sm">Announcements are delivered to the in-app notification bell. Recipients see them instantly.</p>
    </div>
  )
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(full_name,email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setReports(data || []); setLoading(false) })
  }, [])

  async function resolve(id) {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', id)
    setReports(p => p.map(r => r.id === id ? { ...r, status: 'resolved' } : r))
    toast.success('Marked as resolved')
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (reports.length === 0) return <EmptyState title="No reports yet" description="User-submitted reports will appear here." />

  return (
    <TableWrapper>
      <TableHead cols={['Reporter', 'Target ID', 'Type', 'Reason', 'Status', '']} />
      <tbody className="divide-y divide-slate-100">
        {reports.map(r => (
          <tr key={r.id} className="hover:bg-slate-50 group">
            <td className="px-4 py-3 text-sm text-slate-600">{r.reporter?.full_name || '—'}</td>
            <td className="px-4 py-3 text-xs text-slate-400 font-mono">{r.target_id?.slice(0, 8)}…</td>
            <td className="px-4 py-3"><span className="badge badge-info">{r.target_type}</span></td>
            <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{r.reason}</td>
            <td className="px-4 py-3">
              <span className={`badge ${r.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>{r.status}</span>
            </td>
            <td className="px-4 py-3">
              {r.status === 'pending' && (
                <button onClick={() => resolve(r.id)}
                  className="btn btn-sm btn-secondary text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Resolve
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  )
}

// ── Revenue Tab ───────────────────────────────────────────────────────────────
function RevenueTab() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('appointments')
      .select('clinic_id, status, services(price), clinics(name)')
      .eq('status', 'completed')
      .then(({ data: rows }) => {
        const map = {}
        for (const r of rows || []) {
          const name = r.clinics?.name || 'Unknown'
          if (!map[name]) map[name] = { name, completed: 0, revenue: 0 }
          map[name].completed++
          map[name].revenue += parseFloat(r.services?.price || 0)
        }
        const sorted = Object.values(map).sort((a, b) => b.completed - a.completed)
        setData(sorted); setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalAppts   = data.reduce((s, d) => s + d.completed, 0)

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <p className="section-label mb-1">Completed Appointments</p>
          <p className="text-3xl font-display font-bold text-slate-900">{totalAppts.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="section-label mb-1">Estimated Platform Revenue</p>
          <p className="text-3xl font-display font-bold text-sky-600">₱{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Based on completed appointments × service price</p>
        </div>
      </div>
      {data.length === 0 ? (
        <EmptyState title="No completed appointments yet" />
      ) : (
        <TableWrapper>
          <TableHead cols={['#', 'Clinic', 'Completed Appts', 'Est. Revenue']} />
          <tbody className="divide-y divide-slate-100">
            {data.map((d, i) => (
              <tr key={d.name} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400 text-sm">#{i + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-800 text-sm">{d.name}</td>
                <td className="px-4 py-3 text-slate-600 text-sm">{d.completed}</td>
                <td className="px-4 py-3 font-bold text-sky-600 text-sm">₱{d.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}
    </div>
  )
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [apptData, setApptData] = useState([])
  const [userData, setUserData] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('appointments').select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('profiles').select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ]).then(([appts, users]) => {
      setApptData(groupByDay(appts.data || []))
      setUserData(groupByDay(users.data || []))
      setLoading(false)
    })
  }, [])

  function groupByDay(rows) {
    const map = {}
    rows.forEach(r => {
      const day = r.created_at?.slice(0, 10)
      if (day) map[day] = (map[day] || 0) + 1
    })
    const result = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      result.push({ date: d, count: map[d] || 0 })
    }
    return result
  }

  function MiniBar({ data, max, color }) {
    return (
      <div className="flex items-end gap-1 h-20">
        {data.map(d => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {d.date.slice(5)}: {d.count}
            </div>
            <div className="w-full rounded-sm transition-all" style={{ height: `${Math.max(2, (d.count / max) * 72)}px`, backgroundColor: color }} />
          </div>
        ))}
      </div>
    )
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  const maxAppts = Math.max(...apptData.map(d => d.count), 1)
  const maxUsers = Math.max(...userData.map(d => d.count), 1)

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-1 text-sm">New Appointments — last 14 days</h3>
        <p className="text-slate-400 text-xs mb-3">Hover bars for exact count</p>
        <MiniBar data={apptData} max={maxAppts} color="var(--color-brand)" />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{apptData[0]?.date?.slice(5)}</span>
          <span>{apptData[apptData.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-1 text-sm">New Users — last 14 days</h3>
        <p className="text-slate-400 text-xs mb-3">Hover bars for exact count</p>
        <MiniBar data={userData} max={maxUsers} color="#8b5cf6" />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{userData[0]?.date?.slice(5)}</span>
          <span>{userData[userData.length - 1]?.date?.slice(5)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Reviews Moderation Tab ────────────────────────────────────────────────────
function ReviewsModerationTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('reviews')
      .select('*, profiles!reviews_customer_id_fkey(full_name), clinics(name)')
      .order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setReviews(data || []); setLoading(false) })
  }, [])

  async function deleteReview(id) {
    if (!confirm('Delete this review permanently?')) return
    await supabase.from('reviews').delete().eq('id', id)
    setReviews(p => p.filter(r => r.id !== id))
    toast.success('Review deleted')
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (reviews.length === 0) return <EmptyState title="No reviews yet" />

  return (
    <TableWrapper>
      <TableHead cols={['Patient', 'Clinic', 'Rating', 'Comment', '']} />
      <tbody className="divide-y divide-slate-100">
        {reviews.map(r => (
          <tr key={r.id} className="hover:bg-slate-50 group">
            <td className="px-4 py-3 text-sm font-medium text-slate-800">{r.profiles?.full_name || '—'}</td>
            <td className="px-4 py-3 text-sm text-slate-500">{r.clinics?.name || '—'}</td>
            <td className="px-4 py-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s} className={`text-xs ${s <= r.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{r.comment || '—'}</td>
            <td className="px-4 py-3">
              <button onClick={() => deleteReview(r.id)}
                className="btn btn-sm text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ border: '1px solid #fca5a5' }}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  )
}

// ── Clinic Performance Tab ────────────────────────────────────────────────────
function ClinicPerformanceTab() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('clinics')
      .select('id, name, city, logo_url, appointments(status)')
      .eq('verification_status', 'approved')
      .then(({ data }) => {
        const scored = (data || []).map(c => {
          const total     = c.appointments?.length || 0
          const completed = c.appointments?.filter(a => a.status === 'completed').length || 0
          const cancelled = c.appointments?.filter(a => ['cancelled', 'rejected'].includes(a.status)).length || 0
          const score     = total > 0 ? Math.round((completed / total) * 100) : null
          return { ...c, total, completed, cancelled, score }
        }).filter(c => c.total > 0).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        setClinics(scored); setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (clinics.length === 0) return <EmptyState title="No data yet" description="Clinics with at least one appointment will appear here." />

  return (
    <div>
      <p className="text-slate-400 text-sm mb-4">Score = completed ÷ total × 100. Only clinics with at least 1 appointment shown.</p>
      <TableWrapper>
        <TableHead cols={['#', 'Clinic', 'Total', 'Completed', 'Cancelled', 'Score']} />
        <tbody className="divide-y divide-slate-100">
          {clinics.map((c, i) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-400 text-sm">#{i + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {c.logo_url
                      ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-slate-400 text-xs">🦷</span>
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                    {c.city && <p className="text-xs text-slate-400">{c.city}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600 text-sm">{c.total}</td>
              <td className="px-4 py-3 text-emerald-600 text-sm font-medium">{c.completed}</td>
              <td className="px-4 py-3 text-red-400 text-sm">{c.cancelled}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${c.score ?? 0}%`,
                      backgroundColor: c.score >= 80 ? '#10b981' : c.score >= 50 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                  <span className={`text-sm font-bold ${c.score >= 80 ? 'text-emerald-600' : c.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {c.score ?? '—'}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]                   = useState('pending')
  const [stats, setStats]               = useState({ clinics: 0, owners: 0, customers: 0, appointments: 0 })
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading]           = useState(true)

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
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <ToothIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 text-sm">BookMyDentistPH</span>
            <span className="badge badge-info ml-1">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center ring-1 ring-sky-200">
              <span className="text-sky-600 font-bold text-xs">{profile?.full_name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile?.full_name}</span>
            <button onClick={async () => { await signOut(); navigate('/') }}
              className="btn btn-ghost btn-sm text-red-400 hover:bg-red-50 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" />Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          title="Admin Dashboard"
          subtitle={new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Clinics"  value={stats.clinics}      icon={Building2} iconClass="text-sky-500"    bg="bg-sky-50"    loading={loading} />
          <StatCard label="Clinic Owners"   value={stats.owners}       icon={Users}     iconClass="text-blue-500"   bg="bg-blue-50"   loading={loading} />
          <StatCard label="Customers"       value={stats.customers}    icon={User}      iconClass="text-violet-500" bg="bg-violet-50" loading={loading} />
          <StatCard label="Appointments"    value={stats.appointments} icon={Calendar}  iconClass="text-amber-500"  bg="bg-amber-50"  loading={loading} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 card p-1 mb-6 rounded-xl overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              style={tab === t.key ? { backgroundColor: 'var(--color-brand)' } : {}}>
              {t.label}
              {t.key === 'pending' && pendingCount > 0 && (
                <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center
                  ${tab === t.key ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'pending'       && <PendingTab onRefreshStats={loadStats} />}
        {tab === 'active'        && <ActiveClinicsTab />}
        {tab === 'owners'        && <UsersTab role="clinic_owner" />}
        {tab === 'customers'     && <UsersTab role="customer" />}
        {tab === 'appointments'  && <AppointmentsTab />}
        {tab === 'announcements' && <AnnouncementsTab />}
        {tab === 'reports'       && <ReportsTab />}
        {tab === 'revenue'       && <RevenueTab />}
        {tab === 'analytics'     && <AnalyticsTab />}
        {tab === 'reviews'       && <ReviewsModerationTab />}
        {tab === 'performance'   && <ClinicPerformanceTab />}
      </div>
    </div>
  )
}