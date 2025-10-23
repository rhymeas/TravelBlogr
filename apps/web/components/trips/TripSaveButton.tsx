'use client'

/**
 * Trip Save Button Component
 * 
 * Reusable save/bookmark button with real-time updates.
 * Works across all trip views (discovery, shared, dashboard).
 */

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeSaves } from '@/hooks/useRealtimeSaves'
import toast from 'react-hot-toast'
import useSWR from 'swr'

interface TripSaveButtonProps {
  tripId: string
  initialSaveCount?: number
  initialUserSaved?: boolean
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showCount?: boolean
  className?: string
}

export function TripSaveButton({
  tripId,
  initialSaveCount = 0,
  initialUserSaved = false,
  variant = 'ghost',
  size = 'sm',
  showCount = false,
  className = ''
}: TripSaveButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch save status with SWR (cached, auto-revalidates)
  const { data, mutate } = useSWR(
    isAuthenticated ? `/api/trips/${tripId}/save` : null,
    async (url) => {
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    {
      fallbackData: { saveCount: initialSaveCount, userSaved: initialUserSaved },
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  const saveCount = data?.saveCount ?? initialSaveCount
  const userSaved = data?.userSaved ?? initialUserSaved

  // Subscribe to real-time save updates
  useRealtimeSaves({
    tripId,
    onSaveUpdate: ({ saveCount: newCount, action, userId }) => {
      mutate({ saveCount: newCount, userSaved: user?.id === userId ? action === 'save' : userSaved }, false)
    },
    enabled: true
  })

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save trips', { icon: '🔒' })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    const optimisticData = {
      saveCount: userSaved ? saveCount - 1 : saveCount + 1,
      userSaved: !userSaved
    }

    try {
      await mutate(
        async () => {
          const res = await fetch(`/api/trips/${tripId}/save`, {
            method: 'POST',
            credentials: 'include'
          })
          if (!res.ok) throw new Error('Failed to update save')
          const data = await res.json()
          toast.success(data.saved ? 'Trip saved!' : 'Trip unsaved', {
            icon: data.saved ? '🔖' : '📌'
          })
          return data
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false
        }
      )
    } catch (error) {
      toast.error('Failed to update save')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSave}
      disabled={isSubmitting}
      className={`${className} ${userSaved ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
      title={!isAuthenticated ? 'Sign in to save' : userSaved ? 'Unsave' : 'Save for later'}
    >
      <Bookmark 
        className={`h-4 w-4 ${showCount ? 'mr-1' : ''} ${userSaved ? 'fill-current' : ''}`}
      />
      {showCount && <span>{saveCount}</span>}
    </Button>
  )
}

