'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface LocationRatingProps {
  locationSlug: string
  initialRating: number
  initialRatingCount: number
  initialUserRating?: number
}

export function LocationRating({
  locationSlug,
  initialRating,
  initialRatingCount,
  initialUserRating
}: LocationRatingProps) {
  const { user, isAuthenticated } = useAuth()
  const [rating, setRating] = useState(initialRating)
  const [ratingCount, setRatingCount] = useState(initialRatingCount)
  const [userRating, setUserRating] = useState(initialUserRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRating = async (value: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to rate this location')
      window.location.href = `/auth/signin?redirect=/locations/${locationSlug}`
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/locations/${locationSlug}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating: value })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating')
      }

      setRating(data.averageRating)
      setRatingCount(data.ratingCount)
      setUserRating(value)
      toast.success('Rating submitted!')
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Star Rating Display */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={isSubmitting}
            className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (hoverRating || userRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Rating Info */}
      <div className="text-sm text-gray-600">
        <span className="font-semibold">{rating.toFixed(1)}</span>
        <span className="mx-1">·</span>
        <span>{ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}</span>
      </div>

      {/* User's Rating */}
      {userRating > 0 && (
        <div className="text-xs text-gray-500">
          (You rated: {userRating} ⭐)
        </div>
      )}
    </div>
  )
}

