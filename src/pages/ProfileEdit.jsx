import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  Camera, Eye, EyeOff, Calendar, Clock, XCircle,
  RefreshCw, CheckCircle2, Phone, Shield, Bell,
} from 'lucide-react'
import { PageHeader, Field, Alert } from '../components/ui/shared'

// ── OTP Input ─────────────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  function handleChange(e, i) {
    const v = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = value.padEnd(6, ' ').split('')
    arr[i] = v || ' '
    onChange(arr.join('').trimEnd())
    if (v && i < 5) refs[i + 1].current?.focus()
  }
  function handleKey(e, i) {
    if (e.key === 'Backspace' && !e.target.value && i > 0) refs[i - 1].current?.focus()
  }
  function handlePaste(e) {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(p); e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ''} onChange={e => handleChange(e, i)} onKeyDown={e => handleKey(e, i)}
          disabled={disabled}
          className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-xl transition-all focus:outline-none
            ${value[i] && value[i] !== ' ' ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-900'}
            ${disabled ? 'opacity-50' : 'focus:border-sky-500'}`} />
      ))}
    </div>
  )
}

const SMS_NOTIFICATIONS = [
  { Icon: Calendar,  text: 'Appointment confirmations'          },
  { Icon: Clock,     text: 'Reminders (1 day before)'           },
  { Icon: XCircle,   text: 'Cancellations or reschedules'       },
]

export default function ProfileEdit() {
  const { user, profile } = useAuth()
  const [form, setForm]             = useState({ full_name: '', phone: '' })
  const [avatarUrl, setAvatarUrl]   = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [pwForm, setPwForm]         = useState({ newPass: '', confirm: '' })
  const [savingPw, setSavingPw]     = useState(false)
  const [showPw, setShowPw]         = useState(false)
  const [tab, setTab]               = useState('profile')
  const [phoneStep, setPhoneStep]   = useState('idle')
  const [otpCode, setOtpCode]       = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [countdown, setCountdown]   = useState(0)

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
      setAvatarUrl(profile.avatar_url)
      setPhoneVerified(!!profile.phone_verified)
    }
  }, [profile])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function formatPhone(raw) {
    const d = raw.replace(/\D/g, '')
    if (d.startsWith('09') && d.length === 11) return '+63' + d.slice(1)
    if (d.startsWith('639') && d.length === 12) return '+' + d
    return raw
  }

  async function handleSaveProfile(e) {
    e.preventDefault(); setError('')
    if (!form.full_name.trim()) { setError('Name is required'); return }
    setSaving(true)
    let newAvatar = avatarUrl
    if (avatarFile) {
      const ext  = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}/avatar-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('clinic-images').upload(path, avatarFile, { upsert: true })
      if (upErr) { setError('Failed to upload avatar'); setSaving(false); return }
      newAvatar = supabase.storage.from('clinic-images').getPublicUrl(path).data.publicUrl
    }
    const { error: err } = await supabase.from('profiles')
      .update({ full_name: form.full_name, phone: form.phone, avatar_url: newAvatar }).eq('id', user.id)
    if (err) { setError(err.message); setSaving(false); return }
    toast.success('Profile updated!'); setAvatarUrl(newAvatar); setAvatarFile(null); setSaving(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (pwForm.newPass !== pwForm.confirm) { toast.error("Passwords don't match"); return }
    if (pwForm.newPass.length < 8) { toast.error('Min 8 characters'); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPass })
    if (error) { toast.error(error.message); setSavingPw(false); return }
    toast.success('Password updated!'); setPwForm({ newPass: '', confirm: '' }); setSavingPw(false)
  }

  async function handleSendOtp() {
    const fmt = formatPhone(form.phone)
    if (!/^\+63\d{10}$/.test(fmt)) { toast.error('Enter a valid PH number (09XX XXX XXXX)'); return }
    await supabase.from('profiles').update({ phone: fmt }).eq('id', user.id)
    setSendingOtp(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: fmt })
    setSendingOtp(false)
    if (error) { toast.error(error.message); return }
    setPhoneStep('sent'); setCountdown(60); toast.success('OTP sent!')
  }

  async function handleVerifyOtp() {
    if (otpCode.replace(/\s/g, '').length < 6) { toast.error('Enter the 6-digit code'); return }
    const fmt = formatPhone(form.phone)
    setVerifyingOtp(true)
    const { error } = await supabase.auth.verifyOtp({ phone: fmt, token: otpCode.trim(), type: 'sms' })
    setVerifyingOtp(false)
    if (error) { toast.error('Invalid or expired code'); return }
    await supabase.from('profiles').update({ phone_verified: true, phone: fmt }).eq('id', user.id)
    setPhoneVerified(true); setPhoneStep('idle'); setOtpCode('')
    toast.success('Phone verified!')
  }

  const TABS = [
    { key: 'profile',  label: 'Profile'  },
    { key: 'phone',    label: 'Phone'    },
    { key: 'security', label: 'Security' },
  ]

  return (
    <div className="max-w-lg animate-fade-in">
      <PageHeader title="Account Settings" subtitle="Manage your profile, phone, and security" />

      {/* Tabs */}
      <div className="flex gap-1 card p-1 mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={tab === t.key ? { backgroundColor: 'var(--color-brand)' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile ── */}
      {tab === 'profile' && (
        <div className="card p-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input').click()}>
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-sky-100 border-2 border-white shadow-md ring-2 ring-sky-200">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-sky-600">
                        {form.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                  }
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{form.full_name || 'Your Name'}</p>
                <p className="text-slate-400 text-xs capitalize">{profile?.role?.replace('_', ' ')}</p>
                <button type="button" onClick={() => document.getElementById('avatar-input').click()}
                  className="btn btn-secondary btn-sm mt-1.5">Change Photo</button>
              </div>
              <input id="avatar-input" type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files[0]; if (f) { setAvatarFile(f); setAvatarUrl(URL.createObjectURL(f)) } }} />
            </div>

            <hr className="border-slate-100" />

            <Field label="Full Name" required>
              <input type="text" required value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Juan dela Cruz" className="input" />
            </Field>
            <Field label="Email" hint="Email cannot be changed here">
              <input type="email" value={profile?.email || ''} disabled className="input opacity-60" />
            </Field>
            <Field label="Mobile Number" hint={
              phoneVerified
                ? 'Phone verified — SMS notifications active'
                : form.phone ? 'Not verified — go to Phone tab to verify' : 'Add your number to receive SMS booking alerts'
            }>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇵🇭</span>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="09XX XXX XXXX" className="input pl-9" />
              </div>
            </Field>

            {error && <Alert type="error">{error}</Alert>}

            <button type="submit" disabled={saving} className="btn btn-primary btn-md w-full">
              {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ── Phone ── */}
      {tab === 'phone' && (
        <div className="card p-6">
          {phoneVerified ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="font-display font-bold text-slate-800 text-lg mb-1">Phone Verified!</h3>
              <p className="text-slate-500 text-sm mb-1">Your number <strong>{profile?.phone}</strong> is verified.</p>
              <p className="text-slate-400 text-xs mb-5">You'll receive SMS alerts for bookings and reminders.</p>
              <div className="bg-sky-50 rounded-xl p-4 text-left space-y-2 border border-sky-100">
                <p className="section-label mb-2">SMS notifications include</p>
                {SMS_NOTIFICATIONS.map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-sky-400 shrink-0" />
                    <p className="text-slate-600 text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-base">Verify your mobile number</h3>
                  <p className="text-slate-500 text-xs">We'll send a 6-digit code via SMS.</p>
                </div>
              </div>

              {phoneStep === 'idle' && (
                <div className="space-y-4">
                  <Field label="Mobile Number">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">🇵🇭</span>
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="09XX XXX XXXX" className="input pl-9" />
                    </div>
                  </Field>
                  <button onClick={handleSendOtp} disabled={sendingOtp || !form.phone} className="btn btn-primary btn-md w-full flex items-center justify-center gap-2">
                    {sendingOtp
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending...</>
                      : <><Phone className="w-4 h-4" />Send Code</>}
                  </button>
                </div>
              )}

              {phoneStep === 'sent' && (
                <div className="space-y-4">
                  <div className="bg-sky-50 rounded-xl p-3 text-center border border-sky-100">
                    <p className="text-sky-700 text-xs">Code sent to <strong>{formatPhone(form.phone)}</strong></p>
                  </div>
                  <Field label="Enter 6-digit code">
                    <OtpInput value={otpCode} onChange={setOtpCode} disabled={verifyingOtp} />
                  </Field>
                  <button onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpCode.replace(/\s/g, '').length < 6}
                    className="btn btn-primary btn-md w-full">
                    {verifyingOtp
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying...</>
                      : 'Verify Code'}
                  </button>
                  <div className="text-center">
                    {countdown > 0
                      ? <p className="text-slate-400 text-sm">Resend in <strong>{countdown}s</strong></p>
                      : <button onClick={handleSendOtp} disabled={sendingOtp} className="text-sky-600 text-sm font-medium hover:underline">Resend code</button>
                    }
                  </div>
                  <button onClick={() => { setPhoneStep('idle'); setOtpCode('') }}
                    className="w-full text-center text-slate-400 text-sm hover:text-slate-600">
                    ← Change number
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Security ── */}
      {tab === 'security' && (
        <div className="card p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Change Password</p>
                <p className="text-slate-400 text-xs">Enter your new password twice to confirm</p>
              </div>
            </div>
            <Field label="New Password">
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={pwForm.newPass}
                  onChange={e => setPwForm({ ...pwForm, newPass: e.target.value })}
                  placeholder="At least 8 characters" className="input pr-10" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirm New Password">
              <input type="password" required value={pwForm.confirm}
                onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="Repeat new password" className="input" />
              {pwForm.confirm && pwForm.newPass !== pwForm.confirm && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </Field>
            <button type="submit" disabled={savingPw || pwForm.newPass !== pwForm.confirm} className="btn btn-primary btn-md w-full">
              {savingPw
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Updating...</>
                : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}