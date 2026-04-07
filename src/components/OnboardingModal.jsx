import { useState, useEffect } from 'react'
import { X, MapPin, Calendar, Star, Shield, ChevronRight, CheckCircle2, Search, Clock, FileText, Lightbulb } from 'lucide-react'

const STEPS = [
  {
    Icon: Shield,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    title: 'Welcome to BookMyDentistPH!',
    subtitle: 'Your dental care, simplified.',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          We're so glad you're here! BookMyDentistPH connects patients with verified dental clinics
          across the Philippines — so you can book appointments without the endless phone calls.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: MapPin,    label: 'Find clinics',     desc: 'Near you, in your city'    },
            { Icon: Calendar,  label: 'Book instantly',   desc: '24/7, no waiting'           },
            { Icon: Star,      label: 'Real reviews',     desc: 'From verified patients'     },
            { Icon: Shield,    label: 'Verified clinics', desc: 'Admin-approved only'        },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="bg-sky-50 rounded-xl p-3 border border-sky-100">
              <div className="w-7 h-7 bg-sky-100 rounded-lg flex items-center justify-center mb-2">
                <Icon className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <p className="font-semibold text-slate-800 text-xs">{label}</p>
              <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    Icon: Search,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    title: 'How to find a clinic',
    subtitle: 'Step 1 of the journey',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          Browse hundreds of verified dental clinics across the Philippines. Filter by city, service, price range, and ratings.
        </p>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Go to Browse Clinics from the navigation' },
            { step: '2', text: 'Filter by your city or the service you need' },
            { step: '3', text: 'Click on a clinic to view services, reviews, and contact info' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {s.step}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-700 text-xs font-medium">Try searching by service name — "Braces", "Cleaning", or "Whitening"</p>
        </div>
      </div>
    ),
  },
  {
    Icon: Calendar,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'How to book an appointment',
    subtitle: 'It only takes 3 steps',
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          Booking is quick and easy. Create a free account first, then follow these steps:
        </p>
        <div className="space-y-3">
          {[
            { step: '1', label: 'Choose a service', desc: "Pick the dental treatment you need from the clinic's menu" },
            { step: '2', label: 'Pick a schedule',  desc: 'Select an available date and time that works for you' },
            { step: '3', label: 'Confirm & wait',   desc: "Submit your request — the clinic will confirm shortly and you'll get an email!" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {s.step}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{s.label}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    Icon: FileText,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    title: 'Before you get started',
    subtitle: 'Quick terms notice',
    content: (
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs text-slate-600 leading-relaxed">
          {[
            { title: 'Booking Platform Only.', desc: 'BookMyDentistPH is not a medical provider. We connect patients with dental clinics. All medical decisions rest with you and your dentist.' },
            { title: 'Verified Clinics.',       desc: 'All clinics are reviewed by our admin team before listing. However, we encourage you to read reviews and do your own research.' },
            { title: 'Your Privacy.',           desc: 'We take your data seriously. Your personal information is never sold to third parties. See our full Privacy Policy for details.' },
            { title: 'Cancellations.',          desc: 'You can cancel upcoming appointments through your dashboard. Please be considerate of clinic schedules.' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p><strong>{item.title}</strong> {item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400">
          By continuing you agree to our{' '}
          <a href="/terms" className="text-sky-500 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-sky-500 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    ),
  },
]

export default function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = sessionStorage.getItem('bmdph_onboarded')
    if (!seen) setTimeout(() => setOpen(true), 800)
  }, [])

  function handleClose() {
    sessionStorage.setItem('bmdph_onboarded', '1')
    setOpen(false)
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleClose()
  }

  if (!open) return null

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-sky-500 transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-1">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${current.iconBg} border border-slate-100 flex items-center justify-center shrink-0`}>
              <current.Icon className={`w-5 h-5 ${current.iconColor}`} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base leading-tight">{current.title}</h3>
              <p className="text-slate-400 text-xs mt-0.5">{current.subtitle}</p>
            </div>
          </div>
          <button onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 animate-fade-in" key={step}>
          {current.content}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`rounded-full transition-all ${i === step ? 'w-5 h-2 bg-sky-500' : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="btn btn-ghost btn-sm text-slate-500">Back</button>
            )}
            <button onClick={handleNext}
              className="btn btn-primary btn-sm flex items-center gap-1.5 px-5">
              {isLast
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> Get Started</>
                : <>Next <ChevronRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}