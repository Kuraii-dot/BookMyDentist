import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { sendClinicApprovedEmail, sendClinicRejectedEmail } from '../../lib/email'
import {
  Building2, Users, User, Calendar, Search, LogOut,
  CheckCircle2, XCircle, Megaphone, FileText, DollarSign,
  BarChart2, Star, Activity, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'
import {
  StatCard, EmptyState, Modal, Field, Alert, SkeletonRows,
  TableWrapper, TableHead, StatusBadge, PageHeader
} from '../../components/ui/shared'

// ── Tooth Icon ─────────────────────────────────────────────────────────────
function ToothIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 2C9.5 2 7 4 7 6.5c0 1.5.5 2.8 1 4 .6 1.4.8 2.8.8 4.2 0 1.5.3 5.3 1.7 5.3.9 0 1.2-1.3 1.5-3 .3-1.7.5-3 1-3s.7 1.3 1 3c.3 1.7.6 3 1.5 3 1.4 0 1.7-3.8 1.7-5.3 0-1.4.2-2.8.8-4.2.5-1.2 1-2.5 1-4C18 4 15.5 2 12 2z" />
    </svg>
  )
}

// ── Pagination Component ───────────────────────────────────────────────────
function Pagination({ page, total, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
      <p className="text-sm text-slate-400">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of <strong>{total}</strong>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={i} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                ${page === p ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              style={page === p ? { backgroundColor: 'var(--color-brand)' } : {}}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )
}

const PER_PAGE = 10

// ── Pending Clinics ────────────────────────────────────────────────────────
function PendingTab({ onRefreshStats }) {
  const [clinics, setClinics]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [rejectModal, setRejectModal]   = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [page, setPage] = useState(1)

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

  if (loading) return <Spinner />

  const paged = clinics.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <>
      {clinics.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="w-7 h-7 text-emerald-300" />}
          title="All caught up!" description="No pending clinic applications." />
      ) : (
        <>
          <div className="space-y-3">
            {paged.map(c => (
              <div key={c.id} className="card p-5 border-l-4 border-l-amber-400">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    {c.logo_url
                      ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                      : <Building2 className="w-6 h-6 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-base">{c.name}</h3>
                        <p className="text-slate-400 text-sm">{c.address}{c.city ? `, ${c.city}` : ''}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          Owner: <span className="font-medium text-slate-600">{c.profiles?.full_name}</span> · {c.profiles?.email}
                        </p>
                        <p className="text-slate-300 text-xs mt-0.5">
                          Submitted {format(new Date(c.created_at), 'MMM d, yyyy')}
                        </p>
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
                    {c.description && (
                      <p className="text-slate-500 text-sm mt-2 bg-slate-50 rounded-xl p-3">{c.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} total={clinics.length} perPage={PER_PAGE} onPage={setPage} />
        </>
      )}

      <Modal open={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason('') }} title="Reject Clinic Application">
        <p className="text-slate-600 text-sm mb-4">
          <strong>{rejectModal?.name}</strong> · {rejectModal?.profiles?.email}
        </p>
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

// ── Active Clinics ─────────────────────────────────────────────────────────
function ActiveClinicsTab() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  useEffect(() => {
    supabase.from('clinics').select('*, profiles!clinics_owner_id_fkey(full_name)')
      .eq('verification_status', 'approved').order('created_at', { ascending: false })
      .then(({ data }) => { setClinics(data || []); setLoading(false) })
  }, [])

  useEffect(() => { setPage(1) }, [search])

  async function toggleActive(c) {
    await supabase.from('clinics').update({ is_active: !c.is_active }).eq('id', c.id)
    setClinics(p => p.map(cl => cl.id === c.id ? { ...cl, is_active: !cl.is_active } : cl))
    toast.success(`Clinic ${!c.is_active ? 'activated' : 'deactivated'}`)
  }

  const filtered = clinics.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()))
  const paged    = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search clinics..." value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>
      <TableWrapper>
        <TableHead cols={['Clinic', 'Location', 'Owner', 'Status', '']} />
        <tbody className="divide-y divide-slate-100">
          {paged.map(c => (
            <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {c.logo_url
                      ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                      : <Building2 className="w-4 h-4 text-slate-300" />}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 text-sm">{c.city || '—'}</td>
              <td className="px-4 py-3 text-slate-500 text-sm">{c.profiles?.full_name || '—'}</td>
              <td className="px-4 py-3">
                <span className={`badge ${c.is_active ? 'badge-success' : 'badge-gray'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <button onClick={() => toggleActive(c)}
                  className={`btn btn-sm opacity-0 group-hover:opacity-100 transition-opacity
                    ${c.is_active ? 'text-red-500 border-red-200 hover:bg-red-50' : 'btn-primary'}`}
                  style={c.is_active ? { border: '1px solid' } : {}}>
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
      {filtered.length === 0
        ? <EmptyState title="No clinics found" />
        : <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} />}
    </div>
  )
}

// ── Users Tab ──────────────────────────────────────────────────────────────
function UsersTab({ role }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', role).order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }, [role])

  useEffect(() => { setPage(1) }, [search])

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
    u.email?.toLowerCase().includes(search.toLowerCase()))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <Spinner />

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text"
          placeholder={`Search ${role === 'clinic_owner' ? 'clinic owners' : 'customers'}...`}
          value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>
      <TableWrapper>
        <TableHead cols={['User', 'Phone', 'Joined', 'Status', '']} />
        <tbody className="divide-y divide-slate-100">
          {paged.map(u => (
            <tr key={u.id} className="hover:bg-slate-50 group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-sky-200">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sky-600 font-bold text-xs">{u.full_name?.[0]?.toUpperCase()}</span>}
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
                    : <span className="badge badge-success">Active</span>}
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
      {filtered.length === 0
        ? <EmptyState title="No users found" />
        : <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} />}
    </div>
  )
}

// ── Appointments Tab ───────────────────────────────────────────────────────
function AppointmentsTab() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)

  useEffect(() => {
    supabase.from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(full_name), clinics(name), services(name)')
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { setAppointments(data || []); setLoading(false) })
  }, [])

  const paged = appointments.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return (
    <TableWrapper>
      <TableHead cols={['Patient', 'Clinic', 'Service', 'Date', 'Status']} />
      <tbody><SkeletonRows n={8} cols={5} /></tbody>
    </TableWrapper>
  )

  return (
    <>
      <TableWrapper>
        <TableHead cols={['Patient', 'Clinic', 'Service', 'Date', 'Status']} />
        <tbody className="divide-y divide-slate-100">
          {paged.map(a => (
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
      <Pagination page={page} total={appointments.length} perPage={PER_PAGE} onPage={setPage} />
    </>
  )
}

// ── Announcements Tab ──────────────────────────────────────────────────────
function AnnouncementsTab() {
  const [open, setOpen]     = useState(false)
  const [form, setForm]     = useState({ title: '', message: '', audience: 'all', clinic_id: '' })
  const [clinics, setClinics] = useState([])
  const [sending, setSending] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    supabase.from('clinics').select('id,name').eq('verification_status', 'approved')
      .then(({ data }) => setClinics(data || []))
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    setLoadingAnnouncements(true)
    const { data } = await supabase.from('notifications').select('*')
      .eq('type', 'announcement').order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoadingAnnouncements(false)
  }

  async function send() {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message required'); return }
    setSending(true)
    let query = supabase.from('profiles').select('id,email')
    if (form.audience === 'owners')         query = query.eq('role', 'clinic_owner')
    else if (form.audience === 'customers') query = query.eq('role', 'customer')
    else if (form.audience === 'specific_clinic') {
      const { data: clinic } = await supabase.from('clinics').select('owner_id').eq('id', form.clinic_id).single()
      if (clinic) query = query.eq('id', clinic.owner_id)
    }
    const { data: recipients } = await query
    if (!recipients?.length) { toast.error('No recipients found'); setSending(false); return }
    await supabase.from('notifications').insert(recipients.map(r => ({
      recipient_id: r.id, type: 'announcement',
      title: form.title, message: form.message,
      audience_type: form.audience,
      target_clinic_id: form.audience === 'specific_clinic' ? form.clinic_id : null,
    })))
    toast.success(`Announcement sent to ${recipients.length} recipient(s)!`)
    setOpen(false)
    setForm({ title: '', message: '', audience: 'all', clinic_id: '' })
    setSending(false)
    fetchAnnouncements()
  }

  const paged = announcements.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loadingAnnouncements) return <Spinner />

  return (
    <div>
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-md mb-6">
        + New Announcement
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Send Announcement">
        <div className="space-y-4">
          <Field label="Title" required>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="input" placeholder="e.g. Platform maintenance on Friday" />
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

      <h3 className="font-semibold text-slate-800 mb-4">Sent Announcements</h3>
      {announcements.length === 0 ? (
        <EmptyState title="No announcements sent yet" />
      ) : (
        <>
          <div className="space-y-3">
            {paged.map(a => (
              <div key={a.id} className="card p-5 border-l-4 border-l-blue-400">
                <h4 className="font-semibold text-slate-900">{a.title}</h4>
                <p className="text-slate-500 text-sm mt-1">{a.message}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 flex-wrap">
                  <span>Audience: <strong>{
                    a.audience_type === 'all' ? 'Everyone'
                      : a.audience_type === 'owners' ? 'Clinic Owners'
                        : a.audience_type === 'customers' ? 'Patients'
                          : 'Specific Clinic'
                  }</strong></span>
                  <span>Sent: <strong>{format(new Date(a.created_at), 'MMM d, yyyy · h:mm a')}</strong></span>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} total={announcements.length} perPage={PER_PAGE} onPage={setPage} />
        </>
      )}
    </div>
  )
}

// ── Reports Tab ────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)

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

  const paged = reports.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <Spinner />
  if (reports.length === 0) return <EmptyState title="No reports yet" description="User-submitted reports will appear here." />

  return (
    <>
      <TableWrapper>
        <TableHead cols={['Reporter', 'Target ID', 'Type', 'Reason', 'Status', '']} />
        <tbody className="divide-y divide-slate-100">
          {paged.map(r => (
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
      <Pagination page={page} total={reports.length} perPage={PER_PAGE} onPage={setPage} />
    </>
  )
}

// ── Revenue Tab ────────────────────────────────────────────────────────────
function RevenueTab() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)

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

  if (loading) return <Spinner />

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalAppts   = data.reduce((s, d) => s + d.completed, 0)
  const paged        = data.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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
        <>
          <TableWrapper>
            <TableHead cols={['#', 'Clinic', 'Completed Appts', 'Est. Revenue']} />
            <tbody className="divide-y divide-slate-100">
              {paged.map((d, i) => (
                <tr key={d.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 text-sm">#{(page - 1) * PER_PAGE + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 text-sm">{d.name}</td>
                  <td className="px-4 py-3 text-slate-600 text-sm">{d.completed}</td>
                  <td className="px-4 py-3 font-bold text-sky-600 text-sm">₱{d.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
          <Pagination page={page} total={data.length} perPage={PER_PAGE} onPage={setPage} />
        </>
      )}
    </div>
  )
}

// ── Analytics Tab ──────────────────────────────────────────────────────────
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
    rows.forEach(r => { const day = r.created_at?.slice(0, 10); if (day) map[day] = (map[day] || 0) + 1 })
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
            <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded
              opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {d.date.slice(5)}: {d.count}
            </div>
            <div className="w-full rounded-sm transition-all"
              style={{ height: `${Math.max(2, (d.count / max) * 72)}px`, backgroundColor: color }} />
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <Spinner />

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

// ── Reviews Tab ────────────────────────────────────────────────────────────
function ReviewsModerationTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)

  useEffect(() => {
    supabase.from('reviews')
      .select('*, profiles!reviews_customer_id_fkey(full_name), clinics(name)')
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { setReviews(data || []); setLoading(false) })
  }, [])

  async function deleteReview(id) {
    if (!confirm('Delete this review permanently?')) return
    await supabase.from('reviews').delete().eq('id', id)
    setReviews(p => p.filter(r => r.id !== id))
    toast.success('Review deleted')
  }

  const paged = reviews.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <Spinner />
  if (reviews.length === 0) return <EmptyState title="No reviews yet" />

  return (
    <>
      <TableWrapper>
        <TableHead cols={['Patient', 'Clinic', 'Rating', 'Comment', '']} />
        <tbody className="divide-y divide-slate-100">
          {paged.map(r => (
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
      <Pagination page={page} total={reviews.length} perPage={PER_PAGE} onPage={setPage} />
    </>
  )
}

// ── Clinic Performance Tab ─────────────────────────────────────────────────
function ClinicPerformanceTab() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)

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

  const paged = clinics.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return <Spinner />
  if (clinics.length === 0) return <EmptyState title="No data yet" description="Clinics with at least one appointment will appear here." />

  return (
    <>
      <p className="text-slate-400 text-sm mb-4">Score = completed ÷ total × 100. Only clinics with ≥ 1 appointment shown.</p>
      <TableWrapper>
        <TableHead cols={['#', 'Clinic', 'Total', 'Completed', 'Cancelled', 'Score']} />
        <tbody className="divide-y divide-slate-100">
          {paged.map((c, i) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-400 text-sm">#{(page - 1) * PER_PAGE + i + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {c.logo_url
                      ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-slate-400 text-xs">🦷</span>}
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
      <Pagination page={page} total={clinics.length} perPage={PER_PAGE} onPage={setPage} />
    </>
  )
}

// ── Sidebar Config ─────────────────────────────────────────────────────────
const NAV = [
  { section: 'Clinics', items: [
    { key: 'pending',  label: 'Pending Clinics', icon: Building2 },
    { key: 'active',   label: 'Active Clinics',  icon: CheckCircle2 },
    { key: 'performance', label: 'Performance',  icon: Activity },
  ]},
  { section: 'Users', items: [
    { key: 'owners',    label: 'Clinic Owners', icon: Users },
    { key: 'customers', label: 'Customers',     icon: User },
  ]},
  { section: 'Operations', items: [
    { key: 'appointments',  label: 'Appointments',  icon: Calendar },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'reports',       label: 'Reports',       icon: FileText },
    { key: 'reviews',       label: 'Reviews',       icon: Star },
  ]},
  { section: 'Insights', items: [
    { key: 'revenue',   label: 'Revenue',   icon: DollarSign },
    { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  ]},
]

const TAB_LABELS = {
  pending: 'Pending Clinics', active: 'Active Clinics', performance: 'Clinic Performance',
  owners: 'Clinic Owners', customers: 'Customers', appointments: 'Appointments',
  announcements: 'Announcements', reports: 'Reports', reviews: 'Reviews',
  revenue: 'Revenue', analytics: 'Analytics',
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab]                   = useState('pending')
  const [stats, setStats]               = useState({ clinics: 0, owners: 0, customers: 0, appointments: 0 })
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [sidebarOpen, setSidebarOpen]   = useState(false)

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

  function handleNav(key) {
    setTab(key)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Top Header ── */}
      <header className="glass-header sticky top-0 z-40 border-b border-slate-200/60">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(v => !v)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sky-400 text-3xl">Book
            <span className="font-display font-bold text-slate-900 text-3xl">MyDentist</span></span>
          </div>
              <span className="badge badge-info ml-1">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center ring-1 ring-sky-200">
              <span className="text-sky-600 font-bold text-xs">{profile?.full_name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile?.full_name}</span>
            <button onClick={async () => { await signOut(); navigate('/') }}
              className="btn btn-ghost btn-sm text-red-400 hover:bg-red-50 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-70 px-8 py-2 bg-white border-r border-slate-100
          flex flex-col pt-14 lg:pt-0 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Stats summary strip */}
          <div className="px-4 py-4 border-b border-slate-100 space-y-1.5">
            {[
              { label: 'Active Clinics', value: stats.clinics,      color: 'text-sky-600' },
              { label: 'Clinic Owners',  value: stats.owners,       color: 'text-blue-600' },
              { label: 'Customers',      value: stats.customers,    color: 'text-violet-600' },
              { label: 'Appointments',   value: stats.appointments, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className={`text-xs font-bold ${s.color}`}>
                  {loading ? '—' : s.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            {NAV.map(group => (
              <div key={group.section}>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-2 mb-1">
                  {group.section}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon    = item.icon
                    const active  = tab === item.key
                    const isPending = item.key === 'pending' && pendingCount > 0
                    return (
                      <button key={item.key} onClick={() => handleNav(item.key)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all
                          ${active
                            ? 'text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        style={active ? { backgroundColor: 'var(--color-brand)' } : {}}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {isPending && (
                          <span className={`text-[10px] font-bold min-w-[18px] h-[18px] rounded-full
                            flex items-center justify-center px-1
                            ${active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                            {pendingCount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-[1500px] mx-auto px-2 sm:px-6 py-6">
            {/* Page title */}
            <div className="mb-6">
              <h1 className="font-display font-bold text-slate-900 text-xl">{TAB_LABELS[tab]}</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Tab content */}
            <div className="card p-5 sm:p-6">
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
        </main>
      </div>
    </div>
  )
}