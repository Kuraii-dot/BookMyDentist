import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

// ── OTP Input Component ─────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const digits = (value + '      ').slice(0, 6).split('')
  const inputRef = []

  function handleKey(e, i) {
    if (e.key === 'Backspace' && !e.target.value && i > 0) inputRef[i-1]?.focus()
  }

  function handleChange(e, i) {
    const v = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = value.padEnd(6, ' ').split('')
    arr[i] = v || ' '
    const next = arr.join('').trimEnd()
    onChange(next)
    if (v && i < 5) inputRef[i+1]?.focus()
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0,6)
    onChange(pasted)
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i}
          ref={el => inputRef[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
          disabled={disabled}
          className={`w-11 h-13 text-center text-xl font-bold border-2 rounded-xl transition-all focus:outline-none
            ${value[i] ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-900'}
            ${disabled ? 'opacity-50' : 'focus:border-sky-500'}`}
        />
      ))}
    </div>
  )
}

export default function ProfileEdit() {
  const { user, profile } = useAuth()
  const [form,    setForm]    = useState({ full_name: '', phone: '' })
  const [avatarUrl,  setAvatarUrl]  = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirm: '' })
  const [savingPass,   setSavingPass]   = useState(false)
  const [tab, setTab] = useState('profile')

  // Phone OTP state
  const [phoneStep,     setPhoneStep]     = useState('idle') // idle | sent | verifying
  const [otpCode,       setOtpCode]       = useState('')
  const [sendingOtp,    setSendingOtp]    = useState(false)
  const [verifyingOtp,  setVerifyingOtp]  = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [countdown,     setCountdown]     = useState(0)

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
      setAvatarUrl(profile.avatar_url)
      setPhoneVerified(!!profile.phone_verified)
    }
  }, [profile])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('09') && digits.length === 11) return '+63' + digits.slice(1)
    if (digits.startsWith('639') && digits.length === 12) return '+' + digits
    return raw
  }

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
    const { error } = await supabase.from('profiles')
      .update({ full_name: form.full_name, phone: form.phone, avatar_url: newAvatarUrl })
      .eq('id', user.id)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Profile updated!')
    setAvatarUrl(newAvatarUrl); setAvatarFile(null); setSaving(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (passwordForm.newPass !== passwordForm.confirm) { toast.error("Passwords don't match"); return }
    if (passwordForm.newPass.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass })
    if (error) { toast.error(error.message); setSavingPass(false); return }
    toast.success('Password updated!')
    setPasswordForm({ newPass: '', confirm: '' }); setSavingPass(false)
  }

  // ── Phone OTP ─────────────────────────────────────────────────────────────
  async function handleSendOtp() {
    const formatted = formatPhone(form.phone)
    if (!/^\+63\d{10}$/.test(formatted)) {
      toast.error('Enter a valid PH mobile number first (09XX XXX XXXX)'); return
    }
    // Save phone to profile first
    await supabase.from('profiles').update({ phone: formatted }).eq('id', user.id)

    setSendingOtp(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    setSendingOtp(false)

    if (error) { toast.error(error.message); return }
    setPhoneStep('sent')
    setCountdown(60)
    toast.success('OTP sent to ' + formatted)
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) { toast.error('Enter the 6-digit code'); return }
    const formatted = formatPhone(form.phone)
    setVerifyingOtp(true)
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otpCode,
      type: 'sms',
    })
    setVerifyingOtp(false)

    if (error) { toast.error('Invalid or expired code. Try again.'); return }

    // Mark phone as verified in profiles table
    await supabase.from('profiles').update({ phone_verified: true, phone: formatted }).eq('id', user.id)
    setPhoneVerified(true)
    setPhoneStep('idle')
    setOtpCode('')
    toast.success('📱 Phone number verified!')
  }

  const tabs = [
    { key: 'profile',  label: '👤 Profile' },
    { key: 'phone',    label: '📱 Phone' },
    { key: 'password', label: '🔒 Security' },
  ]

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">Manage your profile, phone, and security</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 card p-1 mb-6 rounded-2xl">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            style={tab === t.key ? {backgroundColor:'var(--color-brand)'} : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        <div className="card p-6">
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
              <input type="email" value={profile?.email || ''} disabled className="input opacity-60 text-slate-400 cursor-not-allowed" />
              <p className="text-slate-400 text-xs mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇵🇭</span>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="09XX XXX XXXX" className="input pl-9" />
              </div>
              {phoneVerified
                ? <p className="text-emerald-600 text-xs mt-1 font-medium">✅ Phone verified — SMS notifications active</p>
                : form.phone
                  ? <p className="text-amber-600 text-xs mt-1">⚠️ Not verified yet — go to the <button type="button" onClick={() => setTab('phone')} className="underline font-medium">Phone tab</button> to verify</p>
                  : <p className="text-slate-400 text-xs mt-1">Add your number to receive SMS booking alerts</p>
              }
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary btn-md w-full rounded-2xl">
              {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ── Phone Verification Tab ── */}
      {tab === 'phone' && (
        <div className="card p-6">
          {phoneVerified ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
              <h3 className="font-display font-bold text-slate-800 text-lg mb-1">Phone Verified!</h3>
              <p className="text-slate-500 text-sm mb-2">
                Your number <span className="font-semibold text-slate-700">{profile?.phone}</span> is verified.
              </p>
              <p className="text-slate-400 text-xs">You'll receive SMS alerts for bookings, reminders, and promos.</p>
              <div className="mt-5 bg-sky-50 rounded-2xl p-4 text-left space-y-2">
                <p className="text-sky-700 text-xs font-semibold uppercase tracking-wide mb-2">You'll receive SMS for:</p>
                {['📅 Appointment confirmations', '⏰ Reminders (1 day before)', '❌ Cancellations or reschedules', '🎉 Promos from your clinic'].map(s => (
                  <p key={s} className="text-slate-600 text-sm">{s}</p>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-5">
                <h3 className="font-display font-bold text-slate-800 text-lg mb-1">Verify your mobile number</h3>
                <p className="text-slate-500 text-sm">We'll send a 6-digit code via SMS to confirm your number.</p>
              </div>

              {phoneStep === 'idle' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇵🇭</span>
                      <input type="tel" value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        placeholder="09XX XXX XXXX" className="input pl-9" />
                    </div>
                  </div>
                  <button onClick={handleSendOtp} disabled={sendingOtp || !form.phone}
                    className="btn btn-primary btn-md w-full rounded-2xl">
                    {sendingOtp
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending OTP...</>
                      : '📱 Send Verification Code'}
                  </button>
                </div>
              )}

              {phoneStep === 'sent' && (
                <div className="space-y-5">
                  <div className="bg-sky-50 rounded-2xl p-4 text-center">
                    <p className="text-sky-700 text-sm font-medium">Code sent to</p>
                    <p className="font-bold text-sky-800">{formatPhone(form.phone)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700 text-center mb-4">Enter 6-digit code</p>
                    <OtpInput value={otpCode} onChange={setOtpCode} disabled={verifyingOtp} />
                  </div>

                  <button onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpCode.length < 6}
                    className="btn btn-primary btn-md w-full rounded-2xl">
                    {verifyingOtp
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Verifying...</>
                      : '✅ Verify Code'}
                  </button>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-slate-400 text-sm">Resend in <span className="font-semibold text-slate-600">{countdown}s</span></p>
                    ) : (
                      <button onClick={handleSendOtp} disabled={sendingOtp}
                        className="text-sky-600 text-sm font-medium hover:text-sky-700">
                        🔄 Resend code
                      </button>
                    )}
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

      {/* ── Security Tab ── */}
      {tab === 'password' && (
        <div className="card p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="rounded-2xl p-3.5 bg-sky-50 border border-sky-100 mb-2">
              <p className="text-sky-700 text-xs font-medium">🔒 Enter your new password twice to confirm the change.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <input type="password" required value={passwordForm.newPass}
                onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})}
                placeholder="At least 8 characters" className="input" />
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