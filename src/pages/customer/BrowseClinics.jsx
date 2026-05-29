import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MapPin, Star, Search, X } from 'lucide-react'
import { PageHeader, EmptyState, SkeletonCard } from '../../components/ui/shared'
import ToothIcon from '../../components/ToothIcon'
import CoverageBadge from '../../components/CoverageBadge'

const STAR_PATH = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"

function ClinicCard({ clinic }) {
  const navigate = useNavigate()
  return (
    <div className="card overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => navigate(`/clinic/${clinic.id}`)}>
      {/* Banner */}
      <div className="relative h-32 overflow-hidden bg-slate-100">
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center">
              <ToothIcon className="w-10 h-10 text-slate-200" />
            </div>
        }
        {/* Logo */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white bg-white shadow-sm">
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center bg-sky-50">
                  <ToothIcon className="w-5 h-5 text-sky-300" />
                </div>
            }
          </div>
        </div>
        {clinic.avg_rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 shadow-sm text-xs font-bold text-slate-700">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d={STAR_PATH} /></svg>
            {clinic.avg_rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-4 pt-7">
        <h3 className="font-display font-bold text-slate-900 text-sm leading-tight">{clinic.name}</h3>
        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />{clinic.city || 'Location not set'}
        </p>
        {clinic.review_count > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <svg key={s} className={`w-3 h-3 ${s <= Math.round(clinic.avg_rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d={STAR_PATH} />
                </svg>
              ))}
            </div>
            <span className="text-xs text-slate-400">({clinic.review_count})</span>
          </div>
        )}
        {clinic.services?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {clinic.services.slice(0, 3).map(s => (
              <span key={s.id} className="inline-flex items-center gap-1 flex-wrap">
                <span className="badge badge-teal" style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}>{s.name}</span>
                <CoverageBadge value={s.covered} className="text-xs" />
              </span>
            ))}
            {clinic.services.length > 3 && <span className="badge badge-gray" style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}>+{clinic.services.length - 3}</span>}
          </div>
        )}
        {clinic.services?.length > 0 && (
          <p className="text-xs text-slate-400 mt-1.5">
            From <span className="font-bold text-sky-600">₱{Math.min(...clinic.services.map(s => s.price || 0)).toLocaleString()}</span>
          </p>
        )}
        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          <Link to={`/clinic/${clinic.id}`} className="btn btn-secondary btn-sm flex-1 text-xs text-center">Details</Link>
          <button onClick={() => navigate(`/book/${clinic.id}`)} className="btn btn-primary btn-sm flex-1 text-xs">Book Now</button>
        </div>
      </div>
    </div>
  )
}

const SERVICES = ['Cleaning', 'Braces', 'Whitening', 'Extraction', 'Implants', 'Checkup']

export default function BrowseClinics() {
  const [clinics, setClinics]             = useState([])
  const [filtered, setFiltered]           = useState([])
  const [cities, setCities]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [cityFilter, setCityFilter]       = useState('all')
  const [serviceFilter, setServiceFilter] = useState('')

  useEffect(() => {
    supabase.from('clinics')
      .select('id, name, city, logo_url, banner_url, created_at, services(id,name,price,covered), reviews(rating)')
      .eq('is_active', true)
      .eq('verification_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(120)
      .then(({ data }) => {
        const enriched = (data || []).map(c => ({
          ...c,
          avg_rating:   c.reviews?.length ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length : 0,
          review_count: c.reviews?.length || 0,
        }))
        setClinics(enriched); setFiltered(enriched)
        setCities([...new Set(enriched.map(c => c.city).filter(Boolean))])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let r = clinics
    if (search)            r = r.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase()) || c.services?.some(s => s.name?.toLowerCase().includes(search.toLowerCase())))
    if (cityFilter !== 'all') r = r.filter(c => c.city === cityFilter)
    if (serviceFilter)     r = r.filter(c => c.services?.some(s => s.name?.toLowerCase().includes(serviceFilter.toLowerCase())))
    setFiltered(r)
  }, [search, cityFilter, serviceFilter, clinics])

  const hasFilter = search || cityFilter !== 'all' || serviceFilter

  return (
    <div className="animate-fade-in">
      <PageHeader title="Browse Clinics" subtitle={`${clinics.length} verified dental clinics`} />

      <div className="card p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search clinics, services, or city…"
              value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="input sm:w-40">
            <option value="all">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map(s => (
            <button key={s} onClick={() => setServiceFilter(serviceFilter === s ? '' : s)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${serviceFilter === s ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
          {hasFilter && (
            <button onClick={() => { setSearch(''); setCityFilter('all'); setServiceFilter('') }}
              className="text-xs px-3 py-1.5 rounded-full font-semibold border border-red-200 text-red-500 hover:bg-red-50 flex items-center gap-1 transition-all">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      <p className="text-slate-400 text-sm mb-4">
        Showing <span className="font-semibold text-slate-600">{filtered.length}</span> clinic{filtered.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="w-7 h-7 text-slate-300" />} title="No clinics found"
          description="Try a different search or remove filters"
          action={<button onClick={() => { setSearch(''); setCityFilter('all'); setServiceFilter('') }} className="btn btn-secondary btn-md">Clear Filters</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map(c => <ClinicCard key={c.id} clinic={c} />)}
        </div>
      )}
    </div>
  )
}
