'use client'

/**
 * Activity Like Button Component
 * 
 * Reusable like button for activity feed posts with real-time updates.
 * Works with FeedPost and other activity components.
 */

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeLikes } from '@/hooks/useRealtimeLikes'
import toast from 'react-hot-toast'

interface ActivityLikeButtonProps {
  activityId: string
  initialLikeCount?: number
  initialUserLiked?: boolean
  showCount?: boolean
  showAnimation?: boolean
  onDoubleTap?: () => void
  className?: string
}

export function ActivityLikeButton({
  activityId,
  initialLikeCount = 0,
  initialUserLiked = false,
  showCount = true,
  showAnimation = false,
  onDoubleTap,
  className = ''
}: ActivityLikeButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [userLiked, setUserLiked] = useState(initialUserLiked)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)

  // Subscribe to real-time like updates
  useRealtimeLikes({
    entityType: 'activity',
    entityId: activityId,
    onLikeUpdate: ({ likeCount: newCount, action, userId }) => {
      setLikeCount(newCount)
      
      // Update userLiked if current user performed the action
      if (user && userId === user.id) {
        setUserLiked(action === 'like')
      }
    },
    enabled: true
  })

  // Fetch initial like status on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchLikeStatus()
    }
  }, [activityId, isAuthenticated])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}/like`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setLikeCount(data.likeCount)
        setUserLiked(data.userLiked)
      }
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like posts', {
        icon: '🔒',
        duration: 3000
      })
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)

    // Optimistic update
    const previousLiked = userLiked
    const previousCount = likeCount

    setUserLiked(!userLiked)
    setLikeCount(prev => userLiked ? prev - 1 : prev + 1)

    // Show animation if enabled
    if (showAnimation && !userLiked) {
      setShowLikeAnimation(true)
      setTimeout(() => setShowLikeAnimation(false), 1000)
    }

    try {
      const response = await fetch(`/api/activities/${activityId}/like`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update like')
      }

      // Update with server response
      setUserLiked(data.liked)
      setLikeCount(data.likeCount)
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
      
      // Revert optimistic update
      setUserLiked(previousLiked)
      setLikeCount(previousCount)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDoubleTap = () => {
    if (!userLiked && onDoubleTap) {
      onDoubleTap()
      handleLike()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleLike}
        onDoubleClick={handleDoubleTap}
        disabled={isSubmitting}
        className={`hover:scale-110 transition-transform ${className}`}
        title={!isAuthenticated ? 'Sign in to like' : userLiked ? 'Unlike' : 'Like'}
      >
        <Heart 
          className={`w-6 h-6 ${userLiked ? 'text-red-500 fill-current' : 'text-gray-700'}`}
        />
      </button>

      {/* Like Count */}
      {showCount && (
        <div className="mt-2">
          <span className="font-semibold text-sm">{likeCount.toLocaleString()} likes</span>
        </div>
      )}

      {/* Like Animation Overlay */}
      {showAnimation && showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Heart className="w-20 h-20 text-red-500 animate-ping" fill="currentColor" />
        </div>
      )}
    </div>
  )
}

