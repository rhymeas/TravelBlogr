'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeRating } from '@/hooks/useRealtimeRating'
import toast from 'react-hot-toast'

interface LocationRatingProps {
  locationId: string
  locationSlug: string
  initialRating: number
  initialRatingCount: number
  initialUserRating?: number
}

export function LocationRating({
  locationId,
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

  // Subscribe to real-time rating updates
  useRealtimeRating({
    locationId,
    locationSlug,
    onRatingUpdate: ({ averageRating, ratingCount: newCount }) => {
      setRating(averageRating)
      setRatingCount(newCount)
    },
    enabled: true
  })

  // Fetch current user's rating on mount/when auth changes
  useEffect(() => {
    let cancelled = false
    const fetchUserRating = async () => {
      if (!isAuthenticated) return
      try {
        const res = await fetch(`/api/locations/${locationSlug}/rating`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && typeof data.userRating === 'number') {
          setUserRating(data.userRating)
        }
      } catch (e) {
        // non-blocking
        console.log('rating fetch skipped', e)
      }
    }
    fetchUserRating()
    return () => { cancelled = true }
  }, [isAuthenticated, locationSlug])

  const handleRating = async (value: number) => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error('Please sign in to rate this location', {
        duration: 3000,
        icon: '🔒'
      })
      // Don't redirect immediately, let user decide
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add mock auth headers for development
      if (user?.id && user?.email) {
        headers['x-mock-user-id'] = user.id
        headers['x-mock-user-email'] = user.email
      }

      const response = await fetch(`/api/locations/${locationSlug}/rating`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating: value }),
        credentials: 'include' // Ensure cookies are sent
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to rate this location', {
            duration: 3000,
            icon: '🔒'
          })
          return
        }
        throw new Error(data.error || 'Failed to submit rating')
      }

      setRating(data.averageRating)
      setRatingCount(data.ratingCount)
      setUserRating(value)
      toast.success('Rating submitted!', {
        icon: '⭐'
      })
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
      <div className="flex items-center gap-1 relative group">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={isSubmitting}
            className={`transition-transform hover:scale-110 disabled:opacity-50 ${
              isAuthenticated
                ? 'cursor-pointer'
                : 'cursor-not-allowed opacity-60'
            }`}
            aria-label={`Rate ${star} stars`}
            title={!isAuthenticated ? 'Sign in to rate' : `Rate ${star} stars`}
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

        {/* Login hint tooltip */}
        {!isAuthenticated && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Sign in to rate
            </div>
          </div>
        )}
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

