import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { ReviewsList } from '../components/Reviews'

function ClinicCard({ clinic }) {
  const [services, setServices] = useState([])
  const [showReviews, setShowReviews] = useState(false)
  const [avgRating, setAvgRating] = useState(null)

  useEffect(() => {
    supabase.from('services').select('*').eq('clinic_id', clinic.id).eq('is_active', true)
      .then(({ data }) => setServices(data || []))

    supabase.from('reviews').select('rating').eq('clinic_id', clinic.id)
      .then(({ data }) => {
        if (data?.length) setAvgRating((data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1))
      })
  }, [clinic.id])

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
        {clinic.banner_url
          ? <img src={clinic.banner_url} alt={clinic.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-5xl">🦷</span></div>
        }
        {/* Logo overlay */}
        {clinic.logo_url && (
          <div className="absolute bottom-3 left-4 w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md bg-white">
            <img src={clinic.logo_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {avgRating && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <span className="text-amber-400 text-sm">★</span>
            <span className="font-bold text-stone-700 text-sm">{avgRating}</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-stone-800 text-lg mb-1">{clinic.name}</h3>
        <p className="text-stone-500 text-sm flex items-center gap-1 mb-1">
          <span>📍</span> {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}
        </p>
        {clinic.phone && <p className="text-stone-500 text-sm flex items-center gap-1 mb-2"><span>📞</span> {clinic.phone}</p>}
        {clinic.description && <p className="text-stone-500 text-sm mb-3 line-clamp-2">{clinic.description}</p>}

        {services.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {services.slice(0, 4).map(s => (
                <span key={s.id} className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-100">
                  {s.name} {s.price ? `· ₱${parseFloat(s.price).toLocaleString()}` : ''}
                </span>
              ))}
              {services.length > 4 && <span className="bg-stone-100 text-stone-500 text-xs px-2.5 py-1 rounded-full">+{services.length - 4} more</span>}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link to="/register" className="flex-1 block text-center bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            Book Appointment
          </Link>
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="px-3 py-2.5 border border-amber-200 hover:bg-amber-50 rounded-xl text-sm text-amber-700 font-medium transition-colors"
          >
            {showReviews ? '▲' : '★'} Reviews
          </button>
        </div>

        {showReviews && (
          <div className="mt-4 pt-4 border-t border-amber-100">
            <ReviewsList clinicId={clinic.id} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Landing() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('clinics').select('*').eq('is_active', true).then(({ data }) => {
      setClinics(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-amber-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-amber-300 to-orange-300 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/30 backdrop-blur-sm px-4 py-1.5 rounded-full text-white text-sm font-medium mb-6">
            <span>✨</span> Your smile deserves the best care
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Book Your Dental<br />
            <span className="text-amber-900">Appointment</span> Easily
          </h1>
          <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
            Find trusted dental clinics near you, browse services and rates, and book your appointment in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="bg-white text-amber-600 font-bold px-8 py-3.5 rounded-full hover:bg-amber-50 transition-colors shadow-lg">
              Get Started — It's Free
            </Link>
            <Link to="/login" className="bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/30 transition-colors border border-white/30">
              Sign In
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      </section>

      {/* Clinics */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-stone-800">Our Partner Clinics</h2>
            <p className="text-stone-500 mt-1">{clinics.length} clinic{clinics.length !== 1 ? 's' : ''} available</p>
          </div>
          <input
            type="text"
            placeholder="Search clinics or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-3xl h-72 animate-pulse border border-amber-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl">🦷</span>
            <p className="text-stone-400 mt-4">No clinics found. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(clinic => <ClinicCard key={clinic.id} clinic={clinic} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-amber-400 to-orange-400 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-3">Ready to book your visit?</h2>
          <p className="text-white/80 mb-6">Create your free account and book in under 2 minutes.</p>
          <Link to="/register" className="bg-white text-amber-600 font-bold px-8 py-3.5 rounded-full hover:bg-amber-50 transition-colors inline-block shadow-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="bg-stone-800 text-stone-400 text-center py-6 text-sm">
        © {new Date().getFullYear()} DentBook · All rights reserved
      </footer>
    </div>
  )
}