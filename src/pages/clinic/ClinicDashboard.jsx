import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

const STATUS_CONFIG = {
  pending:             { label: 'Pending',    bg: 'bg-amber-100', text: 'text-amber-700' },
  accepted:            { label: 'Accepted',   bg: 'bg-green-100', text: 'text-green-700' },
  rejected:            { label: 'Declined',   bg: 'bg-red-100',   text: 'text-red-600' },
  rescheduled:         { label: 'Rescheduled',bg: 'bg-blue-100',  text: 'text-blue-700' },
  reschedule_accepted: { label: 'Confirmed',  bg: 'bg-green-100', text: 'text-green-700' },
  reschedule_declined: { label: 'Declined',   bg: 'bg-red-100',   text: 'text-red-600' },
  cancelled:           { label: 'Cancelled',  bg: 'bg-stone-100', text: 'text-stone-500' },
}

export default function ClinicDashboard() {
  const { user, profile } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [stats, setStats] = useState({ pending: 0, accepted: 0, total: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase.from('clinics').select('*').eq('owner_id', user.id).single()
      setClinic(c)
      if (!c) { setLoading(false); return }

      const { data: appts } = await supabase
        .from('appointments')
        .select('*, profiles!appointments_customer_id_fkey(*), services(*)')
        .eq('clinic_id', c.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: allAppts } = await supabase.from('appointments').select('status').eq('clinic_id', c.id)
      setStats({
        pending: allAppts?.filter(a => a.status === 'pending').length || 0,
        accepted: allAppts?.filter(a => a.status === 'accepted' || a.status === 'reschedule_accepted').length || 0,
        total: allAppts?.length || 0
      })
      setRecent(appts || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!clinic) return (
    <div className="text-center py-20 bg-white rounded-2xl border border-amber-100">
      <span className="text-5xl">🏥</span>
      <h2 className="text-xl font-bold text-stone-800 mt-4">Set up your clinic</h2>
      <p className="text-stone-500 mt-2 mb-6">Complete your clinic profile to start receiving bookings</p>
      <Link to="/clinic/profile" className="bg-amber-400 hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
        Set Up Clinic
      </Link>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-stone-800">Welcome, {profile?.full_name?.split(' ')[0]}! 👋</h1>
        <p className="text-stone-500">{clinic.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', value: stats.pending, bg: 'bg-amber-400', icon: '⏳' },
          { label: 'Accepted', value: stats.accepted, bg: 'bg-green-400', icon: '✅' },
          { label: 'Total', value: stats.total, bg: 'bg-stone-400', icon: '📊' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-amber-100 p-4 text-center">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-lg mx-auto mb-2`}>{s.icon}</div>
            <p className="text-2xl font-black text-stone-800">{s.value}</p>
            <p className="text-stone-500 text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent appointments */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-stone-800">Recent Appointments</h2>
          <Link to="/clinic/appointments" className="text-amber-600 text-sm font-medium hover:text-amber-700">View all →</Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-8">No appointments yet</p>
        ) : (
          <div className="space-y-3">
            {recent.map(appt => {
              const st = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending
              return (
                <div key={appt.id} className="flex items-center justify-between py-2 border-b border-amber-50 last:border-0">
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{appt.profiles?.full_name}</p>
                    <p className="text-stone-500 text-xs">{appt.services?.name} · {format(new Date(appt.appointment_date), 'MMM d')} at {appt.appointment_time}</p>
                  </div>
                  <span className={`${st.bg} ${st.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}