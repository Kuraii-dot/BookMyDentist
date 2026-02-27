import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

function StarRating({ rating, interactive = false, onRate, size = 'md' }) {
  const [hover, setHover] = useState(0)
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`${sz} transition-colors ${interactive ? 'cursor-pointer' : ''} ${s <= (hover || rating) ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor" viewBox="0 0 20 20"
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate?.(s)}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  )
}

export default function ClinicDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [clinic, setClinic] = useState(null)
  const [services, setServices] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('services')

  useEffect(() => {
    async function load() {
      const [c, s, r] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', id).single(),
        supabase.from('services').select('*').eq('clinic_id', id).eq('is_active', true).order('price'),
        supabase.from('reviews').select('*, profiles!reviews_customer_id_fkey(full_name)').eq('clinic_id', id).order('created_at', { ascending: false })
      ])
      setClinic(c.data); setServices(s.data || []); setReviews(r.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#f0f9ff'}}>
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{borderColor:'var(--color-brand)',borderTopColor:'transparent'}} />
    </div>
  )
  if (!clinic) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#f0f9ff'}}>
      <p className="text-slate-400">Clinic not found</p>
    </div>
  )

  const avgRating = reviews.length ? reviews.reduce((s,r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="min-h-screen" style={{backgroundColor:'#f0f9ff'}}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sky-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm rounded-xl flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs">🦷</span>
            </div>
            <span className="font-display font-bold text-slate-900">BookMyDentist</span>
          </Link>
          <button onClick={() => user ? navigate(`/book/${clinic.id}`) : navigate('/login')}
            className="btn btn-primary btn-sm rounded-xl">
            Book Now
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero card */}
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden mb-6">
          {/* Banner */}
          <div className="relative h-52 sm:h-72 bg-gradient-to-br from-sky-100 via-blue-50 to-amber-50">
            {clinic.banner_url
              ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center"><span className="text-8xl opacity-10">🦷</span></div>
            }
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent"/>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden -mt-14 shrink-0 bg-white">
                {clinic.logo_url
                  ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full bg-sky-50 flex items-center justify-center text-3xl">🦷</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display font-bold text-slate-900 text-2xl sm:text-3xl">{clinic.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {clinic.city && (
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                          {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}
                        </span>
                      )}
                      {reviews.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={avgRating} size="sm"/>
                          <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                          <span className="text-slate-400 text-sm">({reviews.length})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => user ? navigate(`/book/${clinic.id}`) : navigate('/login')}
                    className="btn btn-primary btn-lg rounded-2xl hidden sm:flex shadow-md shadow-sky-200">
                    Book Appointment
                  </button>
                </div>
                {clinic.description && <p className="text-slate-500 text-sm mt-3 leading-relaxed">{clinic.description}</p>}
              </div>
            </div>

            {/* Contact strip */}
            {(clinic.phone || clinic.email) && (
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-sky-50">
                {clinic.phone && (
                  <span className="text-slate-500 text-sm flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-sky-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </div>
                    {clinic.phone}
                  </span>
                )}
                {clinic.email && (
                  <span className="text-slate-500 text-sm flex items-center gap-1.5">
                    <div className="w-6 h-6 bg-sky-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    {clinic.email}
                  </span>
                )}
              </div>
            )}

            {/* Mobile book */}
            <button onClick={() => user ? navigate(`/book/${clinic.id}`) : navigate('/login')}
              className="btn btn-primary btn-md w-full rounded-2xl mt-4 sm:hidden shadow-md shadow-sky-200">
              Book Appointment
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-sky-100 p-1 mb-6 shadow-sm">
          {[
            { key:'services', label:`Services (${services.length})`, icon:'🔧' },
            { key:'reviews',  label:`Reviews (${reviews.length})`,   icon:'⭐' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              style={activeTab === t.key ? {backgroundColor:'var(--color-brand)'} : {}}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Services */}
        {activeTab === 'services' && (
          services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sky-100 p-12 text-center shadow-sm">
              <span className="text-4xl">🔧</span>
              <p className="text-slate-400 mt-3">No services listed yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-sky-100 p-5 hover:shadow-md hover:border-sky-300 transition-all group shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{s.name}</h3>
                      {s.description && <p className="text-slate-500 text-sm mt-1 leading-relaxed">{s.description}</p>}
                      {s.duration_minutes && (
                        <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          {s.duration_minutes} min
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-sky-600 text-xl">₱{parseFloat(s.price || 0).toLocaleString()}</p>
                      <button onClick={() => user ? navigate(`/book/${clinic.id}?service=${s.id}`) : navigate('/login')}
                        className="btn btn-primary btn-sm mt-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sky-100 p-12 text-center shadow-sm">
              <span className="text-4xl">⭐</span>
              <p className="text-slate-400 mt-3">No reviews yet — be the first!</p>
              <button onClick={() => user ? navigate(`/book/${clinic.id}`) : navigate('/login')}
                className="btn btn-primary btn-md mt-4 rounded-xl">Book & Review</button>
            </div>
          ) : (
            <>
              {/* Rating summary */}
              <div className="bg-white rounded-2xl border border-sky-100 p-6 mb-4 shadow-sm">
                <div className="flex items-center gap-8">
                  <div className="text-center shrink-0">
                    <p className="font-display font-bold text-5xl text-slate-900">{avgRating.toFixed(1)}</p>
                    <StarRating rating={avgRating} size="md"/>
                    <p className="text-slate-400 text-xs mt-1">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(n => {
                      const count = reviews.filter(r => r.rating === n).length
                      const pct = reviews.length ? (count / reviews.length) * 100 : 0
                      return (
                        <div key={n} className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 w-3">{n}</span>
                          <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{width:`${pct}%`}}/>
                          </div>
                          <span className="text-slate-400 w-4">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center font-bold text-sky-600 text-sm shrink-0 ring-2 ring-sky-200">
                          {r.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{r.profiles?.full_name || 'Anonymous'}</p>
                          <StarRating rating={r.rating} size="sm"/>
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs shrink-0">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
                    </div>
                    {r.comment && <p className="text-slate-600 text-sm mt-3 ml-11 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}