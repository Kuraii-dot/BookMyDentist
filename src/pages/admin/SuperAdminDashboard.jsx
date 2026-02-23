import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { sendClinicApprovedEmail, sendClinicRejectedEmail } from '../../lib/email'

const TABS = ['Pending Clinics', 'Clinics', 'Customers', 'Clinic Owners', 'Appointments', 'Reports']

const STATUS_CONFIG = {
  pending:             { label: 'Pending',    bg: 'bg-amber-100',  text: 'text-amber-700' },
  accepted:            { label: 'Accepted',   bg: 'bg-green-100',  text: 'text-green-700' },
  rejected:            { label: 'Declined',   bg: 'bg-red-100',    text: 'text-red-600' },
  rescheduled:         { label: 'Rescheduled',bg: 'bg-blue-100',   text: 'text-blue-700' },
  reschedule_accepted: { label: 'Confirmed',  bg: 'bg-green-100',  text: 'text-green-700' },
  reschedule_declined: { label: 'Declined',   bg: 'bg-red-100',    text: 'text-red-600' },
  completed:           { label: 'Completed',  bg: 'bg-purple-100', text: 'text-purple-700' },
  cancelled:           { label: 'Cancelled',  bg: 'bg-stone-100',  text: 'text-stone-500' },
}

const SUB_CONFIG = {
  active:    { label: 'Active',    bg: 'bg-green-100',  text: 'text-green-700' },
  unpaid:    { label: 'Unpaid',    bg: 'bg-amber-100',  text: 'text-amber-700' },
  suspended: { label: 'Suspended', bg: 'bg-red-100',    text: 'text-red-600' },
}

// ── Pending Clinics Tab ───────────────────────────────────────────────────────
function PendingClinicsTab({ onCountChange }) {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [paymentModal, setPaymentModal] = useState(null)
  const [paymentDate, setPaymentDate] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { fetchPending() }, [])

  async function fetchPending() {
    const { data } = await supabase
      .from('clinics')
      .select('*, profiles!clinics_owner_id_fkey(id, full_name, email)')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true })
    setClinics(data || [])
    onCountChange?.(data?.length || 0)
    setLoading(false)
  }

  async function handleApprove(clinic) {
    // Open payment modal first — approval requires first payment
    setPaymentModal(clinic)
    setPaymentDate('')
  }

  async function confirmApprove(clinic) {
    if (!paymentDate) { toast.error('Select a payment date'); return }
    setActionLoading(true)

    const next = new Date(paymentDate)
    next.setMonth(next.getMonth() + 1)

    const { error } = await supabase.from('clinics').update({
      verification_status: 'approved',
      is_active: true,
      subscription_status: 'active',
      last_payment_date: paymentDate,
      next_payment_date: format(next, 'yyyy-MM-dd')
    }).eq('id', clinic.id)

    if (error) { toast.error(error.message); setActionLoading(false); return }

    // In-app notification to clinic owner
    await supabase.from('notifications').insert({
      recipient_id: clinic.profiles.id,
      appointment_id: null,
      type: 'clinic_approved',
      title: '🎉 Clinic Approved!',
      message: `Your clinic "${clinic.name}" has been approved and is now live. Welcome to DentBook!`
    })

    // Email notification
    await sendClinicApprovedEmail({
      to: clinic.profiles.email,
      clinicName: clinic.name,
      ownerName: clinic.profiles.full_name
    })

    toast.success(`${clinic.name} approved and activated!`)
    setPaymentModal(null)
    setPaymentDate('')
    fetchPending()
    setActionLoading(false)
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return }
    setActionLoading(true)
    const clinic = rejectModal

    const { error } = await supabase.from('clinics').update({
      verification_status: 'rejected',
      rejection_reason: rejectReason,
      is_active: false
    }).eq('id', clinic.id)

    if (error) { toast.error(error.message); setActionLoading(false); return }

    // In-app notification
    await supabase.from('notifications').insert({
      recipient_id: clinic.profiles.id,
      appointment_id: null,
      type: 'clinic_rejected',
      title: 'Clinic Application Update',
      message: `Your clinic application for "${clinic.name}" was not approved. Reason: ${rejectReason}`
    })

    // Email notification
    await sendClinicRejectedEmail({
      to: clinic.profiles.email,
      clinicName: clinic.name,
      ownerName: clinic.profiles.full_name,
      reason: rejectReason
    })

    toast.success('Application rejected and clinic notified.')
    setRejectModal(null)
    setRejectReason('')
    fetchPending()
    setActionLoading(false)
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      {clinics.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-amber-100">
          <span className="text-4xl">✅</span>
          <p className="text-stone-500 mt-4 font-medium">No pending clinic applications</p>
          <p className="text-stone-400 text-sm">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clinics.map(clinic => (
            <div key={clinic.id} className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
              {clinic.banner_url && (
                <div className="h-28 rounded-xl overflow-hidden mb-4">
                  <img src={clinic.banner_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                  {clinic.logo_url ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🦷</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-800 text-lg">{clinic.name}</h3>
                  <p className="text-stone-500 text-sm">📍 {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</p>
                  {clinic.phone && <p className="text-stone-500 text-sm">📞 {clinic.phone}</p>}
                  {clinic.email && <p className="text-stone-500 text-sm">✉️ {clinic.email}</p>}
                  {clinic.description && <p className="text-stone-400 text-sm mt-1 line-clamp-2">{clinic.description}</p>}
                  <div className="mt-2 pt-2 border-t border-amber-50">
                    <p className="text-xs text-stone-400">Owner: <span className="font-semibold text-stone-600">{clinic.profiles?.full_name}</span> · {clinic.profiles?.email}</p>
                    <p className="text-xs text-stone-400">Submitted: {format(new Date(clinic.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleApprove(clinic)}
                  className="flex-1 bg-green-400 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1"
                >
                  ✓ Approve & Record Payment
                </button>
                <button
                  onClick={() => { setRejectModal(clinic); setRejectReason('') }}
                  className="flex-1 bg-red-400 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve + Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-stone-800 text-lg mb-1">Approve & Record First Payment</h3>
            <p className="text-stone-500 text-sm mb-4">{paymentModal.name}</p>
            <div className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-100">
              <p className="text-amber-700 text-xs">Recording payment will activate the clinic and notify the owner via email and in-app notification.</p>
            </div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Date</label>
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
              className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setPaymentModal(null)} className="flex-1 border border-amber-200 text-stone-600 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={() => confirmApprove(paymentModal)} disabled={actionLoading}
                className="flex-1 bg-green-400 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">
                {actionLoading ? 'Approving...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-stone-800 text-lg mb-1">Reject Application</h3>
            <p className="text-stone-500 text-sm mb-4">{rejectModal.name} · {rejectModal.profiles?.email}</p>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reason for rejection</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete information, unverifiable address, did not pay subscription fee..."
              rows={3} className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 border border-amber-200 text-stone-600 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading}
                className="flex-1 bg-red-400 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">
                {actionLoading ? 'Rejecting...' : 'Reject & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Clinics Tab ───────────────────────────────────────────────────────────────
function ClinicsTab() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentModal, setPaymentModal] = useState(null)
  const [paymentDate, setPaymentDate] = useState('')

  useEffect(() => { fetchClinics() }, [])

  async function fetchClinics() {
    const { data } = await supabase
      .from('clinics')
      .select('*, profiles!clinics_owner_id_fkey(full_name, email)')
      .eq('verification_status', 'approved')
      .order('created_at', { ascending: false })
    setClinics(data || [])
    setLoading(false)
  }

  async function toggleActive(clinic) {
    const newActive = !clinic.is_active
    await supabase.from('clinics').update({ is_active: newActive, subscription_status: newActive ? 'active' : 'suspended' }).eq('id', clinic.id)
    setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, is_active: newActive, subscription_status: newActive ? 'active' : 'suspended' } : c))
    toast.success(`Clinic ${newActive ? 'activated' : 'deactivated'}`)
  }

  async function markPayment(clinic) {
    if (!paymentDate) { toast.error('Select a payment date'); return }
    const next = new Date(paymentDate)
    next.setMonth(next.getMonth() + 1)
    await supabase.from('clinics').update({ subscription_status: 'active', is_active: true, last_payment_date: paymentDate, next_payment_date: format(next, 'yyyy-MM-dd') }).eq('id', clinic.id)
    toast.success('Payment recorded!')
    setPaymentModal(null)
    setPaymentDate('')
    fetchClinics()
  }

  async function markUnpaid(clinic) {
    await supabase.from('clinics').update({ subscription_status: 'unpaid' }).eq('id', clinic.id)
    setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, subscription_status: 'unpaid' } : c))
    toast.success('Marked as unpaid')
  }

  const filtered = clinics.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <input type="text" placeholder="Search approved clinics..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4" />
      <div className="space-y-3">
        {filtered.map(clinic => {
          const sub = SUB_CONFIG[clinic.subscription_status || 'active']
          return (
            <div key={clinic.id} className="bg-white rounded-2xl border border-amber-100 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                    {clinic.logo_url ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🦷</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-stone-800">{clinic.name}</p>
                      <span className={`${sub.bg} ${sub.text} text-xs px-2 py-0.5 rounded-full font-semibold`}>{sub.label}</span>
                      {!clinic.is_active && <span className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                    </div>
                    <p className="text-stone-500 text-xs">📍 {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</p>
                    <p className="text-stone-400 text-xs">Owner: {clinic.profiles?.full_name} · {clinic.profiles?.email}</p>
                    {clinic.last_payment_date && (
                      <p className="text-stone-400 text-xs">Last paid: {format(new Date(clinic.last_payment_date), 'MMM d, yyyy')} · Next due: {clinic.next_payment_date ? format(new Date(clinic.next_payment_date), 'MMM d, yyyy') : 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setPaymentModal(clinic); setPaymentDate('') }}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-lg">💳 Record Payment</button>
                  <button onClick={() => markUnpaid(clinic)}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold px-3 py-1.5 rounded-lg">⚠️ Mark Unpaid</button>
                  <button onClick={() => toggleActive(clinic)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${clinic.is_active ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                    {clinic.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="text-center text-stone-400 py-8">No approved clinics yet</p>}
      </div>

      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-stone-800 text-lg mb-1">Record Payment</h3>
            <p className="text-stone-500 text-sm mb-4">{paymentModal.name}</p>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Date</label>
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
              className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setPaymentModal(null)} className="flex-1 border border-amber-200 text-stone-600 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={() => markPayment(paymentModal)} className="flex-1 bg-green-400 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CustomersTab() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false })
      .then(({ data }) => { setCustomers(data || []); setLoading(false) })
  }, [])

  const filtered = customers.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4" />
      <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-amber-50 border-b border-amber-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-50">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-amber-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">{c.full_name?.[0]?.toUpperCase() || '?'}</div>
                    <span className="font-medium text-stone-800">{c.full_name || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-500">{c.email}</td>
                <td className="px-4 py-3 text-stone-500">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-stone-400">{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-stone-400 py-8">No customers found</p>}
      </div>
    </div>
  )
}

function ClinicOwnersTab() {
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*, clinics(name, is_active, subscription_status, verification_status)')
      .eq('role', 'clinic_owner').order('created_at', { ascending: false })
      .then(({ data }) => { setOwners(data || []); setLoading(false) })
  }, [])

  const filtered = owners.filter(o =>
    o.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <input type="text" placeholder="Search clinic owners..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4" />
      <div className="space-y-3">
        {filtered.map(o => {
          const clinic = o.clinics?.[0]
          const sub = SUB_CONFIG[clinic?.subscription_status || 'active']
          return (
            <div key={o.id} className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center font-bold text-amber-700 text-sm">{o.full_name?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <p className="font-bold text-stone-800">{o.full_name}</p>
                  <p className="text-stone-500 text-xs">{o.email}</p>
                  {clinic && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-stone-400 text-xs">🏥 {clinic.name}</span>
                      <span className={`${sub.bg} ${sub.text} text-xs px-2 py-0.5 rounded-full font-medium`}>{sub.label}</span>
                      {clinic.verification_status === 'pending' && <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full">Pending Review</span>}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-stone-400 text-xs">Joined {format(new Date(o.created_at), 'MMM d, yyyy')}</p>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="text-center text-stone-400 py-8">No clinic owners found</p>}
      </div>
    </div>
  )
}

function AppointmentsTab() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    supabase.from('appointments')
      .select('*, clinics(name), services(name), profiles!appointments_customer_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setAppointments(data || []); setLoading(false) })
  }, [])

  const filtered = appointments.filter(a => {
    const matchSearch = a.clinics?.name?.toLowerCase().includes(search.toLowerCase()) || a.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input type="text" placeholder="Search by clinic or patient..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white">
          <option value="all">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-amber-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-amber-50 border-b border-amber-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Patient</th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Clinic</th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Service</th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-stone-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-50">
            {filtered.map(a => {
              const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
              return (
                <tr key={a.id} className="hover:bg-amber-50/50">
                  <td className="px-4 py-3 font-medium text-stone-800">{a.profiles?.full_name}</td>
                  <td className="px-4 py-3 text-stone-500">{a.clinics?.name}</td>
                  <td className="px-4 py-3 text-stone-500">{a.services?.name}</td>
                  <td className="px-4 py-3 text-stone-500">{format(new Date(a.appointment_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3"><span className={`${st.bg} ${st.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>{st.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-stone-400 py-8">No appointments found</p>}
      </div>
    </div>
  )
}

function ReportsTab() {
  const [clinics, setClinics] = useState([])
  const [selectedClinic, setSelectedClinic] = useState('all')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { supabase.from('clinics').select('id, name').eq('verification_status', 'approved').then(({ data }) => setClinics(data || [])) }, [])
  useEffect(() => { fetchStats() }, [selectedClinic])

  async function fetchStats() {
    setLoading(true)
    let query = supabase.from('appointments').select('status, clinic_id, clinics(name)')
    if (selectedClinic !== 'all') query = query.eq('clinic_id', selectedClinic)
    const { data } = await query
    const appts = data || []
    const byClinic = {}
    appts.forEach(a => {
      const name = a.clinics?.name || 'Unknown'
      if (!byClinic[name]) byClinic[name] = { total: 0, completed: 0, pending: 0 }
      byClinic[name].total++
      if (a.status === 'completed') byClinic[name].completed++
      if (a.status === 'pending') byClinic[name].pending++
    })
    setStats({ total: appts.length, completed: appts.filter(a => a.status === 'completed').length, pending: appts.filter(a => a.status === 'pending').length, accepted: appts.filter(a => a.status === 'accepted').length, rejected: appts.filter(a => a.status === 'rejected').length, cancelled: appts.filter(a => a.status === 'cancelled').length, byClinic })
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-4">
        <select value={selectedClinic} onChange={e => setSelectedClinic(e.target.value)}
          className="border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white">
          <option value="all">All Clinics</option>
          {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
        : stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Total', value: stats.total, bg: 'bg-stone-400', icon: '📊' },
                { label: 'Completed', value: stats.completed, bg: 'bg-purple-400', icon: '✅' },
                { label: 'Pending', value: stats.pending, bg: 'bg-amber-400', icon: '⏳' },
                { label: 'Accepted', value: stats.accepted, bg: 'bg-green-400', icon: '👍' },
                { label: 'Rejected', value: stats.rejected, bg: 'bg-red-400', icon: '❌' },
                { label: 'Cancelled', value: stats.cancelled, bg: 'bg-stone-300', icon: '🚫' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-amber-100 p-4 text-center">
                  <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center text-base mx-auto mb-2`}>{s.icon}</div>
                  <p className="text-2xl font-black text-stone-800">{s.value}</p>
                  <p className="text-stone-400 text-xs font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            {selectedClinic === 'all' && (
              <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-100 bg-amber-50"><h3 className="font-bold text-stone-700">Per Clinic Breakdown</h3></div>
                <table className="w-full text-sm">
                  <thead><tr>
                    <th className="text-left px-4 py-2 font-semibold text-stone-500">Clinic</th>
                    <th className="text-left px-4 py-2 font-semibold text-stone-500">Total</th>
                    <th className="text-left px-4 py-2 font-semibold text-stone-500">Completed</th>
                    <th className="text-left px-4 py-2 font-semibold text-stone-500">Pending</th>
                  </tr></thead>
                  <tbody className="divide-y divide-amber-50">
                    {Object.entries(stats.byClinic).map(([name, data]) => (
                      <tr key={name} className="hover:bg-amber-50/50">
                        <td className="px-4 py-3 font-medium text-stone-800">{name}</td>
                        <td className="px-4 py-3 text-stone-500">{data.total}</td>
                        <td className="px-4 py-3 text-purple-600 font-semibold">{data.completed}</td>
                        <td className="px-4 py-3 text-amber-600 font-semibold">{data.pending}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Pending Clinics')
  const [pendingCount, setPendingCount] = useState(0)
  const [counts, setCounts] = useState({ clinics: 0, customers: 0, owners: 0, appointments: 0 })

  useEffect(() => {
    async function loadCounts() {
      const [c, cu, o, a] = await Promise.all([
        supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'clinic_owner'),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
      ])
      setCounts({ clinics: c.count || 0, customers: cu.count || 0, owners: o.count || 0, appointments: a.count || 0 })
    }
    loadCounts()
  }, [])

  async function handleSignOut() { await signOut(); navigate('/') }

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center"><span className="text-sm">🦷</span></div>
            <span className="font-black text-stone-800">DentBook</span>
            <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">Super Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-700 font-bold text-sm">{profile?.full_name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-stone-700 hidden sm:block">{profile?.full_name}</span>
            <button onClick={handleSignOut} className="text-xs text-stone-400 hover:text-rose-500 transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Clinics', value: counts.clinics,      icon: '🏥', color: 'text-amber-600' },
            { label: 'Patients',       value: counts.customers,    icon: '🙋', color: 'text-blue-600' },
            { label: 'Clinic Owners',  value: counts.owners,       icon: '👨‍⚕️', color: 'text-green-600' },
            { label: 'Appointments',   value: counts.appointments, icon: '📅', color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-amber-100 p-4 text-center shadow-sm">
              <span className="text-2xl">{s.icon}</span>
              <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-stone-400 text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${activeTab === tab ? 'bg-amber-400 text-white' : 'bg-white text-stone-500 border border-amber-100 hover:border-amber-300'}`}>
              {tab}
              {tab === 'Pending Clinics' && pendingCount > 0 && (
                <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${activeTab === tab ? 'bg-white text-amber-600' : 'bg-red-500 text-white'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'Pending Clinics' && <PendingClinicsTab onCountChange={setPendingCount} />}
        {activeTab === 'Clinics'         && <ClinicsTab />}
        {activeTab === 'Customers'       && <CustomersTab />}
        {activeTab === 'Clinic Owners'   && <ClinicOwnersTab />}
        {activeTab === 'Appointments'    && <AppointmentsTab />}
        {activeTab === 'Reports'         && <ReportsTab />}
      </div>
    </div>
  )
}