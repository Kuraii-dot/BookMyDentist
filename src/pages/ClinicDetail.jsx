import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import { MapPin, Phone, Mail, Clock, ChevronLeft, Star, Flag } from 'lucide-react'
import Navbar from '../components/Navbar'
import { EmptyState, SkeletonCard, Modal, Field } from '../components/ui/shared'
import toast from 'react-hot-toast'

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating, interactive = false, onRate, size = 'md' }) {
  const [hover, setHover] = useState(0)
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg
          key={s}
          className={`${sz} transition-colors ${interactive ? 'cursor-pointer' : ''} ${s <= (hover || rating) ? 'text-amber-400' : 'text-slate-200'}`}
          fill="currentColor" viewBox="0 0 20 20"
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onRate?.(s)}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

// ── Report Button ─────────────────────────────────────────────────────────────
function ReportButton({ targetType, targetId }) {
  const { user } = useAuth()
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState('')
  const [sending, setSending] = useState(false)

  if (!user) return null

  async function submit() {
    if (!reason.trim()) { toast.error('Please provide a reason'); return }
    setSending(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id:   targetId,
      reason,
    })
    if (error) { toast.error('Failed to submit report'); setSending(false); return }
    toast.success('Report submitted. Our team will review it.')
    setOpen(false); setReason(''); setSending(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
      >
        <Flag className="w-3 h-3" />
        Report this clinic
      </button>

      <Modal open={open} onClose={() => { setOpen(false); setReason('') }} title="Report Clinic">
        <p className="text-slate-500 text-sm mb-4">
          Help us keep BookMyDentistPH safe. Describe the issue and our team will review it within 1–2 business days.
        </p>
        <Field label="Reason" required>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Misleading information, inappropriate content, fraud..."
            className="input resize-none"
          />
        </Field>
        <div className="flex gap-3 mt-4">
          <button onClick={() => { setOpen(false); setReason('') }} className="btn btn-secondary btn-md flex-1">Cancel</button>
          <button onClick={submit} disabled={sending || !reason.trim()} className="btn btn-danger btn-md flex-1">
            {sending ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </Modal>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ClinicDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [clinic, setClinic]       = useState(null)
  const [services, setServices]   = useState([])
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('services')

  useEffect(() => {
    async function load() {
      const [c, s, r] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', id).single(),
        supabase.from('services').select('*').eq('clinic_id', id).eq('is_active', true).order('price'),
        supabase.from('reviews').select('*, profiles!reviews_customer_id_fkey(full_name)').eq('clinic_id', id).order('created_at', { ascending: false }),
      ])
      setClinic(c.data); setServices(s.data || []); setReviews(r.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    </div>
  )

  if (!clinic) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <EmptyState title="Clinic not found" description="This clinic may have been removed or doesn't exist." />
    </div>
  )

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Back + Book row */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm flex items-center gap-1.5 text-slate-500">
            <ChevronLeft className="w-4 h-4" />Back
          </button>
          <button
            onClick={() => user ? navigate(`/book/${clinic.id}`) : navigate('/login')}
            className="btn btn-primary btn-md"
          >
            Book Appointment
          </button>
        </div>

        {/* Hero card */}
        <div className="card overflow-hidden mb-5">
          {/* Banner */}
          <div className="relative h-48 sm:h-64 bg-slate-100">
            {clinic.banner_url
              ? <img src={clinic.banner_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl opacity-10">🦷</div>
            }
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-xl border-4 border-white shadow-md overflow-hidden -mt-12 shrink-0 bg-white">
                {clinic.logo_url
                  ? <img src={clinic.logo_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-sky-50 flex items-center justify-center text-2xl">🦷</div>
                }
              </div>
              <div className="flex-1 min-w-0 mt-1">
                <h1 className="font-display font-bold text-slate-900 text-xl sm:text-2xl">{clinic.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {clinic.city && (
                    <span className="text-slate-500 text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}
                    </span>
                  )}
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={avgRating} size="sm" />
                      <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                      <span className="text-slate-400 text-sm">({reviews.length})</span>
                    </div>
                  )}
                </div>
                {clinic.description && (
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{clinic.description}</p>
                )}
              </div>
            </div>

            {/* Contact */}
            {(clinic.phone || clinic.email) && (
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
                {clinic.phone && (
                  <span className="text-slate-500 text-sm flex items-center gap-2">
                    <div className="w-6 h-6 bg-sky-50 rounded-lg flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    {clinic.phone}
                  </span>
                )}
                {clinic.email && (
                  <span className="text-slate-500 text-sm flex items-center gap-2">
                    <div className="w-6 h-6 bg-sky-50 rounded-lg flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    {clinic.email}
                  </span>
                )}
              </div>
            )}

            {/* Mobile book */}
            <button
              onClick={() => user ? navigate(`/book/${clinic.id}`) : navigate('/login')}
              className="btn btn-primary btn-md w-full mt-4 sm:hidden"
            >
              Book Appointment
            </button>

            {/* Report link */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <ReportButton targetType="clinic" targetId={clinic.id} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 card p-1 mb-5">
          {[
            { key: 'services', label: `Services (${services.length})` },
            { key: 'reviews',  label: `Reviews (${reviews.length})`  },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              style={activeTab === t.key ? { backgroundColor: 'var(--color-brand)' } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Services */}
        {activeTab === 'services' && (
          services.length === 0
            ? <EmptyState icon="🔧" title="No services listed yet" />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(s => (
                  <div key={s.id} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{s.name}</h3>
                        {s.description && (
                          <p className="text-slate-500 text-sm mt-1 leading-relaxed">{s.description}</p>
                        )}
                        {s.duration_minutes && (
                          <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{s.duration_minutes} min
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-bold text-sky-600 text-lg">₱{parseFloat(s.price || 0).toLocaleString()}</p>
                        <button
                          onClick={() => user ? navigate(`/book/${clinic.id}?service=${s.id}`) : navigate('/login')}
                          className="btn btn-primary btn-sm mt-2 opacity-0 group-hover:opacity-100 transition-all"
                        >
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
          reviews.length === 0
            ? (
              <EmptyState
                icon={<Star className="w-7 h-7 text-slate-300" />}
                title="No reviews yet — be the first!"
                action={
                  <button
                    onClick={() => user ? navigate(`/book/${clinic.id}`) : navigate('/login')}
                    className="btn btn-primary btn-sm"
                  >
                    Book & Review
                  </button>
                }
              />
            )
            : (
              <>
                {/* Rating summary */}
                <div className="card p-5 mb-4">
                  <div className="flex items-center gap-8">
                    <div className="text-center shrink-0">
                      <p className="font-display font-bold text-4xl text-slate-900">{avgRating.toFixed(1)}</p>
                      <StarRating rating={avgRating} />
                      <p className="text-slate-400 text-xs mt-1">{reviews.length} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(n => {
                        const count = reviews.filter(r => r.rating === n).length
                        const pct   = reviews.length ? (count / reviews.length) * 100 : 0
                        return (
                          <div key={n} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 w-3">{n}</span>
                            <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
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
                    <div key={r.id} className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center font-bold text-sky-600 text-xs shrink-0 ring-1 ring-sky-200">
                            {r.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{r.profiles?.full_name || 'Anonymous'}</p>
                            <StarRating rating={r.rating} size="sm" />
                          </div>
                        </div>
                        <p className="text-slate-400 text-xs shrink-0">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
                      </div>
                      {r.comment && (
                        <p className="text-slate-600 text-sm mt-3 ml-11 leading-relaxed">{r.comment}</p>
                      )}
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