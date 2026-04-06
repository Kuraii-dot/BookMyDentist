import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Upload, Building2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { PageHeader, Field, Alert } from '../../components/ui/shared'
import { sanitizeName, sanitizeText, isValidEmail, isValidPHPhone, validateImageFile, checkRateLimit } from '../../lib/security'

const STATUS_CONFIG = {
  approved: { Icon: CheckCircle2, cls: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Clinic approved and active' },
  pending:  { Icon: Clock,        cls: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200',     label: 'Pending admin approval — you can update your info while waiting' },
  rejected: { Icon: XCircle,      cls: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Application rejected — update your info and contact support' },
}

export default function ClinicProfile() {
  const { user } = useAuth()
  const [form, setForm]             = useState({ name: '', address: '', city: '', phone: '', email: '', description: '' })
  const [clinic, setClinic]         = useState(null)
  const [logoUrl, setLogoUrl]       = useState(null)
  const [bannerUrl, setBannerUrl]   = useState(null)
  const [logoFile, setLogoFile]     = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
      if (data) {
        setClinic(data)
        setForm({
          name:        data.name        || '',
          address:     data.address     || '',
          city:        data.city        || '',
          phone:       data.phone       || '',
          email:       data.email       || '',
          description: data.description || '',
        })
        setLogoUrl(data.logo_url)
        setBannerUrl(data.banner_url)
      }
      setLoading(false)
    }
    load()
  }, [user])

  function handleImageSelect(file, setFile, setPreview, fieldName) {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadImage(file, path) {
    // Re-validate on upload (defense in depth)
    const validation = validateImageFile(file)
    if (!validation.valid) throw new Error(validation.error)

    const ext = file.name.split('.').pop().toLowerCase()
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
    const fileName = `${user.id}/${path}-${Date.now()}.${safeExt}`

    const { error } = await supabase.storage.from('clinic-images').upload(fileName, file, { upsert: true })
    if (error) throw error
    return supabase.storage.from('clinic-images').getPublicUrl(fileName).data.publicUrl
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')

    // Rate limit saves
    const rateCheck = checkRateLimit('image_upload')
    if (!rateCheck.allowed) {
      setError(rateCheck.message)
      return
    }

    // Validate required fields
    if (!form.name.trim()) { setError('Clinic name is required'); return }
    if (form.name.trim().length > 150) { setError('Clinic name is too long'); return }
    if (form.email && !isValidEmail(form.email)) { setError('Please enter a valid email address'); return }
    if (form.phone && !isValidPHPhone(form.phone)) { setError('Please enter a valid Philippine phone number (e.g. 09XX XXX XXXX)'); return }
    if (form.description && form.description.length > 1000) { setError('Description is too long (max 1000 characters)'); return }

    setSaving(true)
    try {
      let newLogo   = logoUrl
      let newBanner = bannerUrl

      if (logoFile)   newLogo   = await uploadImage(logoFile,   'logo')
      if (bannerFile) newBanner = await uploadImage(bannerFile, 'banner')

      const payload = {
        name:        sanitizeName(form.name.trim(), 150),
        address:     sanitizeName(form.address.trim(), 300),
        city:        sanitizeName(form.city.trim(), 100),
        phone:       form.phone.trim().slice(0, 20),
        email:       form.email.trim().toLowerCase().slice(0, 254),
        description: sanitizeText(form.description.trim(), 1000),
        logo_url:    newLogo,
        banner_url:  newBanner,
      }

      if (clinic) {
        await supabase.from('clinics').update(payload).eq('id', clinic.id)
        toast.success('Clinic profile updated!')
      } else {
        const { data: newClinic, error: err } = await supabase.from('clinics').insert({
          ...payload,
          owner_id:            user.id,
          is_active:           false,
          verification_status: 'pending',
          subscription_status: 'unpaid',
        }).select().single()
        if (err) throw err
        setClinic(newClinic)

        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'super_admin')
        if (admins?.length) {
          await supabase.from('notifications').insert(
            admins.map(a => ({
              recipient_id: a.id,
              type:         'new_booking',
              title:        'New Clinic Registration',
              message:      `${payload.name} has submitted a clinic registration and is pending approval.`,
            }))
          )
        }
        toast.success('Clinic submitted! Awaiting admin approval.')
      }

      setLogoUrl(newLogo)
      setBannerUrl(newBanner)
      setLogoFile(null)
      setBannerFile(null)
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-40 mb-6" />
      <div className="skeleton h-32 w-full rounded-xl" />
      <div className="skeleton h-96 w-full rounded-xl" />
    </div>
  )

  const status = clinic ? STATUS_CONFIG[clinic.verification_status] : null

  return (
    <div className="max-w-2xl animate-fade-in">
      <PageHeader
        title="Clinic Profile"
        subtitle={clinic ? 'Update your clinic information' : 'Set up your clinic to start accepting bookings'}
      />

      {status && (
        <div className={`flex items-center gap-3 ${status.bg} border ${status.border} rounded-xl px-4 py-3 mb-5`}>
          <status.Icon className={`w-5 h-5 ${status.cls} shrink-0`} />
          <p className={`text-sm font-medium ${status.cls}`}>{status.label}</p>
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSave} className="space-y-5">

          {/* Banner */}
          <Field label="Banner Image" hint="JPEG, PNG, WebP or GIF — max 5MB. Recommended: 1200×400px">
            <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center group cursor-pointer"
              onClick={() => document.getElementById('banner-input').click()}>
              {bannerUrl
                ? <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                : <div className="text-center text-slate-400">
                    <Upload className="w-8 h-8 mx-auto mb-1.5" />
                    <p className="text-sm font-medium">Upload Banner</p>
                  </div>
              }
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Change Banner
                </span>
              </div>
            </div>
            <input
              id="banner-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={e => {
                const f = e.target.files[0]
                if (f) handleImageSelect(f, setBannerFile, setBannerUrl, 'banner')
                e.target.value = '' // reset so same file can be re-selected
              }}
            />
          </Field>

          {/* Logo */}
          <Field label="Clinic Logo" hint="JPEG, PNG, WebP or GIF — max 5MB. Square image recommended">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer group relative shrink-0"
                onClick={() => document.getElementById('logo-input').click()}>
                {logoUrl
                  ? <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                  : <Building2 className="w-8 h-8 text-slate-300" />
                }
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <Upload className="w-4 h-4 text-white" />
                </div>
              </div>
              <button type="button" onClick={() => document.getElementById('logo-input').click()}
                className="btn btn-secondary btn-sm">
                Upload Logo
              </button>
            </div>
            <input
              id="logo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={e => {
                const f = e.target.files[0]
                if (f) handleImageSelect(f, setLogoFile, setLogoUrl, 'logo')
                e.target.value = ''
              }}
            />
          </Field>

          <hr className="border-slate-100" />

          <Field label="Clinic Name" required>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bright Smiles Dental Clinic"
              maxLength={150}
              className="input"
            />
          </Field>

          <Field label="Address">
            <input
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main Street, Barangay..."
              maxLength={300}
              className="input"
            />
          </Field>

          <Field label="City">
            <input
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="Quezon City"
              maxLength={100}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+63 9XX XXX XXXX"
                maxLength={20}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="clinic@email.com"
                maxLength={254}
                className="input"
              />
            </Field>
          </div>

          <Field label="Description" hint={`${form.description.length}/1000 characters`}>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              maxLength={1000}
              className="input resize-none"
            />
          </Field>

          {error && <Alert type="error">{error}</Alert>}

          <button type="submit" disabled={saving} className="btn btn-primary btn-lg w-full">
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
              : clinic ? 'Save Changes' : 'Submit for Approval'}
          </button>
        </form>
      </div>

      {!clinic && (
        <div className="mt-4">
          <Alert type="info">After submitting, your clinic will be reviewed by our admin team. You'll be notified once approved.</Alert>
        </div>
      )}
    </div>
  )
}