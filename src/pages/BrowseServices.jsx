import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Icons ────────────────────────────────────────────────────────────────────
const ToothIcon = ({ className='w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.5 2 7 4 7 6.5c0 1.5.5 2.8 1 4 .6 1.4.8 2.8.8 4.2 0 1.5.3 5.3 1.7 5.3.9 0 1.2-1.3 1.5-3 .3-1.7.5-3 1-3s.7 1.3 1 3c.3 1.7.6 3 1.5 3 1.4 0 1.7-3.8 1.7-5.3 0-1.4.2-2.8.8-4.2.5-1.2 1-2.5 1-4C18 4 15.5 2 12 2z"/>
  </svg>
)
const SearchIcon = ({ className='w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const MapPinIcon = ({ className='w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const FilterIcon = ({ className='w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
)
const StarIcon = ({ className='w-3.5 h-3.5', filled=false }) => (
  <svg className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const XIcon = ({ className='w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ChevronDownIcon = ({ className='w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
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

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <StarIcon key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`} filled={s <= Math.round(rating)} />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
    </div>
  )
}

function ClinicCard({ clinic, highlightService }) {
  const navigate = useNavigate()
  const matchedService = highlightService
    ? clinic.services?.find(s => s.name.toLowerCase().includes(highlightService.toLowerCase()))
    : null

  return (
    <div className="card overflow-hidden hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
      onClick={() => navigate(`/clinic/${clinic.id}`)}>
      <div className="relative h-36 overflow-hidden"
        style={{background:'linear-gradient(135deg, rgba(186,230,253,0.6), rgba(207,250,254,0.5))'}}>
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center"><ToothIcon className="w-14 h-14 text-sky-200"/></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"/>
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-11 h-11 rounded-xl border-2 border-white/90 shadow-lg overflow-hidden" style={{background:'rgba(255,255,255,0.9)'}}>
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center"><ToothIcon className="w-6 h-6 text-sky-400"/></div>
            }
          </div>
        </div>
        {clinic.avg_rating > 0 && (
          <div className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 flex items-center gap-1"
            style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(8px)'}}>
            <StarIcon className="w-3 h-3 text-amber-400" filled />
            <span className="text-xs font-bold text-slate-700">{clinic.avg_rating.toFixed(1)}</span>
          </div>
        )}
        {/* Matched service highlight */}
        {matchedService && (
          <div className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{background:'linear-gradient(135deg,#0ea5e9,#06b6d4)',color:'white'}}>
            {matchedService.name} — ₱{parseFloat(matchedService.price).toLocaleString()}
          </div>
        )}
      </div>
      <div className="p-4 pt-7">
        <h3 className="font-display font-bold text-slate-900 text-sm">{clinic.name}</h3>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPinIcon className="w-3 h-3 text-slate-400"/>
          <p className="text-slate-400 text-xs">{clinic.city || 'Location not set'}</p>
        </div>
        {clinic.review_count > 0 && <div className="mt-1.5"><StarRating rating={clinic.avg_rating} count={clinic.review_count}/></div>}
        <div className="flex flex-wrap gap-1 mt-2.5">
          {clinic.services?.slice(0,3).map(s => (
            <span key={s.id} className={`badge text-xs ${highlightService && s.name.toLowerCase().includes(highlightService.toLowerCase()) ? 'badge-teal' : 'badge-gray'}`}
              style={{fontSize:'0.65rem'}}>{s.name}</span>
          ))}
          {clinic.services?.length > 3 && <span className="badge badge-gray" style={{fontSize:'0.65rem'}}>+{clinic.services.length-3}</span>}
        </div>
        {clinic.services?.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">From <span className="font-bold text-sky-600">₱{Math.min(...clinic.services.map(s=>s.price||0)).toLocaleString()}</span></p>
        )}
        <div className="flex gap-2 mt-3" onClick={e=>e.stopPropagation()}>
          <Link to={`/clinic/${clinic.id}`} className="btn btn-secondary btn-sm flex-1 text-xs text-center">Details</Link>
          <button onClick={() => navigate(`/book/${clinic.id}`)} className="btn btn-primary btn-sm flex-1 text-xs">Book Now</button>
        </div>
      </div>
    </div>
  )
}

export default function BrowseServices() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [clinics,    setClinics]    = useState([])
  const [filtered,   setFiltered]   = useState([])
  const [allServices, setAllServices] = useState([])
  const [cities,     setCities]     = useState([])
  const [loading,    setLoading]    = useState(true)

  // Filters
  const [search,     setSearch]     = useState(searchParams.get('search') || '')
  const [service,    setService]    = useState(searchParams.get('service') || '')
  const [city,       setCity]       = useState(searchParams.get('city') || 'all')
  const [minPrice,   setMinPrice]   = useState(searchParams.get('minPrice') || '')
  const [maxPrice,   setMaxPrice]   = useState(searchParams.get('maxPrice') || '')
  const [sortBy,     setSortBy]     = useState('rating')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    supabase.from('clinics')
      .select('*, services(id,name,price), reviews(rating)')
      .eq('is_active', true).eq('verification_status', 'approved')
      .then(({ data }) => {
        const enriched = (data||[]).map(c => ({
          ...c,
          avg_rating:   c.reviews?.length ? c.reviews.reduce((s,r)=>s+r.rating,0)/c.reviews.length : 0,
          review_count: c.reviews?.length || 0,
          min_price:    c.services?.length ? Math.min(...c.services.map(s=>parseFloat(s.price)||0)) : 0,
        }))
        setClinics(enriched)
        setCities([...new Set(enriched.map(c=>c.city).filter(Boolean))])
        // Collect all unique service names
        const svcNames = [...new Set(enriched.flatMap(c=>c.services?.map(s=>s.name)||[]))].sort()
        setAllServices(svcNames)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let r = [...clinics]
    if (search)        r = r.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()))
    if (service)       r = r.filter(c => c.services?.some(s => s.name.toLowerCase().includes(service.toLowerCase())))
    if (city !== 'all') r = r.filter(c => c.city === city)
    if (minPrice)      r = r.filter(c => c.min_price >= parseFloat(minPrice))
    if (maxPrice)      r = r.filter(c => c.services?.some(s => parseFloat(s.price||0) <= parseFloat(maxPrice)))
    if (sortBy === 'rating')    r.sort((a,b) => b.avg_rating - a.avg_rating)
    if (sortBy === 'price_asc') r.sort((a,b) => a.min_price - b.min_price)
    if (sortBy === 'price_desc')r.sort((a,b) => b.min_price - a.min_price)
    if (sortBy === 'reviews')   r.sort((a,b) => b.review_count - a.review_count)
    setFiltered(r)
  }, [search, service, city, minPrice, maxPrice, sortBy, clinics])

  function clearAll() {
    setSearch(''); setService(''); setCity('all'); setMinPrice(''); setMaxPrice(''); setSortBy('rating')
    setSearchParams({})
  }

  const hasFilters = search || service || city !== 'all' || minPrice || maxPrice

  return (
    <div className="min-h-screen" style={{fontFamily:"'DM Sans', sans-serif"}}>
      <div className="pointer-events-none fixed top-0 right-0 w-96 h-96 rounded-full opacity-20" style={{background:'radial-gradient(circle, #bae6fd 0%, transparent 70%)'}}/>

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

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <Link to="/" className="hover:text-sky-500 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">Browse Clinics</span>
            {service && <><span>/</span><span className="text-sky-600 font-semibold">{service}</span></>}
          </div>
          <h1 className="font-display font-bold text-slate-900 text-3xl sm:text-4xl" style={{letterSpacing:'-0.02em'}}>
            {service ? `Clinics offering ${service}` : 'Browse Dental Clinics'}
          </h1>
          <p className="text-slate-400 mt-1">{filtered.length} clinic{filtered.length !== 1 ? 's' : ''} found{city !== 'all' ? ` in ${city}` : ''}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar Filters ── */}
          <div className="lg:w-64 shrink-0">
            {/* Mobile toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full card p-3 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                <FilterIcon className="w-4 h-4 text-sky-500"/>Filters
                {hasFilters && <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold">!</span>}
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
            </button>

            <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Search */}
              <div className="card p-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Search</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Clinic name or city..." className="input pl-9 text-sm"/>
                </div>
              </div>

              {/* Service */}
              <div className="card p-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Service</label>
                <select value={service} onChange={e=>setService(e.target.value)} className="input text-sm">
                  <option value="">All Services</option>
                  {allServices.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Location */}
              <div className="card p-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Location</label>
                <select value={city} onChange={e=>setCity(e.target.value)} className="input text-sm">
                  <option value="all">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Price range */}
              <div className="card p-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Price Range (₱)</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)}
                    placeholder="Min" className="input text-sm w-full" min="0"/>
                  <span className="text-slate-400 text-sm shrink-0">–</span>
                  <input type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}
                    placeholder="Max" className="input text-sm w-full" min="0"/>
                </div>
                {/* Quick price presets */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {[['Under ₱500','','500'],['₱500–1k','500','1000'],['₱1k+','1000','']].map(([label,min,max])=>(
                    <button key={label} onClick={()=>{setMinPrice(min);setMaxPrice(max)}}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all border ${minPrice===min&&maxPrice===max ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="card p-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Sort By</label>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="input text-sm">
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              {hasFilters && (
                <button onClick={clearAll}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all">
                  <XIcon className="w-4 h-4"/>Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Active filter chips */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {service && <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                  Service: {service} <button onClick={()=>setService('')}><XIcon className="w-3 h-3"/></button></span>}
                {city !== 'all' && <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                  City: {city} <button onClick={()=>setCity('all')}><XIcon className="w-3 h-3"/></button></span>}
                {(minPrice||maxPrice) && <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                  Price: ₱{minPrice||'0'} – ₱{maxPrice||'∞'} <button onClick={()=>{setMinPrice('');setMaxPrice('')}}><XIcon className="w-3 h-3"/></button></span>}
                {search && <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-100 text-sky-700 border border-sky-200">
                  "{search}" <button onClick={()=>setSearch('')}><XIcon className="w-3 h-3"/></button></span>}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_,i)=>(
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
                <SearchIcon className="w-12 h-12 text-slate-200 mx-auto mb-4"/>
                <p className="text-slate-600 font-semibold text-lg">No clinics found</p>
                <p className="text-slate-400 text-sm mt-1 mb-5">Try adjusting your filters</p>
                <button onClick={clearAll} className="btn btn-primary btn-md mx-auto">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(c => <ClinicCard key={c.id} clinic={c} highlightService={service}/>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}