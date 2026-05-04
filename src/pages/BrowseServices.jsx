import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MapPin, Search, X, SlidersHorizontal, Star, ChevronDown } from 'lucide-react'
import Navbar from '../components/Navbar'
import { EmptyState, SkeletonCard } from '../components/ui/shared'

const STAR_PATH = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"

function ClinicCard({ clinic, highlightService }) {
  const navigate = useNavigate()
  const matched = highlightService
    ? clinic.services?.find(s=>s.name.toLowerCase().includes(highlightService.toLowerCase()))
    : null

  return (
    <div className="card overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group"
      onClick={()=>navigate(`/clinic/${clinic.id}`)}>
      <div className="relative h-32 overflow-hidden bg-slate-100">
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center text-4xl opacity-10">🦷</div>
        }
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <div className="w-10 h-10 rounded-xl border-2 border-white bg-white shadow-sm overflow-hidden">
            {clinic.logo_url
              ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full bg-sky-50 flex items-center justify-center text-base">🦷</div>
            }
          </div>
        </div>
        {clinic.avg_rating>0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 shadow-sm text-xs font-bold text-slate-700">
            <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d={STAR_PATH}/></svg>
            {clinic.avg_rating.toFixed(1)}
          </div>
        )}
        {matched && (
          <div className="absolute top-2 left-2 badge badge-teal text-xs">{matched.name} — ₱{parseFloat(matched.price).toLocaleString()}</div>
        )}
      </div>
      <div className="p-4 pt-7">
        <h3 className="font-display font-bold text-slate-900 text-sm">{clinic.name}</h3>
        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3"/>{clinic.city||'Location not set'}</p>
        {clinic.review_count>0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex">{[1,2,3,4,5].map(s=>(
              <svg key={s} className={`w-3 h-3 ${s<=Math.round(clinic.avg_rating)?'text-amber-400':'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d={STAR_PATH}/></svg>
            ))}</div>
            <span className="text-xs text-slate-400">({clinic.review_count})</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {clinic.services?.slice(0,3).map(s=>(
            <span key={s.id} className={`badge text-xs ${highlightService&&s.name.toLowerCase().includes(highlightService.toLowerCase())?'badge-teal':'badge-gray'}`}
              style={{fontSize:'0.62rem'}}>{s.name}</span>
          ))}
          {clinic.services?.length>3&&<span className="badge badge-gray" style={{fontSize:'0.62rem'}}>+{clinic.services.length-3}</span>}
        </div>
        {clinic.services?.length>0 && (
          <p className="text-xs text-slate-400 mt-1.5">From <span className="font-bold text-sky-600">₱{Math.min(...clinic.services.map(s=>s.price||0)).toLocaleString()}</span></p>
        )}
        <div className="flex gap-2 mt-3" onClick={e=>e.stopPropagation()}>
          <Link to={`/clinic/${clinic.id}`} className="btn btn-secondary btn-sm flex-1 text-xs text-center">Details</Link>
          <button onClick={()=>navigate(`/book/${clinic.id}`)} className="btn btn-primary btn-sm flex-1 text-xs">Book Now</button>
        </div>
      </div>
    </div>
  )
}

export default function BrowseServices() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [clinics, setClinics]         = useState([])
  const [filtered, setFiltered]       = useState([])
  const [allServices, setAllServices] = useState([])
  const [cities, setCities]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState(searchParams.get('search')||'')
  const [service, setService]         = useState(searchParams.get('service')||'')
  const [city, setCity]               = useState(searchParams.get('city')||'all')
  const [minPrice, setMinPrice]       = useState('')
  const [maxPrice, setMaxPrice]       = useState('')
  const [sortBy, setSortBy]           = useState('rating')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(()=>{
    supabase.from('clinics')
      .select('id, name, city, logo_url, banner_url, created_at, services(id,name,price), reviews(rating)')
      .eq('is_active',true).eq('verification_status','approved')
      .order('created_at', { ascending: false })
      .limit(120)
      .then(({data})=>{
        const enriched = (data||[]).map(c=>({...c,
          avg_rating: c.reviews?.length?c.reviews.reduce((s,r)=>s+r.rating,0)/c.reviews.length:0,
          review_count: c.reviews?.length||0,
          min_price: c.services?.length?Math.min(...c.services.map(s=>parseFloat(s.price)||0)):0,
        }))
        setClinics(enriched)
        setCities([...new Set(enriched.map(c=>c.city).filter(Boolean))])
        setAllServices([...new Set(enriched.flatMap(c=>c.services?.map(s=>s.name)||[]))].sort())
        setLoading(false)
      })
  },[])

  useEffect(()=>{
    let r=[...clinics]
    if (search) r=r.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase())||c.city?.toLowerCase().includes(search.toLowerCase()))
    if (service) r=r.filter(c=>c.services?.some(s=>s.name.toLowerCase().includes(service.toLowerCase())))
    if (city!=='all') r=r.filter(c=>c.city===city)
    if (minPrice) r=r.filter(c=>c.min_price>=parseFloat(minPrice))
    if (maxPrice) r=r.filter(c=>c.services?.some(s=>parseFloat(s.price||0)<=parseFloat(maxPrice)))
    if (sortBy==='rating') r.sort((a,b)=>b.avg_rating-a.avg_rating)
    if (sortBy==='price_asc') r.sort((a,b)=>a.min_price-b.min_price)
    if (sortBy==='price_desc') r.sort((a,b)=>b.min_price-a.min_price)
    if (sortBy==='reviews') r.sort((a,b)=>b.review_count-a.review_count)
    setFiltered(r)
  },[search,service,city,minPrice,maxPrice,sortBy,clinics])

  function clearAll(){ setSearch('');setService('');setCity('all');setMinPrice('');setMaxPrice('');setSortBy('rating') }
  const hasFilters = search||service||city!=='all'||minPrice||maxPrice

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar/>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link to="/" className="hover:text-sky-500">Home</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Browse Clinics</span>
            {service && <><span>/</span><span className="text-sky-600 font-semibold">{service}</span></>}
          </div>
          <h1 className="font-display font-bold text-slate-900 text-2xl sm:text-3xl">
            {service?`Clinics offering ${service}`:'Browse Dental Clinics'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} clinic{filtered.length!==1?'s':''} found{city!=='all'?` in ${city}`:''}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-60 shrink-0">
            <button onClick={()=>setShowFilters(!showFilters)}
              className="lg:hidden w-full card p-3 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-sky-500"/>Filters
                {hasFilters&&<span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold">!</span>}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showFilters?'rotate-180':''}`}/>
            </button>

            <div className={`space-y-3 ${showFilters?'block':'hidden lg:block'}`}>
              {/* Search */}
              <div className="card p-4">
                <p className="section-label mb-2">Search</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Clinic or city..." className="input pl-9 text-sm"/>
                </div>
              </div>
              {/* Service */}
              <div className="card p-4">
                <p className="section-label mb-2">Service</p>
                <select value={service} onChange={e=>setService(e.target.value)} className="input text-sm">
                  <option value="">All Services</option>
                  {allServices.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* City */}
              <div className="card p-4">
                <p className="section-label mb-2">Location</p>
                <select value={city} onChange={e=>setCity(e.target.value)} className="input text-sm">
                  <option value="all">All Cities</option>
                  {cities.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Price */}
              <div className="card p-4">
                <p className="section-label mb-2">Price Range (₱)</p>
                <div className="flex items-center gap-2">
                  <input type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="Min" className="input text-sm" min="0"/>
                  <span className="text-slate-400 text-sm shrink-0">–</span>
                  <input type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="Max" className="input text-sm" min="0"/>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[['<₱500','','500'],['₱500–1k','500','1000'],['₱1k+','1000','']].map(([l,mn,mx])=>(
                    <button key={l} onClick={()=>{setMinPrice(mn);setMaxPrice(mx)}}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all
                        ${minPrice===mn&&maxPrice===mx?'bg-sky-500 text-white border-sky-500':'border-slate-200 text-slate-500 hover:border-sky-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Sort */}
              <div className="card p-4">
                <p className="section-label mb-2">Sort By</p>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="input text-sm">
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
              {hasFilters && (
                <button onClick={clearAll}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all">
                  <X className="w-4 h-4"/>Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {service&&<span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  Service: {service}<button onClick={()=>setService('')}><X className="w-3 h-3"/></button></span>}
                {city!=='all'&&<span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  {city}<button onClick={()=>setCity('all')}><X className="w-3 h-3"/></button></span>}
                {(minPrice||maxPrice)&&<span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  ₱{minPrice||'0'}–₱{maxPrice||'∞'}<button onClick={()=>{setMinPrice('');setMaxPrice('')}}><X className="w-3 h-3"/></button></span>}
                {search&&<span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  "{search}"<button onClick={()=>setSearch('')}><X className="w-3 h-3"/></button></span>}
              </div>
            )}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_,i)=><SkeletonCard key={i}/>)}
              </div>
            ) : filtered.length===0 ? (
              <EmptyState icon={<Search className="w-7 h-7 text-slate-300"/>} title="No clinics found"
                description="Try adjusting your filters"
                action={<button onClick={clearAll} className="btn btn-secondary btn-md">Clear Filters</button>}/>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(c=><ClinicCard key={c.id} clinic={c} highlightService={service}/>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
