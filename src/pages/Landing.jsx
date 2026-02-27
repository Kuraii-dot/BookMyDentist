import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── Floating stat card ──────────────────────────────────
function FloatCard({ icon, value, label, className = '' }) {
  return (
    <div className={`absolute bg-white rounded-2xl px-4 py-3 shadow-xl border border-sky-100 ${className}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-display font-bold text-slate-900 text-sm leading-none">{value}</p>
          <p className="text-slate-400 text-xs mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  )
}

// ── Star rating ─────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

// ── Clinic card ─────────────────────────────────────────
function ClinicCard({ clinic }) {
  const navigate = useNavigate()
  const avgRating = clinic.reviews?.length
    ? clinic.reviews.reduce((s, r) => s + r.rating, 0) / clinic.reviews.length : 0

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-sky-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-br from-sky-100 to-cyan-50 overflow-hidden">
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-5xl opacity-20">🦷</span></div>}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-12 h-12 rounded-2xl border-2 border-white bg-white shadow-md overflow-hidden">
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-sky-50 flex items-center justify-center text-xl">🦷</div>}
          </div>
        </div>
        {avgRating > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-xs font-bold text-slate-700">{avgRating.toFixed(1)}</span>
            <span className="text-slate-400 text-xs">({clinic.reviews?.length})</span>
          </div>
        )}
      </div>

      <div className="p-5 pt-8 flex flex-col flex-1">
        <h3 className="font-display font-bold text-slate-900 leading-tight">{clinic.name}</h3>
        <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {clinic.city || 'Philippines'}
        </p>

        {clinic.services?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {clinic.services.slice(0, 3).map(s => (
              <span key={s.id} className="text-xs px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-100 font-medium">{s.name}</span>
            ))}
            {clinic.services.length > 3 && (
              <span className="text-xs px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-100">+{clinic.services.length - 3}</span>
            )}
          </div>
        )}

        {clinic.services?.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            From <span className="font-bold text-sky-600">₱{Math.min(...clinic.services.map(s => s.price || 0)).toLocaleString()}</span>
          </p>
        )}

        <div className="flex gap-2 mt-auto pt-4">
          <Link to={`/clinic/${clinic.id}`} className="flex-1 text-center py-2.5 text-sm font-semibold rounded-2xl border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 transition-all">
            Details
          </Link>
          <button onClick={() => navigate(`/book/${clinic.id}`)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-2xl text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{background: 'linear-gradient(135deg, #0ea5e9, #0284c7)'}}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Landing ────────────────────────────────────────
export default function Landing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [clinics, setClinics]   = useState([])
  const [filtered, setFiltered] = useState([])
  const [cities, setCities]     = useState([])
  const [search, setSearch]     = useState('')
  const [city, setCity]         = useState('all')
  const [service, setService]   = useState('')
  const [loading, setLoading]   = useState(true)

  // Redirect logged-in users except on explicit visit
  useEffect(() => {
    if (profile && window.location.pathname === '/' && !window.location.search) {
      const map = { super_admin: '/admin', clinic_owner: '/clinic', customer: '/dashboard' }
      navigate(map[profile.role] || '/')
    }
  }, [profile])

  useEffect(() => {
    supabase.from('clinics')
      .select('*, services(id, name, price), reviews(rating)')
      .eq('is_active', true).eq('verification_status', 'approved')
      .then(({ data }) => {
        setClinics(data || [])
        setFiltered(data || [])
        setCities([...new Set((data || []).map(c => c.city).filter(Boolean))])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let r = clinics
    if (search) r = r.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()) || c.services?.some(s => s.name?.toLowerCase().includes(search.toLowerCase())))
    if (city !== 'all') r = r.filter(c => c.city === city)
    if (service) r = r.filter(c => c.services?.some(s => s.name?.toLowerCase().includes(service.toLowerCase())))
    setFiltered(r)
  }, [search, city, service, clinics])

  const SERVICES = ['Cleaning', 'Braces', 'Whitening', 'Extraction', 'Implants', 'Checkup']

  return (
    <div className="min-h-screen" style={{backgroundColor:'#f0f9ff'}}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sky-100/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm text-white text-sm font-bold"
              style={{background:'linear-gradient(135deg,#0ea5e9,#0284c7)'}}>🦷</div>
            <span className="font-display font-bold text-slate-900 text-lg">DentBook</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={() => navigate(profile?.role === 'clinic_owner' ? '/clinic' : '/dashboard')}
                className="btn btn-primary btn-sm">My Dashboard →</button>
            ) : (
              <>
                <Link to="/login"    className="btn btn-secondary btn-sm hidden sm:inline-flex">Sign In</Link>
                <Link to="/register" className="btn btn-primary  btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{background:'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 40%, #fef3c7 100%)'}}>
        {/* Soft radial glow */}
        <div className="pointer-events-none absolute -right-40 -top-40 w-[700px] h-[700px] rounded-full opacity-30"
          style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 65%)'}} />
        <div className="pointer-events-none absolute -left-20 bottom-0 w-[400px] h-[400px] rounded-full opacity-20"
          style={{background:'radial-gradient(circle, #fde68a 0%, transparent 65%)'}} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 items-center gap-12 lg:gap-20">

          {/* Left — copy */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-sky-200 text-sky-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-sm">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              Trusted by patients across the Philippines
            </div>

            <h1 className="font-display font-bold text-5xl sm:text-6xl leading-[1.08] mb-5 text-transparent bg-clip-text bg-linear-to-r from-sky-500 to-cyan-100">
              Your Smile<br />
              Deserves{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-linear-to-r from-sky-500 to-cyan-300"
                  style={{backgroundImage:'linear-gradient(135deg,#0ea5e9,#f59e0b)'}}>
                  the Best
                </span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-amber-200/50 -z-0 rounded-sm" />
              </span>
            </h1>

            <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-md">
              Book dental appointments instantly. Find top-rated clinics near you, check real-time availability, and get reminders — all in one place.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg hover:-translate-y-0.5 hover:shadow-sky-200/80 transition-all"
                style={{background:'linear-gradient(135deg,#0ea5e9,#0284c7)'}}>
                Book an Appointment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Link>
              <Link to="/register?role=clinic"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold text-slate-700 bg-white border border-sky-200 hover:border-sky-400 hover:text-sky-700 transition-all shadow-sm">
                List Your Clinic
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              {[['✓', 'Free to use'], ['✓', 'Verified clinics'], ['✓', 'Instant booking']].map(([icon, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="text-sky-500 font-bold">{icon}</span> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right — image card */}
          <div className="relative flex justify-center md:justify-end animate-fade-in" style={{animationDelay:'150ms'}}>
            {/* Main image card */}
            <div className="relative w-full max-w-sm">
              <div className="h-[440px] w-full rounded-3xl overflow-hidden shadow-2xl border border-sky-100"
                style={{background:'linear-gradient(145deg,#e0f2fe,#bae6fd)'}}>
                {/* Placeholder — replace src with your actual image */}
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-sky-300 select-none">
                  <div className="w-20 h-20 rounded-full bg-sky-200/60 flex items-center justify-center text-4xl">🦷</div>
                  <p className="text-sm font-medium text-sky-400">Add your hero image here</p>
                  <p className="text-xs text-sky-300 px-8 text-center">Replace this div's background with your clinic photo — e.g. a smiling patient or dentist at work</p>
                </div>
              </div>

              {/* Floating cards */}
              <FloatCard icon="⭐" value="4.9 / 5"      label="Average rating"       className="-left-6 top-8 animate-float" />
              <FloatCard icon="📅" value="2,400+"        label="Appointments booked"  className="-right-4 bottom-24 animate-float" style={{animationDelay:'1s'}} />
              <FloatCard icon="🏥" value="120+ Clinics"  label="Verified & active"    className="left-4 -bottom-4 animate-float" style={{animationDelay:'2s'}} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Search bar ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-sky-100 p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Search clinics or services..." value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-10 !rounded-2xl border-sky-100 focus:border-sky-400" />
          </div>
          <select value={city} onChange={e => setCity(e.target.value)}
            className="input sm:!w-44 !rounded-2xl border-sky-100">
            <option value="all">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-primary btn-md !rounded-2xl shrink-0 px-6">Search</button>
        </div>
      </section>

      {/* ── Service chips ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-4 flex flex-wrap gap-2 justify-center">
        {SERVICES.map(s => (
          <button key={s} onClick={() => setService(service === s ? '' : s)}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
            style={service === s
              ? {backgroundColor:'var(--color-brand)', color:'#fff', borderColor:'var(--color-brand)'}
              : {backgroundColor:'#fff', color:'#475569', borderColor:'#e0f2fe'}}>
            {s}
          </button>
        ))}
        {(search || city !== 'all' || service) && (
          <button onClick={() => { setSearch(''); setCity('all'); setService('') }}
            className="px-4 py-2 rounded-full text-sm font-medium bg-red-50 text-red-400 border border-red-100 hover:bg-red-100 transition-all">
            ✕ Clear
          </button>
        )}
      </section>

      {/* ── Clinic grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-3xl">Featured Clinics</h2>
            <p className="text-slate-400 mt-1">{filtered.length} verified clinic{filtered.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-sky-100 animate-pulse">
                <div className="h-40 bg-sky-50" />
                <div className="p-5 pt-8 space-y-3">
                  <div className="h-4 bg-sky-50 rounded-full w-3/4" />
                  <div className="h-3 bg-sky-50 rounded-full w-1/2" />
                  <div className="h-10 bg-sky-50 rounded-2xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-sky-100">
            <span className="text-5xl">🔍</span>
            <p className="font-display font-bold text-slate-700 text-xl mt-5">No clinics found</p>
            <p className="text-slate-400 mt-2">Try a different search or clear your filters</p>
            <button onClick={() => { setSearch(''); setCity('all'); setService('') }}
              className="btn btn-primary btn-md mt-5">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {filtered.map(c => <ClinicCard key={c.id} clinic={c} />)}
          </div>
        )}
      </section>

      {/* ── How it works ── */}
      <section className="py-20" style={{background:'linear-gradient(180deg,#f0f9ff 0%,#ffffff 100%)'}}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-3 block">How It Works</span>
          <h2 className="font-display font-bold text-slate-900 text-4xl mb-14">Book in 3 simple steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 stagger">
            {[
              { step:'01', icon:'🔍', title:'Find a Clinic',   desc:'Browse verified clinics by city, service, or rating. Every clinic is reviewed by our team.' },
              { step:'02', icon:'📅', title:'Pick a Time',     desc:'See real-time availability. Choose a date and slot that fits your schedule — no phone calls needed.' },
              { step:'03', icon:'✅', title:'Get Confirmed',   desc:'Receive an instant confirmation. The clinic reviews and approves your request, then you\'re all set.' },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-3xl p-7 border border-sky-100 shadow-sm hover:shadow-md transition-all animate-fade-in text-left">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl">{s.icon}</span>
                  <span className="font-display font-bold text-sky-100 text-4xl">{s.step}</span>
                </div>
                <h3 className="font-display font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <div className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
          style={{background:'linear-gradient(135deg,#0ea5e9 0%,#0284c7 50%,#0369a1 100%)'}}>
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 2px 2px,rgba(255,255,255,0.4) 1px,transparent 0)',backgroundSize:'28px 28px'}} />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{background:'#fde68a'}} />
          <div className="relative">
            <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">Join DentBook</span>
            <h2 className="font-display font-bold text-white text-4xl sm:text-5xl mb-4">Ready for a healthier smile?</h2>
            <p className="text-sky-100 text-lg mb-8 max-w-xl mx-auto">Create your free account and book your first appointment in under 2 minutes.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold bg-white text-sky-700 shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all">
                Get Started Free →
              </Link>
              <Link to="/register?role=clinic"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all">
                List Your Clinic
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-sky-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs"
              style={{background:'linear-gradient(135deg,#0ea5e9,#0284c7)'}}>🦷</div>
            <span className="font-display font-bold text-slate-700">DentBook</span>
          </div>
          <p className="text-slate-400 text-sm">© 2025 DentBook · Made with ❤️ for Filipino smiles</p>
          <div className="flex gap-4">
            <Link to="/login"    className="text-slate-400 hover:text-sky-600 text-sm transition-colors">Sign In</Link>
            <Link to="/register" className="text-slate-400 hover:text-sky-600 text-sm transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}