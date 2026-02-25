import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-slate-400 font-medium">({count})</span>
    </div>
  )
}

function ClinicCard({ clinic, onBook }) {
  return (
    <div className="card overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-br from-sky-100 to-cyan-50 overflow-hidden">
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-5xl opacity-20">🦷</span></div>
        }
        {/* Logo */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-12 h-12 rounded-xl border-2 border-white bg-white shadow-md overflow-hidden">
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-sky-100 flex items-center justify-center text-xl">🦷</div>
            }
          </div>
        </div>
        {/* Rating badge */}
        {clinic.avg_rating > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-xs font-bold text-slate-700">{clinic.avg_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-4 pt-8">
        <h3 className="font-display font-bold text-slate-900 text-base leading-tight">{clinic.name}</h3>
        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {clinic.city || 'Location not set'}
        </p>
        {clinic.review_count > 0 && <div className="mt-1.5"><StarRating rating={clinic.avg_rating} count={clinic.review_count} /></div>}

        {/* Services preview */}
        {clinic.services?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {clinic.services.slice(0, 3).map(s => (
              <span key={s.id} className="badge badge-sky text-xs">{s.name}</span>
            ))}
            {clinic.services.length > 3 && <span className="badge badge-gray">+{clinic.services.length - 3}</span>}
          </div>
        )}

        {/* Pricing */}
        {clinic.services?.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            From <span className="font-semibold text-sky-600">₱{Math.min(...clinic.services.map(s => s.price || 0)).toLocaleString()}</span>
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <Link to={`/clinic/${clinic.id}`} className="btn btn-secondary btn-sm flex-1 text-center">View Details</Link>
          <button onClick={() => onBook(clinic)} className="btn btn-primary btn-sm flex-1">Book Now</button>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [clinics, setClinics] = useState([])
  const [filtered, setFiltered] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('')
  const heroRef = useRef(null)

  useEffect(() => {
    if (user && profile) {
      const map = { super_admin: '/admin', clinic_owner: '/clinic', customer: '/dashboard' }
      navigate(map[profile.role] || '/')
    }
  }, [user, profile])

  useEffect(() => {
    async function fetchClinics() {
      const { data } = await supabase
        .from('clinics')
        .select('*, services(id, name, price), reviews(rating)')
        .eq('is_active', true)
        .eq('verification_status', 'approved')
        .order('created_at', { ascending: false })

      const enriched = (data || []).map(c => ({
        ...c,
        avg_rating: c.reviews?.length ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length : 0,
        review_count: c.reviews?.length || 0
      }))

      setClinics(enriched)
      setFiltered(enriched)
      const uniqueCities = [...new Set(enriched.map(c => c.city).filter(Boolean))]
      setCities(uniqueCities)
      setLoading(false)
    }
    fetchClinics()
  }, [])

  useEffect(() => {
    let result = clinics
    if (search) result = result.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase()) ||
      c.services?.some(s => s.name?.toLowerCase().includes(search.toLowerCase()))
    )
    if (cityFilter !== 'all') result = result.filter(c => c.city === cityFilter)
    if (serviceFilter) result = result.filter(c =>
      c.services?.some(s => s.name?.toLowerCase().includes(serviceFilter.toLowerCase()))
    )
    setFiltered(result)
  }, [search, cityFilter, serviceFilter, clinics])

  function handleBook(clinic) {
    if (!user) { navigate('/login'); return }
    navigate(`/book/${clinic.id}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">🦷</span>
            </div>
            <span className="font-display font-bold text-slate-900 text-lg">BookMyDentist</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-secondary btn-sm hidden sm:flex">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-amber-100">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px'}} />
        </div>
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/20 blur-3xl rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
            Trusted by patients across the Philippines
          </div>
          <h1 className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-700 text-5xl sm:text-6xl md:text-7xl leading-[1.1] mb-6 animate-fade-in" style={{animationDelay: '100ms'}}>
            Your Smile Deserves<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-300">the Best Care</span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in" style={{animationDelay: '200ms'}}>
            Book dental appointments instantly. Find top-rated clinics near you, check availability, and get reminders — all in one place.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto animate-fade-in" style={{animationDelay: '300ms'}}>
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-sky-950/30 p-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input
                  type="text"
                  placeholder="Search clinics, services, city..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none rounded-xl"
                />
              </div>
              <select
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="sm:w-40 px-3 py-2.5 text-sm text-slate-700 bg-slate-50 rounded-xl focus:outline-none border border-slate-100"
              >
                <option value="all">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-primary btn-md rounded-xl whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gradient-to-br from-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 divide-x divide-sky-500">
          {[
            { value: `${clinics.length}+`, label: 'Verified Clinics' },
            { value: '10k+', label: 'Appointments Booked' },
            { value: '4.8★', label: 'Average Rating' },
          ].map(s => (
            <div key={s.label} className="text-center px-4">
              <p className="font-display font-bold text-black text-xl sm:text-2xl">{s.value}</p>
              <p className="text-black text-xs sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clinics section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display font-bold text-slate-900 text-2xl sm:text-3xl">Find a Clinic</h2>
            <p className="text-slate-500 mt-1 text-sm">{filtered.length} clinic{filtered.length !== 1 ? 's' : ''} available</p>
          </div>
          {/* Service filter chips */}
          <div className="flex flex-wrap gap-2">
            {['Cleaning', 'Braces', 'Whitening', 'Extraction', 'Implants'].map(s => (
              <button key={s} onClick={() => setServiceFilter(serviceFilter === s ? '' : s)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${serviceFilter === s ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-100" />
                <div className="p-4 pt-8 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl">
            <span className="text-5xl">🔍</span>
            <p className="text-slate-600 font-semibold mt-4">No clinics found</p>
            <p className="text-slate-400 text-sm mt-1">Try a different search or city filter</p>
            <button onClick={() => { setSearch(''); setCityFilter('all'); setServiceFilter('') }}
              className="btn btn-secondary btn-md mt-4">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {filtered.map(clinic => (
              <div key={clinic.id} className="animate-fade-in">
                <ClinicCard clinic={clinic} onBook={handleBook} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-slate-900 text-3xl">How DentBook Works</h2>
            <p className="text-slate-500 mt-2">Book your appointment in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🔍', title: 'Find a Clinic', desc: 'Browse verified dental clinics in your city and compare services and ratings.' },
              { step: '02', icon: '📅', title: 'Book a Time', desc: 'Choose your preferred service and pick a date that works for you.' },
              { step: '03', icon: '✅', title: 'Get Confirmed', desc: 'Receive instant confirmation and reminders before your appointment.' },
            ].map(s => (
              <div key={s.step} className="relative text-center">
                <div className="w-16 h-16 bg-sky-50 border-2 border-sky-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">{s.icon}</div>
                <span className="font-display font-bold text-sky-200 text-4xl absolute top-0 right-0 sm:relative sm:block hidden">{s.step}</span>
                <h3 className="font-display font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />
            <div className="relative">
              <h2 className="font-display font-bold text-white text-3xl sm:text-4xl mb-4">Ready for a healthier smile?</h2>
              <p className="text-sky-100 mb-8 text-lg">Join thousands of patients who trust DentBook for their dental care.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="btn bg-white text-sky-700 hover:bg-sky-50 btn-lg rounded-2xl shadow-lg">
                  Book an Appointment
                </Link>
                <Link to="/register?role=clinic" className="btn border-2 border-white/30 text-white hover:bg-white/10 btn-lg rounded-2xl">
                  List Your Clinic →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-600 rounded-md flex items-center justify-center"><span className="text-white text-xs">🦷</span></div>
            <span className="font-display font-bold text-slate-700">DentBook</span>
          </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} DentBook. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-slate-400">
            <a href="#" className="hover:text-sky-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-sky-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-sky-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}