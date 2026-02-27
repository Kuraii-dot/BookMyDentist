import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-slate-400 font-medium">({count})</span>}
    </div>
  )
}

function ClinicCard({ clinic }) {
  const navigate = useNavigate()
  return (
    <div className="card overflow-hidden hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
      onClick={() => navigate(`/clinic/${clinic.id}`)}>
      <div className="relative h-36 overflow-hidden" style={{background:'linear-gradient(135deg, rgba(186,230,253,0.6), rgba(207,250,254,0.5))'}}>
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center"><span className="text-5xl opacity-20">🦷</span></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"/>
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-11 h-11 rounded-xl border-2 border-white/90 shadow-lg overflow-hidden" style={{background:'rgba(255,255,255,0.9)'}}>
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-lg">🦷</div>
            }
          </div>
        </div>
        {clinic.avg_rating > 0 && (
          <div className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm"
            style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(8px)'}}>
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-xs font-bold text-slate-700">{clinic.avg_rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="p-4 pt-7">
        <h3 className="font-display font-bold text-slate-900 text-sm leading-tight">{clinic.name}</h3>
        <p className="text-slate-400 text-xs mt-0.5">{clinic.city || 'Location not set'}</p>
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

const LOGO = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-md"
      style={{boxShadow:'0 4px 12px rgba(14,165,233,0.35)'}}>
      <span className="text-white text-sm">🦷</span>
    </div>
    <span className="font-display font-bold text-slate-900 text-lg">BookMyDentist</span>
  </div>
)

export default function Landing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [clinics, setClinics]   = useState([])
  const [filtered, setFiltered] = useState([])
  const [cities, setCities]     = useState([])
  const [search, setSearch]     = useState('')
  const [city, setCity]         = useState('all')
  const [serviceFilter, setServiceFilter] = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('clinics')
      .select('*, services(id,name,price), reviews(rating)')
      .eq('is_active', true).eq('verification_status', 'approved')
      .then(({ data }) => {
        const enriched = (data||[]).map(c => ({
          ...c,
          avg_rating: c.reviews?.length ? c.reviews.reduce((s,r)=>s+r.rating,0)/c.reviews.length : 0,
          review_count: c.reviews?.length || 0
        }))
        setClinics(enriched); setFiltered(enriched)
        setCities([...new Set(enriched.map(c=>c.city).filter(Boolean))])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let r = clinics
    if (search) r = r.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()) || c.services?.some(s=>s.name?.toLowerCase().includes(search.toLowerCase())))
    if (city !== 'all') r = r.filter(c => c.city === city)
    if (serviceFilter) r = r.filter(c => c.services?.some(s=>s.name?.toLowerCase().includes(serviceFilter.toLowerCase())))
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
        {/* Extra ambient orbs for hero */}
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
              <Link to="/register" className="btn btn-primary btn-lg">
                Book Appointment
              </Link>
              <Link to="/register?role=clinic" className="btn btn-secondary btn-lg">
                List Your Clinic →
              </Link>
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
                <div className="flex gap-0.5 mb-0.5"><StarRating rating={5}/></div>
                <p className="text-xs text-slate-500"><span className="font-semibold text-slate-700">4.9/5</span> from 500+ patients</p>
              </div>
            </div>
          </div>

          {/* Right — glass image card */}
          <div className="relative flex justify-center md:justify-end animate-fade-in" style={{animationDelay:'150ms'}}>
            <div className="relative w-full max-w-sm">
              {/* Main image card — glass treatment */}
              <div className="relative h-[400px] sm:h-[460px] w-full rounded-3xl overflow-hidden"
                style={{
                  background:'linear-gradient(135deg, rgba(186,230,253,0.7), rgba(207,250,254,0.6), rgba(253,230,138,0.3))',
                  border:'1px solid rgba(255,255,255,0.85)',
                  backdropFilter:'blur(20px)',
                  boxShadow:'0 24px 64px rgba(14,165,233,0.18), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)'
                }}>
                {/* Placeholder — replace this div with <img src="..." className="w-full h-full object-cover"/> */}
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl animate-float"
                    style={{background:'rgba(255,255,255,0.7)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.9)',boxShadow:'0 8px 32px rgba(14,165,233,0.15)'}}>
                    🦷
                  </div>
                  <p className="text-sky-400 text-sm font-semibold" style={{backdropFilter:'blur(8px)'}}>Add your hero image here</p>
                  <p className="text-sky-300 text-xs text-center px-8 leading-relaxed">Replace this div with:<br/>&lt;img src="…" className="w-full h-full object-cover"/&gt;</p>
                </div>
                {/* Shimmer overlay */}
                <div className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{background:'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.15) 100%)'}}/>
              </div>

              {/* Floating stat chip — glass */}
              <div className="absolute -bottom-4 -left-5 rounded-2xl px-4 py-3.5 animate-float"
                style={{background:'rgba(255,255,255,0.80)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.90)',boxShadow:'0 8px 32px rgba(14,165,233,0.12)',animationDelay:'0.5s'}}>
                <p className="text-xs text-slate-400">Happy patients</p>
                <p className="font-display text-xl font-bold text-slate-900">12,000+</p>
              </div>

              {/* Floating verified chip */}
              <div className="absolute -top-3 -right-4 rounded-2xl px-3 py-2.5 flex items-center gap-2 animate-float"
                style={{background:'rgba(255,255,255,0.80)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.90)',boxShadow:'0 8px 24px rgba(14,165,233,0.10)',animationDelay:'1.5s'}}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{background:'rgba(224,242,254,0.8)'}}>✅</div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Verified Clinics</p>
                  <p className="text-xs text-slate-400">All clinics reviewed</p>
                </div>
              </div>

              {/* Floating amber chip */}
              <div className="absolute top-1/2 -left-8 rounded-2xl px-3 py-2 flex items-center gap-2 animate-float"
                style={{background:'rgba(255,255,255,0.75)',backdropFilter:'blur(16px)',border:'1px solid rgba(253,230,138,0.6)',boxShadow:'0 4px 16px rgba(251,191,36,0.15)',animationDelay:'0.8s'}}>
                <span className="text-lg">⭐</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">Top Rated</p>
                  <p className="text-xs text-slate-400">4.9 avg</p>
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
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
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
            {[
              { value:`${clinics.length}+`, label:'Verified Clinics',       color:'text-sky-600' },
              { value:'12,000+',            label:'Appointments Booked',    color:'text-cyan-600' },
              { value:'4.9★',              label:'Average Rating',         color:'text-amber-500' },
            ].map(s => (
              <div key={s.label}>
                <p className={`font-display font-bold text-2xl sm:text-3xl ${s.color}`}>{s.value}</p>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
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
              <span className="text-5xl">🔍</span>
              <p className="text-slate-600 font-semibold mt-4 text-lg">No clinics found</p>
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
              { step:'01', icon:'🔍', title:'Find a Clinic', desc:'Search by location, service, or browse verified dental clinics near you.' },
              { step:'02', icon:'📅', title:'Pick a Schedule', desc:'Choose your preferred date and time from real-time availability.' },
              { step:'03', icon:'✅', title:'Confirm & Go', desc:'Get instant confirmation and reminders for your appointment.' },
            ].map(s => (
              <div key={s.step} className="card p-7 text-left relative overflow-hidden">
                {/* Ambient orb per card */}
                <div className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30"
                  style={{background:'radial-gradient(circle, rgba(14,165,233,0.4) 0%, transparent 70%)'}}/>
                <div className="text-xs font-black text-sky-300 mb-3 tracking-widest">{s.step}</div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{background:'rgba(224,242,254,0.7)',border:'1px solid rgba(186,230,253,0.8)',backdropFilter:'blur(8px)'}}>
                  {s.icon}
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
            {/* Colorful inner orbs */}
            <div className="pointer-events-none absolute top-0 left-0 w-64 h-64 rounded-full opacity-40"
              style={{background:'radial-gradient(circle, rgba(186,230,253,0.8) 0%, transparent 70%)'}}/>
            <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-30"
              style={{background:'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)'}}/>
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 animate-float"
                style={{background:'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(6,182,212,0.15))',border:'1px solid rgba(186,230,253,0.8)',backdropFilter:'blur(12px)'}}>
                🦷
              </div>
              <h2 className="font-display font-bold text-slate-900 text-3xl sm:text-4xl mb-4" style={{letterSpacing:'-0.02em'}}>
                Ready to Book Your Visit?
              </h2>
              <p className="text-slate-500 mb-8 text-base">Join thousands of patients who found their trusted dentist on BookMyDentist.</p>
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
            <p className="text-slate-400 text-sm">© 2025 BookMyDentist. All rights reserved.</p>
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