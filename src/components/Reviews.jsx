import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { checkRateLimit } from '../lib/security'

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              (hovered || value) >= star ? 'text-amber-400' : 'text-slate-200'
            }`}
            fill={(hovered || value) >= star ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewsList({ clinicId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [avg, setAvg]         = useState(0)

  useEffect(() => {
    supabase.from('reviews')
      .select('*, profiles!reviews_customer_id_fkey(full_name)')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || [])
        if (data?.length) setAvg((data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1))
        setLoading(false)
      })
  }, [clinicId])

  if (loading) return (
    <div className="py-4 flex justify-center">
      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-400" fill="currentColor" />
          <span className="font-black text-stone-800 text-lg">{avg}</span>
          <span className="text-stone-400 text-sm">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-4">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold text-amber-700">
                    {r.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="font-semibold text-stone-700 text-sm">{r.profiles?.full_name}</span>
                </div>
                <StarRating value={r.rating} readonly />
              </div>
              {r.comment && <p className="text-stone-600 text-sm">{r.comment}</p>}
              <p className="text-stone-400 text-xs mt-2">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SubmitReview({ appointmentId, clinicId, customerId, onSubmitted }) {
  const [rating, setRating]     = useState(0)
  const [comment, setComment]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existing, setExisting] = useState(null)

  useEffect(() => {
    supabase.from('reviews')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle()
      .then(({ data }) => setExisting(data))
  }, [appointmentId])

  if (existing) return (
    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-4 h-4 text-emerald-500" fill="currentColor" />
        <p className="text-green-700 font-semibold text-sm">You reviewed this appointment</p>
      </div>
      <StarRating value={existing.rating} readonly />
      {existing.comment && <p className="text-stone-500 text-sm mt-2">{existing.comment}</p>}
    </div>
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) {
      toast.error('Please select a rating first.')
      return
    }

    const rateCheck = checkRateLimit('review')
    if (!rateCheck.allowed) {
      toast.error(rateCheck.message)
      return
    }

    const safeComment = comment.trim().slice(0, 1000)

    setSubmitting(true)
    const { data, error } = await supabase.from('reviews').insert({
      appointment_id: appointmentId,
      clinic_id:      clinicId,
      customer_id:    customerId,
      rating,
      comment: safeComment,
    }).select('*').single()

    if (error) {
      // Duplicate review (unique constraint) can happen on delayed UI updates.
      if (error.code === '23505' || error.status === 409) {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('*')
          .eq('appointment_id', appointmentId)
          .maybeSingle()

        if (existingReview) setExisting(existingReview)
        toast.success('Review already submitted.')
        onSubmitted?.()
        setSubmitting(false)
        return
      }

      toast.error(error.message || 'Failed to submit review.')
      setSubmitting(false)
      return
    }

    if (data) setExisting(data)
    setComment('')
    setRating(0)
    toast.success('Review submitted successfully!')
    setSubmitting(false)
    onSubmitted?.()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50 rounded-xl p-4 border border-amber-100">
      <p className="font-semibold text-stone-700 text-sm mb-3">Leave a Review</p>
      <StarRating value={rating} onChange={setRating} />
      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience (optional)..."
            rows={2}
            className="w-full mt-3 border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none bg-white"
          />
          <button type="submit" disabled={submitting}
            className="mt-2 bg-amber-400 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </>
      )}
    </form>
  )
}

export { StarRating }
