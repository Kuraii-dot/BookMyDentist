import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ProfileEdit() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirm: '' })
  const [savingPass, setSavingPass] = useState(false)
  const [tab, setTab] = useState('profile')

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
      setAvatarUrl(profile.avatar_url)
    }
  }, [profile])

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    let newAvatarUrl = avatarUrl
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}/avatar-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('clinic-images').upload(path, avatarFile, { upsert: true })
      if (upErr) { toast.error('Failed to upload avatar'); setSaving(false); return }
      const { data } = supabase.storage.from('clinic-images').getPublicUrl(path)
      newAvatarUrl = data.publicUrl
    }
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone, avatar_url: newAvatarUrl }).eq('id', user.id)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Profile updated!')
    setAvatarUrl(newAvatarUrl); setAvatarFile(null); setSaving(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error("Passwords don't match"); return }
    if (passwordForm.newPass.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
    if (error) { toast.error(error.message); setSavingPass(false); return }
    toast.success('Password updated!')
    setPasswordForm({ newPass: '', confirm: '' }); setSavingPass(false)
  }

  const tabs = [{ key:'profile', label:'👤 Profile' }, { key:'password', label:'🔒 Security' }]

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">Manage your profile and security</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-sky-100 p-1 mb-6 shadow-sm">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={tab === t.key ? {backgroundColor:'var(--color-brand)'} : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-6">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input').click()}>
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-sky-100 border-2 border-white shadow-md ring-2 ring-sky-200">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-sky-600">
                        {form.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                  }
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{form.full_name}</p>
                <p className="text-slate-400 text-sm capitalize">{profile?.role?.replace('_',' ')}</p>
                <button type="button" onClick={() => document.getElementById('avatar-input').click()}
                  className="btn btn-secondary btn-sm mt-2 rounded-xl">Change Photo</button>
              </div>
              <input id="avatar-input" type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files[0]; if (f) { setAvatarFile(f); setAvatarUrl(URL.createObjectURL(f)) } }} />
            </div>

            <hr className="border-sky-50" />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
              <input type="text" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                placeholder="Juan dela Cruz" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input type="email" value={profile?.email || ''} disabled className="input bg-sky-50 text-slate-400 cursor-not-allowed" />
              <p className="text-slate-400 text-xs mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="+63 9XX XXX XXXX" className="input" />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary btn-md w-full rounded-2xl">
              {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="rounded-2xl p-3.5 bg-sky-50 border border-sky-100 mb-2">
              <p className="text-sky-700 text-xs font-medium">🔒 Enter your new password twice to confirm the change.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <input type="password" required value={passwordForm.newPass}
                onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})}
                placeholder="At least 6 characters" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
              <input type="password" required value={passwordForm.confirm}
                onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                placeholder="Repeat new password" className="input" />
              {passwordForm.confirm && passwordForm.newPass !== passwordForm.confirm && (
                <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
              )}
            </div>
            <button type="submit" disabled={savingPass || passwordForm.newPass !== passwordForm.confirm}
              className="btn btn-primary btn-md w-full rounded-2xl">
              {savingPass ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}