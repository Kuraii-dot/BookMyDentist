import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const EMPTY_SERVICE = { name: '', description: '', duration_minutes: 60, price: '' }

export default function ManageServices() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | service object (edit)
  const [form, setForm] = useState(EMPTY_SERVICE)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase.from('clinics').select('*').eq('owner_id', user.id).single()
      setClinic(c)
      if (c) {
        const { data: s } = await supabase.from('services').select('*').eq('clinic_id', c.id).order('created_at')
        setServices(s || [])
      }
      setLoading(false)
    }
    load()
  }, [user])

  function openAdd() { setForm(EMPTY_SERVICE); setModal('add') }
  function openEdit(s) { setForm({ name: s.name, description: s.description || '', duration_minutes: s.duration_minutes, price: s.price || '' }); setModal(s) }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Service name required'); return }
    setSaving(true)

    const payload = { ...form, price: form.price ? parseFloat(form.price) : null, clinic_id: clinic.id }

    if (modal === 'add') {
      const { error } = await supabase.from('services').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Service added!')
    } else {
      const { error } = await supabase.from('services').update(payload).eq('id', modal.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Service updated!')
    }

    const { data: s } = await supabase.from('services').select('*').eq('clinic_id', clinic.id).order('created_at')
    setServices(s || [])
    setModal(null)
    setSaving(false)
  }

  async function toggleActive(service) {
    await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id)
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: !s.is_active } : s))
  }

  async function deleteService(id) {
    if (!confirm('Delete this service?')) return
    await supabase.from('services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
    toast.success('Service deleted')
  }

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-stone-800">Services</h1>
          <p className="text-stone-500 mt-1">Manage what your clinic offers</p>
        </div>
        <button onClick={openAdd} className="bg-amber-400 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
          + Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-amber-100">
          <span className="text-4xl">🔧</span>
          <p className="text-stone-500 mt-4 font-medium">No services yet</p>
          <p className="text-stone-400 text-sm mt-1">Add your first service to start receiving bookings</p>
          <button onClick={openAdd} className="mt-5 bg-amber-400 hover:bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">Add Service</button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${s.is_active ? 'border-amber-100' : 'border-stone-100 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-stone-800">{s.name}</p>
                  {!s.is_active && <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                {s.description && <p className="text-stone-500 text-sm mt-0.5 truncate">{s.description}</p>}
                <div className="flex gap-4 mt-1.5 text-xs text-stone-400">
                  <span>⏱ {s.duration_minutes} mins</span>
                  {s.price && <span className="text-amber-600 font-semibold">₱{parseFloat(s.price).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(s)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${s.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-500 hover:bg-amber-100 hover:text-amber-700'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => openEdit(s)} className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium transition-colors">Edit</button>
                <button onClick={() => deleteService(s.id)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-stone-800 text-lg mb-5">{modal === 'add' ? 'Add New Service' : 'Edit Service'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Service Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dental Cleaning"
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the service..."
                  rows={2}
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Duration (mins)</label>
                  <input
                    type="number"
                    value={form.duration_minutes}
                    onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                    min={15}
                    step={15}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Price (₱)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    min={0}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 border border-amber-200 text-stone-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-amber-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {saving ? 'Saving...' : modal === 'add' ? 'Add Service' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}