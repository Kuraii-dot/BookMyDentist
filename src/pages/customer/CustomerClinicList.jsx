import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import CoverageBadge from '../../components/CoverageBadge'

export default function CustomerClinicList() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('clinics').select('*, services(*)').eq('is_active', true).then(({ data }) => {
      setClinics(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-stone-800">Find a Clinic</h1>
        <p className="text-stone-500 mt-1">Browse and book from our partner dental clinics</p>
      </div>

      <input
        type="text"
        placeholder="Search clinics or city..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 mb-6"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-amber-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl">🔍</span>
          <p className="text-stone-400 mt-3">No clinics found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(clinic => (
            <div key={clinic.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="h-32 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                {clinic.logo_url
                  ? <img src={clinic.logo_url} alt={clinic.name} className="w-full h-full object-cover" />
                  : <span className="text-4xl">🦷</span>
                }
              </div>
              <div className="p-4">
                <h3 className="font-bold text-stone-800 mb-1">{clinic.name}</h3>
                <p className="text-stone-500 text-xs mb-1">📍 {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</p>
                {clinic.phone && <p className="text-stone-500 text-xs mb-2">📞 {clinic.phone}</p>}
                {clinic.description && <p className="text-stone-500 text-xs line-clamp-2 mb-3">{clinic.description}</p>}

                {/* Services preview */}
                {clinic.services?.filter(s => s.is_active).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {clinic.services.filter(s => s.is_active).slice(0, 3).map(s => (
                      <span key={s.id} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-100 inline-flex items-center gap-1">
                        {s.name} {s.price ? `· ₱${parseFloat(s.price).toLocaleString()}` : ''}
                        <CoverageBadge value={s.covered} className="text-xs" />
                      </span>
                    ))}
                    {clinic.services.filter(s => s.is_active).length > 3 && (
                      <span className="text-xs text-stone-400">+{clinic.services.filter(s => s.is_active).length - 3} more</span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => navigate(`/dashboard/book/${clinic.id}`)}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2 rounded-xl text-sm transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
