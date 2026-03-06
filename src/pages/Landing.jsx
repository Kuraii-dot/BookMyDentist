import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── SVG Icons (no emojis) ────────────────────────────────────────────────────
const ToothIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.5 2 7 4 7 6.5c0 1.5.5 2.8 1 4 .6 1.4.8 2.8.8 4.2 0 1.5.3 5.3 1.7 5.3.9 0 1.2-1.3 1.5-3 .3-1.7.5-3 1-3s.7 1.3 1 3c.3 1.7.6 3 1.5 3 1.4 0 1.7-3.8 1.7-5.3 0-1.4.2-2.8.8-4.2.5-1.2 1-2.5 1-4C18 4 15.5 2 12 2z"/>
  </svg>
)
const SearchIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const CalendarIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)
const CheckCircleIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const StarIcon = ({ className = 'w-4 h-4', filled = false }) => (
  <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const ShieldCheckIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
  </svg>
)
const BuildingIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
  </svg>
)
const ClipboardIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
)
const MapPinIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const ChevronRightIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <StarIcon key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} filled={s <= Math.round(rating)} />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-slate-400 font-medium">({count})</span>}
    </div>
  )
}

// ── Clinic Card ──────────────────────────────────────────────────────────────
function ClinicCard({ clinic }) {
  const navigate = useNavigate()
  return (
    <div className="card overflow-hidden hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
      onClick={() => navigate(`/clinic/${clinic.id}`)}>
      <div className="relative h-36 overflow-hidden" style={{background:'linear-gradient(135deg, rgba(186,230,253,0.6), rgba(207,250,254,0.5))'}}>
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center">
              <ToothIcon className="w-14 h-14 text-sky-200" />
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"/>
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-11 h-11 rounded-xl border-2 border-white/90 shadow-lg overflow-hidden" style={{background:'rgba(255,255,255,0.9)'}}>
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center">
                  <ToothIcon className="w-6 h-6 text-sky-400" />
                </div>
            }
          </div>
        </div>
        {clinic.avg_rating > 0 && (
          <div className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm"
            style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(8px)'}}>
            <StarIcon className="w-3 h-3 text-amber-400" filled />
            <span className="text-xs font-bold text-slate-700">{clinic.avg_rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-4 pt-7">
        <h3 className="font-display font-bold text-slate-900 text-sm leading-tight">{clinic.name}</h3>
        {clinic.city && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPinIcon className="w-3 h-3 text-slate-400" />
            <p className="text-slate-400 text-xs">{clinic.city}</p>
          </div>
        )}
        {clinic.review_count > 0 && <div className="mt-1.5"><StarRating rating={clinic.avg_rating} count={clinic.review_count}/></div>}
        {clinic.services?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {clinic.services.slice(0,3).map(s => (
              <span key={s.id} className="badge badge-teal" style={{fontSize:'0.65rem'}}>{s.name}</span>
            ))}
            {clinic.services.length > 3 && <span className="badge badge-gray" style={{fontSize:'0.65rem'}}>+{clinic.services.length-3}</span>}
          </div>
        )}
        {clinic.services?.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">From <span className="font-bold text-sky-600">₱{Math.min(...clinic.services.map(s=>s.price||0)).toLocaleString()}</span></p>
        )}
        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          <Link to={`/clinic/${clinic.id}`} className="btn btn-secondary btn-sm flex-1 text-center text-xs">Details</Link>
          <button onClick={() => navigate(`/book/${clinic.id}`)} className="btn btn-primary btn-sm flex-1 text-xs">Book Now</button>
        </div>
      </div>
    </div>
  )
}

// ── Logo ─────────────────────────────────────────────────────────────────────
const LOGO = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-md"
      style={{boxShadow:'0 4px 12px rgba(14,165,233,0.35)'}}>
      <ToothIcon className="w-4 h-4 text-white" />
    </div>
    <span className="font-display font-bold text-slate-900 text-lg">BookMyDentist</span>
  </div>
)

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [clinics,   setClinics]   = useState([])
  const [filtered,  setFiltered]  = useState([])
  const [cities,    setCities]    = useState([])
  const [search,    setSearch]    = useState('')
  const [city,      setCity]      = useState('all')
  const [serviceFilter, setServiceFilter] = useState('')
  const [loading,   setLoading]   = useState(true)

  // Real stats from DB
  const [stats, setStats] = useState({ clinics: 0, appointments: 0, avgRating: null })

  useEffect(() => {
    // Load clinics
    supabase.from('clinics')
      .select('*, services(id,name,price), reviews(rating)')
      .eq('is_active', true).eq('verification_status', 'approved')
      .then(({ data }) => {
        const enriched = (data||[]).map(c => ({
          ...c,
          avg_rating:   c.reviews?.length ? c.reviews.reduce((s,r)=>s+r.rating,0)/c.reviews.length : 0,
          review_count: c.reviews?.length || 0
        }))
        setClinics(enriched); setFiltered(enriched)
        setCities([...new Set(enriched.map(c=>c.city).filter(Boolean))])
        setLoading(false)
      })

    // Load real stats
    Promise.all([
      supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('verification_status', 'approved'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('rating'),
    ]).then(([clinicRes, apptRes, reviewRes]) => {
      const ratings = (reviewRes.data || []).map(r => r.rating)
      const avg = ratings.length ? (ratings.reduce((s,r)=>s+r,0)/ratings.length) : null
      setStats({
        clinics:      clinicRes.count  || 0,
        appointments: apptRes.count    || 0,
        avgRating:    avg,
      })
    })
  }, [])

  useEffect(() => {
    let r = clinics
    if (search)         r = r.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()) || c.services?.some(s=>s.name?.toLowerCase().includes(search.toLowerCase())))
    if (city !== 'all') r = r.filter(c => c.city === city)
    if (serviceFilter)  r = r.filter(c => c.services?.some(s=>s.name?.toLowerCase().includes(serviceFilter.toLowerCase())))
    setFiltered(r)
  }, [search, city, serviceFilter, clinics])

  const SERVICES = ['Cleaning','Braces','Whitening','Extraction','Implants','Checkup']

  return (
    <div className="min-h-screen" style={{fontFamily:"'DM Sans', sans-serif"}}>

      {/* ── NAV ── */}
      <nav className="glass-header fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <LOGO />
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate(profile?.role === 'clinic_owner' ? '/clinic' : '/dashboard')}
                className="btn btn-primary btn-md">Dashboard →</button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors px-3 py-2">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-md">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-8">
        <div className="pointer-events-none absolute top-10 left-1/4 w-80 h-80 rounded-full opacity-40 animate-float"
          style={{background:'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)', animationDelay:'0s'}}/>
        <div className="pointer-events-none absolute top-20 right-1/4 w-60 h-60 rounded-full opacity-30 animate-float"
          style={{background:'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)', animationDelay:'2s'}}/>
        <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-25 animate-float"
          style={{background:'radial-gradient(circle, rgba(186,230,253,0.5) 0%, transparent 70%)', animationDelay:'1s'}}/>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.35)',color:'#92400e',backdropFilter:'blur(8px)'}}>
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"/>
              Trusted by patients across the Philippines
            </div>
            <h1 className="font-display font-bold text-slate-900 text-4xl sm:text-5xl lg:text-6xl leading-[1.08] mb-5" style={{letterSpacing:'-0.02em'}}>
              Your Smile<br/>
              Deserves<br/>
              <span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg, #0ea5e9, #06b6d4)'}}>
                the Best Care
              </span>
            </h1>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-md mb-8">
              Book dental appointments instantly. Find top-rated clinics near you, check real-time availability, and never miss a visit.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary btn-lg">Book Appointment</Link>
              <Link to="/register?role=clinic" className="btn btn-secondary btn-lg">List Your Clinic <ChevronRightIcon className="w-4 h-4 inline ml-1"/></Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-8 pt-8" style={{borderTop:'1px solid rgba(186,230,253,0.5)'}}>
              <div className="flex -space-x-2">
                {['#bae6fd','#7dd3fc','#38bdf8','#0ea5e9'].map((col,i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white/80 flex items-center justify-center text-white text-xs font-bold"
                    style={{backgroundColor:col}}>
                    {['J','M','A','R'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(s => <StarIcon key={s} className="w-3.5 h-3.5 text-amber-400" filled />)}
                </div>
                <p className="text-xs text-slate-500">Rated by our early patients</p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative flex justify-center md:justify-end animate-fade-in" style={{animationDelay:'150ms'}}>
            <div className="relative w-full max-w-sm">
              <div className="relative h-[400px] sm:h-[460px] w-full rounded-3xl overflow-hidden"
                style={{
                  background:'linear-gradient(135deg, rgba(186,230,253,0.7), rgba(207,250,254,0.6), rgba(253,230,138,0.3))',
                  border:'1px solid rgba(255,255,255,0.85)',
                  backdropFilter:'blur(20px)',
                  boxShadow:'0 24px 64px rgba(14,165,233,0.18), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
                }}>
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center animate-float"
                    style={{background:'rgba(255,255,255,0.7)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.9)',boxShadow:'0 8px 32px rgba(14,165,233,0.15)'}}>
                    <ToothIcon className="w-12 h-12 text-sky-400" />
                  </div>
                  <p className="text-sky-400 text-sm font-semibold">Add your hero image here</p>
                  <p className="text-sky-300 text-xs text-center px-8 leading-relaxed">Replace this div with:<br/>&lt;img src="…" className="w-full h-full object-cover"/&gt;</p>
                </div>
                <div className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{background:'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.15) 100%)'}}/>
              </div>

              {/* Floating chips */}
              <div className="absolute -bottom-4 -left-5 rounded-2xl px-4 py-3.5 animate-float"
                style={{background:'rgba(255,255,255,0.80)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.90)',boxShadow:'0 8px 32px rgba(14,165,233,0.12)',animationDelay:'0.5s'}}>
                <p className="text-xs text-slate-400">Happy patients</p>
                <p className="font-display text-xl font-bold text-slate-900">
                  {stats.appointments > 0 ? `${stats.appointments}` : '—'}
                </p>
              </div>

              <div className="absolute -top-3 -right-4 rounded-2xl px-3 py-2.5 flex items-center gap-2 animate-float"
                style={{background:'rgba(255,255,255,0.80)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.90)',boxShadow:'0 8px 24px rgba(14,165,233,0.10)',animationDelay:'1.5s'}}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{background:'rgba(224,242,254,0.8)'}}>
                  <ShieldCheckIcon className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Verified Clinics</p>
                  <p className="text-xs text-slate-400">Admin reviewed</p>
                </div>
              </div>

              <div className="absolute top-1/2 -left-8 rounded-2xl px-3 py-2 flex items-center gap-2 animate-float"
                style={{background:'rgba(255,255,255,0.75)',backdropFilter:'blur(16px)',border:'1px solid rgba(253,230,138,0.6)',boxShadow:'0 4px 16px rgba(251,191,36,0.15)',animationDelay:'0.8s'}}>
                <StarIcon className="w-5 h-5 text-amber-400" filled />
                <div>
                  <p className="text-xs font-bold text-slate-800">Top Rated</p>
                  <p className="text-xs text-slate-400">
                    {stats.avgRating ? `${stats.avgRating.toFixed(1)} avg` : 'New platform'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH ── */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search clinics, services, or city..." value={search}
                  onChange={e => setSearch(e.target.value)} className="input pl-10"/>
              </div>
              <select value={city} onChange={e => setCity(e.target.value)} className="input sm:w-44">
                <option value="all">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(s => (
                <button key={s} onClick={() => setServiceFilter(serviceFilter === s ? '' : s)}
                  className={`text-xs px-4 py-2 rounded-full font-semibold transition-all ${serviceFilter === s ? 'btn-primary btn text-white' : 'btn-secondary btn'}`}>
                  {s}
                </button>
              ))}
              {(search || city !== 'all' || serviceFilter) && (
                <button onClick={() => { setSearch(''); setCity('all'); setServiceFilter('') }}
                  className="text-xs px-4 py-2 rounded-full font-semibold bg-red-50 text-red-400 border border-red-100 hover:bg-red-100 transition-all">
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="card p-5 grid grid-cols-3 gap-6 text-center">
            {/* Clinics — real count */}
            <div>
              <div className="flex justify-center mb-1">
                <BuildingIcon className="w-5 h-5 text-sky-400" />
              </div>
              <p className="font-display font-bold text-2xl sm:text-3xl text-sky-600">
                {stats.clinics > 0 ? stats.clinics : '—'}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Verified Clinics</p>
            </div>
            {/* Appointments — real count */}
            <div>
              <div className="flex justify-center mb-1">
                <ClipboardIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="font-display font-bold text-2xl sm:text-3xl text-cyan-600">
                {stats.appointments > 0 ? stats.appointments : '—'}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Appointments Booked</p>
            </div>
            {/* Avg rating — real or N/A */}
            <div>
              <div className="flex justify-center mb-1">
                <StarIcon className="w-5 h-5 text-amber-400" filled />
              </div>
              <p className="font-display font-bold text-2xl sm:text-3xl text-amber-500">
                {stats.avgRating ? `${stats.avgRating.toFixed(1)}★` : '—'}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Average Rating</p>
            </div>
          </div>
          {/* Honest note when data is sparse */}
          {(stats.clinics < 3 || stats.appointments < 10) && (
            <p className="text-center text-slate-400 text-xs mt-3">
              We're just getting started — real numbers grow as clinics join and patients book.
            </p>
          )}
        </div>
      </section>

      {/* ── CLINICS GRID ── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-baseline justify-between mb-7">
            <div>
              <h2 className="font-display font-bold text-slate-900 text-2xl sm:text-3xl" style={{letterSpacing:'-0.02em'}}>
                {search || city !== 'all' || serviceFilter ? 'Search Results' : 'Featured Clinics'}
              </h2>
              <p className="text-slate-400 text-sm mt-1">{filtered.length} clinic{filtered.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_,i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="h-36" style={{background:'rgba(186,230,253,0.3)'}}/>
                  <div className="p-4 pt-7 space-y-2">
                    <div className="h-4 rounded-xl w-3/4" style={{background:'rgba(186,230,253,0.4)'}}/>
                    <div className="h-3 rounded-xl w-1/2" style={{background:'rgba(186,230,253,0.3)'}}/>
                    <div className="h-8 rounded-xl mt-3" style={{background:'rgba(186,230,253,0.25)'}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="flex justify-center mb-4">
                <SearchIcon className="w-12 h-12 text-slate-200" />
              </div>
              <p className="text-slate-600 font-semibold text-lg">No clinics found</p>
              <p className="text-slate-400 text-sm mt-1 mb-5">Try different filters</p>
              <button onClick={() => { setSearch(''); setCity('all'); setServiceFilter('') }}
                className="btn btn-primary btn-md mx-auto">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(c => <ClinicCard key={c.id} clinic={c}/>)}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-3">Simple Process</p>
          <h2 className="font-display font-bold text-slate-900 text-3xl sm:text-4xl mb-14" style={{letterSpacing:'-0.02em'}}>Book in 3 Easy Steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step:'01', Icon: SearchIcon,      title:'Find a Clinic',    desc:'Search by location, service, or browse verified dental clinics near you.' },
              { step:'02', Icon: CalendarIcon,    title:'Pick a Schedule',  desc:'Choose your preferred date and time from real-time availability.' },
              { step:'03', Icon: CheckCircleIcon, title:'Confirm & Go',     desc:'Get instant confirmation and reminders for your appointment.' },
            ].map(s => (
              <div key={s.step} className="card p-7 text-left relative overflow-hidden">
                <div className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30"
                  style={{background:'radial-gradient(circle, rgba(14,165,233,0.4) 0%, transparent 70%)'}}/>
                <div className="text-xs font-black text-sky-300 mb-3 tracking-widest">{s.step}</div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{background:'rgba(224,242,254,0.7)',border:'1px solid rgba(186,230,253,0.8)',backdropFilter:'blur(8px)'}}>
                  <s.Icon className="w-6 h-6 text-sky-500" />
                </div>
                <h3 className="font-display font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="card p-12 text-center relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 left-0 w-64 h-64 rounded-full opacity-40"
              style={{background:'radial-gradient(circle, rgba(186,230,253,0.8) 0%, transparent 70%)'}}/>
            <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-30"
              style={{background:'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)'}}/>
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float"
                style={{background:'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(6,182,212,0.15))',border:'1px solid rgba(186,230,253,0.8)',backdropFilter:'blur(12px)'}}>
                <ToothIcon className="w-8 h-8 text-sky-500" />
              </div>
              <h2 className="font-display font-bold text-slate-900 text-3xl sm:text-4xl mb-4" style={{letterSpacing:'-0.02em'}}>
                Ready to Book Your Visit?
              </h2>
              <p className="text-slate-500 mb-8 text-base">Join patients who found their trusted dentist on BookMyDentist.</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/register" className="btn btn-primary btn-lg">Book Now — It's Free</Link>
                <Link to="/register?role=clinic" className="btn btn-secondary btn-lg">List Your Clinic</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12" style={{borderTop:'1px solid rgba(186,230,253,0.4)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <LOGO />
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} BookMyDentist. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link to="/register" className="hover:text-sky-500 transition-colors">Sign Up</Link>
              <Link to="/login"    className="hover:text-sky-500 transition-colors">Sign In</Link>
              <Link to="/register?role=clinic" className="hover:text-sky-500 transition-colors">For Clinics</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}