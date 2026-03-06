import { Link } from 'react-router-dom'

const ToothIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.5 2 7 4 7 6.5c0 1.5.5 2.8 1 4 .6 1.4.8 2.8.8 4.2 0 1.5.3 5.3 1.7 5.3.9 0 1.2-1.3 1.5-3 .3-1.7.5-3 1-3s.7 1.3 1 3c.3 1.7.6 3 1.5 3 1.4 0 1.7-3.8 1.7-5.3 0-1.4.2-2.8.8-4.2.5-1.2 1-2.5 1-4C18 4 15.5 2 12 2z"/>
  </svg>
)
const ShieldIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
)
const HeartIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const StarIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const UsersIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const BuildingIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
  </svg>
)

const LOGO = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-md">
      <ToothIcon className="w-4 h-4 text-white" />
    </div>
    <span className="font-display font-bold text-slate-900 text-lg">BookMyDentist</span>
  </div>
)

export default function AboutUs() {
  const values = [
    { Icon: ShieldIcon,   color: 'text-sky-500',   bg: 'rgba(224,242,254,0.8)',   title: 'Trust & Safety',     desc: 'Every clinic on our platform goes through a manual verification process by our admin team before going live.' },
    { Icon: HeartIcon,    color: 'text-rose-400',  bg: 'rgba(255,228,230,0.8)',   title: 'Patient First',      desc: 'We built BookMyDentist because finding a good dentist shouldn\'t be hard. Patients deserve clarity, ease, and confidence.' },
    { Icon: StarIcon,     color: 'text-amber-400', bg: 'rgba(254,243,199,0.8)',   title: 'Quality Care',       desc: 'Real reviews from real patients help you make informed choices about where to get your dental care.' },
    { Icon: BuildingIcon, color: 'text-cyan-500',  bg: 'rgba(207,250,254,0.8)',   title: 'Clinic Growth',      desc: 'We partner with clinics to help them manage appointments and grow their patient base digitally.' },
  ]

  const team = [
    { initials: 'BM', name: 'BookMyDentist Team', role: 'Building a healthier Philippines, one smile at a time.', color: '#0ea5e9' },
  ]

  return (
    <div className="min-h-screen" style={{fontFamily:"'DM Sans', sans-serif"}}>
      {/* Ambient */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20" style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 70%)'}}/>
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15" style={{background:'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)'}}/>

      {/* Nav */}
      <nav className="glass-header fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><LOGO /></Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors px-3 py-2">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-md">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="relative pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Hero */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-float"
              style={{background:'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(6,182,212,0.1))', border:'1px solid rgba(186,230,253,0.8)', backdropFilter:'blur(12px)'}}>
              <ToothIcon className="w-10 h-10 text-sky-500" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{background:'rgba(14,165,233,0.1)', border:'1px solid rgba(186,230,253,0.6)', color:'#0369a1'}}>
              Our Story
            </div>
            <h1 className="font-display font-bold text-slate-900 text-4xl sm:text-5xl mb-5" style={{letterSpacing:'-0.02em'}}>
              About <span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg, #0ea5e9, #06b6d4)'}}>BookMyDentist</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto">
              We're on a mission to make dental care in the Philippines more accessible, transparent, and stress-free — for both patients and clinics.
            </p>
          </div>

          {/* Story */}
          <div className="card p-8 sm:p-10 mb-10">
            <h2 className="font-display font-bold text-slate-900 text-2xl mb-4" style={{letterSpacing:'-0.01em'}}>Why we built this</h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>Finding a dentist in the Philippines often means asking around on Facebook groups, calling clinics one by one, or just showing up and hoping there's a slot. It's frustrating, time-consuming, and it shouldn't be this way.</p>
              <p>BookMyDentist was built to change that. We created a platform where patients can find verified dental clinics, see their services and prices upfront, and book an appointment in minutes — not hours.</p>
              <p>For clinics, we provide a simple dashboard to manage availability, accept or reschedule appointments, track their patients, and grow their practice through real patient reviews — without needing to hire a full-time receptionist for scheduling.</p>
            </div>
          </div>

          {/* Values */}
          <h2 className="font-display font-bold text-slate-900 text-2xl mb-6 text-center" style={{letterSpacing:'-0.01em'}}>What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14">
            {values.map(v => (
              <div key={v.title} className="card p-6 flex gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{background: v.bg}}>
                  <v.Icon className={`w-6 h-6 ${v.color}`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 mb-1">{v.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* For clinics CTA */}
          <div className="card p-8 text-center relative overflow-hidden mb-10">
            <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 rounded-full opacity-30" style={{background:'radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 70%)'}}/>
            <div className="relative">
              <UsersIcon className="w-10 h-10 text-sky-400 mx-auto mb-4" />
              <h3 className="font-display font-bold text-slate-900 text-xl mb-2">Are you a dental clinic?</h3>
              <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">Join BookMyDentist to manage your appointments online and reach more patients in your city.</p>
              <Link to="/register?role=clinic" className="btn btn-primary btn-md">List Your Clinic — It's Free</Link>
            </div>
          </div>

          {/* Back */}
          <div className="text-center">
            <Link to="/" className="btn btn-secondary btn-md">← Back to Home</Link>
            <Link to="/contact" className="btn btn-secondary btn-md ml-3">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  )
}