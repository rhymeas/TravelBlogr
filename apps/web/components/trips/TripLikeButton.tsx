'use client'

/**
 * Trip Like Button Component
 * 
 * Reusable like button with real-time updates.
 * Works across all trip views (discovery, shared, dashboard).
 */

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeLikes } from '@/hooks/useRealtimeLikes'
import toast from 'react-hot-toast'
import useSWR from 'swr'

interface TripLikeButtonProps {
  tripId: string
  initialLikeCount?: number
  initialUserLiked?: boolean
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showCount?: boolean
  className?: string
}

export function TripLikeButton({
  tripId,
  initialLikeCount = 0,
  initialUserLiked = false,
  variant = 'ghost',
  size = 'sm',
  showCount = true,
  className = ''
}: TripLikeButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch like status with SWR (cached, auto-revalidates)
  const { data, mutate } = useSWR(
    isAuthenticated ? `/api/trips/${tripId}/like` : null,
    async (url) => {
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    {
      fallbackData: { likeCount: initialLikeCount, userLiked: initialUserLiked },
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  )

  const likeCount = data?.likeCount ?? initialLikeCount
  const userLiked = data?.userLiked ?? initialUserLiked

  // Subscribe to real-time like updates
  useRealtimeLikes({
    entityType: 'trip',
    entityId: tripId,
    onLikeUpdate: ({ likeCount: newCount, action, userId }) => {
      // Update SWR cache
      mutate({ likeCount: newCount, userLiked: user?.id === userId ? action === 'like' : userLiked }, false)
    },
    enabled: true
  })

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like trips', { icon: '🔒' })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    // Optimistic update via SWR
    const optimisticData = {
      likeCount: userLiked ? likeCount - 1 : likeCount + 1,
      userLiked: !userLiked
    }

    try {
      await mutate(
        async () => {
          const res = await fetch(`/api/trips/${tripId}/like`, {
            method: 'POST',
            credentials: 'include'
          })
          if (!res.ok) throw new Error('Failed to update like')
          return res.json()
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false
        }
      )
    } catch (error) {
      toast.error('Failed to update like')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLike}
      disabled={isSubmitting}
      className={`${className} ${userLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
      title={!isAuthenticated ? 'Sign in to like' : userLiked ? 'Unlike' : 'Like'}
    >
      <Heart 
        className={`h-4 w-4 ${showCount ? 'mr-1' : ''} ${userLiked ? 'fill-current' : ''}`}
      />
      {showCount && <span>{likeCount}</span>}
    </Button>
  )
}

