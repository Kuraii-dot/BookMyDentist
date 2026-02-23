import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const { profile } = useAuth()
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' })
  const [loading, setLoading] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    setLoading(false)
    if (error) toast.error(error.message)
    else toast.success('Profile updated!')
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-black text-stone-800 mb-6">My Profile</h1>
      <div className="bg-white rounded-2xl border border-amber-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl font-black text-amber-700">
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-bold text-stone-800">{profile?.full_name}</p>
            <p className="text-stone-500 text-sm">{profile?.email}</p>
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">Patient</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+63 9XX XXX XXXX"
              className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}