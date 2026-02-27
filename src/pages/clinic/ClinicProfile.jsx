import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function ClinicProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', email: '', description: '' })
  const [clinic, setClinic] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [bannerUrl, setBannerUrl] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
      if (data) {
        setClinic(data)
        setForm({ name: data.name || '', address: data.address || '', city: data.city || '', phone: data.phone || '', email: data.email || '', description: data.description || '' })
        setLogoUrl(data.logo_url)
        setBannerUrl(data.banner_url)
      }
      setLoading(false)
    }
    load()
  }, [user])

  async function uploadImage(file, path) {
    const ext = file.name.split('.').pop()
    const fileName = `${user.id}/${path}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('clinic-images').upload(fileName, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('clinic-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Clinic name is required'); return }
    setSaving(true)

    try {
      let newLogoUrl = logoUrl
      let newBannerUrl = bannerUrl
      if (logoFile) newLogoUrl = await uploadImage(logoFile, 'logo')
      if (bannerFile) newBannerUrl = await uploadImage(bannerFile, 'banner')

      const payload = { ...form, logo_url: newLogoUrl, banner_url: newBannerUrl }

      if (clinic) {
        // Existing clinic — just update info, don't change verification status
        await supabase.from('clinics').update(payload).eq('id', clinic.id)
        toast.success('Clinic profile updated!')
      } else {
        // New clinic — set as pending, notify super admin
        const { data: newClinic, error } = await supabase.from('clinics').insert({
          ...payload,
          owner_id: user.id,
          is_active: false,
          verification_status: 'pending',
          subscription_status: 'unpaid'
        }).select().single()

        if (error) throw error
        setClinic(newClinic)

        // Notify all super admins
        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'super_admin')
        if (admins?.length) {
          await supabase.from('notifications').insert(
            admins.map(admin => ({
              recipient_id: admin.id,
              appointment_id: null,
              type: 'new_booking', // reusing type — super admin sees it as a clinic registration
              title: '🏥 New Clinic Registration',
              message: `${form.name} has submitted a clinic registration and is pending your approval.`
            }))
          )
        }

        toast.success('Clinic profile submitted! Awaiting admin approval.')
      }

      setLogoUrl(newLogoUrl)
      setBannerUrl(newBannerUrl)
      setLogoFile(null)
      setBannerFile(null)
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleImagePreview(file, setter) {
    if (!file) return
    setter(URL.createObjectURL(file))
  }

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-full">
      <h1 className="text-2xl font-black text-stone-800 mb-2">Clinic Profile</h1>

      {/* Verification status badge */}
      {clinic && (
        <div className={`mb-6 rounded-xl px-4 py-3 border text-sm font-medium flex items-center gap-2 ${
          clinic.verification_status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' :
          clinic.verification_status === 'rejected' ? 'bg-red-50 border-red-100 text-red-600' :
          'bg-sky-50 border-sky-100 text-sky-700'
        }`}>
          {clinic.verification_status === 'approved' && '✅ Clinic approved and active'}
          {clinic.verification_status === 'pending' && '⏳ Pending admin approval — you can update your info while waiting'}
          {clinic.verification_status === 'rejected' && '❌ Application rejected — update your info and contact support'}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-sky-100 p-6">
        <form onSubmit={handleSave} className="space-y-5">

          {/* Banner */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Banner Image</label>
            <div className="relative h-36 rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-100 border-2 border-dashed border-sky-200 flex items-center justify-center group cursor-pointer"
              onClick={() => document.getElementById('banner-input').click()}>
              {bannerUrl
                ? <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                : <div className="text-center"><p className="text-2xl mb-1">🖼️</p><p className="text-sky-600 text-sm font-medium">Upload Banner</p><p className="text-stone-400 text-xs">Recommended: 1200×400px</p></div>
              }
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold text-sm">Change Banner</span>
              </div>
            </div>
            <input id="banner-input" type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) { setBannerFile(f); handleImagePreview(f, setBannerUrl) } }} />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Clinic Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-sky-100 border-2 border-dashed border-sky-200 flex items-center justify-center cursor-pointer group relative shrink-0"
                onClick={() => document.getElementById('logo-input').click()}>
                {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-3xl">🦷</span>}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <span className="text-white text-xs font-semibold">Change</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-stone-700 text-sm">Clinic Logo</p>
                <p className="text-xs text-stone-400 mt-0.5">Square image recommended</p>
                <button type="button" onClick={() => document.getElementById('logo-input').click()}
                  className="mt-2 text-xs bg-sky-100 hover:bg-sky-200 text-sky-700 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  Upload Logo
                </button>
              </div>
            </div>
            <input id="logo-input" type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) { setLogoFile(f); handleImagePreview(f, setLogoUrl) } }} />
          </div>

          <hr className="border-amber-100" />

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Clinic Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bright Smiles Dental Clinic"
              className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Address</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main Street, Barangay..."
              className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">City</label>
            <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="Quezon City"
              className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+63 9XX XXX XXXX"
                className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="clinic@email.com"
                className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Tell patients about your clinic, specializations, etc..."
              rows={3} className="w-full border border-sky-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-sky-400 hover:bg-sky-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              : clinic ? 'Save Changes' : '📋 Submit for Approval'
            }
          </button>
        </form>
      </div>

      {!clinic && (
        <div className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <p className="text-amber-700 text-xs">
            📋 After submitting, your clinic will be reviewed by our admin team. You'll be notified once approved and your subscription is confirmed.
          </p>
        </div>
      )}
    </div>
  )
}