import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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

function ClinicCard({ clinic }) {
  const navigate = useNavigate()
  return (
    <div className="card overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Banner */}
      <div className="relative h-36 bg-gradient-to-br from-sky-50 to-cyan-50 overflow-hidden">
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-5xl opacity-10">🦷</span></div>
        }
        {/* Logo */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-11 h-11 rounded-xl border-2 border-white bg-white shadow-md overflow-hidden">
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-sky-50 flex items-center justify-center text-lg">🦷</div>
            }
          </div>
        </div>
        {/* Rating pill */}
        {clinic.avg_rating > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-xs font-bold text-slate-700">{clinic.avg_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-4 pt-7">
        <h3 className="font-display font-bold text-slate-900 text-sm leading-tight">{clinic.name}</h3>
        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {clinic.city || 'Location not set'}
        </p>
        {clinic.review_count > 0 && <div className="mt-1.5"><StarRating rating={clinic.avg_rating} count={clinic.review_count} /></div>}

        {clinic.services?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {clinic.services.slice(0, 3).map(s => (
              <span key={s.id} className="badge badge-sky" style={{fontSize:'0.65rem', padding:'0.15rem 0.5rem'}}>{s.name}</span>
            ))}
            {clinic.services.length > 3 && <span className="badge badge-gray" style={{fontSize:'0.65rem', padding:'0.15rem 0.5rem'}}>+{clinic.services.length - 3}</span>}
          </div>
        )}

        {clinic.services?.length > 0 && (
          <p className="text-xs text-slate-400 mt-1.5">
            From <span className="font-semibold" style={{color: 'var(--color-brand)'}}>₱{Math.min(...clinic.services.map(s => s.price || 0)).toLocaleString()}</span>
          </p>
        )}

        <div className="flex gap-2 mt-3">
          <Link to={`/clinic/${clinic.id}`} className="btn btn-secondary btn-sm flex-1 text-center text-xs">Details</Link>
          <button onClick={() => navigate(`/book/${clinic.id}`)} className="btn btn-primary btn-sm flex-1 text-xs">Book Now</button>
        </div>
      </div>
    </div>
  )
}

export default function BrowseClinics() {
  const [clinics, setClinics] = useState([])
  const [filtered, setFiltered] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('')

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
      setCities([...new Set(enriched.map(c => c.city).filter(Boolean))])
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

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Browse Clinics</h1>
        <p className="page-subtitle">Find and book from {clinics.length} verified dental clinics</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" placeholder="Search clinics, services, city..."
            value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
          className="input sm:w-44">
          <option value="all">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Service chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['Cleaning', 'Braces', 'Whitening', 'Extraction', 'Implants', 'Checkup'].map(s => (
          <button key={s} onClick={() => setServiceFilter(serviceFilter === s ? '' : s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${serviceFilter === s ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            style={serviceFilter === s ? {backgroundColor: 'var(--color-brand)', borderColor: 'var(--color-brand)'} : {}}>
            {s}
          </button>
        ))}
        {(search || cityFilter !== 'all' || serviceFilter) && (
          <button onClick={() => { setSearch(''); setCityFilter('all'); setServiceFilter('') }}
            className="text-xs px-3 py-1.5 rounded-full font-medium bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all">
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-slate-400 text-sm mb-4">
        Showing <span className="font-semibold text-slate-600">{filtered.length}</span> clinic{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-36 bg-slate-100" />
              <div className="p-4 pt-7 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-100 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-slate-600 font-semibold mt-4">No clinics found</p>
          <p className="text-slate-400 text-sm mt-1">Try a different search or remove filters</p>
          <button onClick={() => { setSearch(''); setCityFilter('all'); setServiceFilter('') }}
            className="btn btn-secondary btn-md mt-4">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map(clinic => (
            <div key={clinic.id} className="animate-fade-in">
              <ClinicCard clinic={clinic} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}