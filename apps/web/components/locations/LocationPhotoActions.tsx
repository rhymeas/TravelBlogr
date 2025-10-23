'use client'

/**
 * Location Photo Actions Component
 * 
 * Reusable save/share buttons for location photo pages.
 * Uses global TripSaveButton pattern adapted for locations.
 */

import { useState } from 'react'
import { Share2, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SocialShare } from '@/components/blog/SocialShare'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface LocationPhotoActionsProps {
  locationId: string
  locationName: string
  locationSlug: string
}

export function LocationPhotoActions({
  locationId,
  locationName,
  locationSlug
}: LocationPhotoActionsProps) {
  const { isAuthenticated } = useAuth()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pageUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/locations/${locationSlug}/photos`
    : `https://travelblogr.com/locations/${locationSlug}/photos`

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save locations', { icon: '🔒' })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // TODO: Implement location save API
      // For now, just toggle optimistically
      setSaved(!saved)
      toast.success(saved ? 'Location unsaved' : 'Location saved!', {
        icon: saved ? '📌' : '🔖'
      })
    } catch (error) {
      toast.error('Failed to save location')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async () => {
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${locationName} Photos`,
          text: `Check out photos of ${locationName}`,
          url: pageUrl
        })
        return
      } catch (error) {
        // User cancelled or share failed, fall through to menu
      }
    }

    // Show share menu
    setShowShareMenu(!showShareMenu)
  }

  return (
    <div className="flex items-center gap-2 relative">
      {/* Share Button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* Share Menu */}
        {showShareMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowShareMenu(false)}
            />

            {/* Share Menu */}
            <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]">
              <div className="text-sm font-semibold text-gray-900 mb-3">
                Share {locationName} Photos
              </div>
              <SocialShare
                url={pageUrl}
                title={`${locationName} Photos`}
                description={`Explore beautiful photos of ${locationName}`}
                variant="buttons"
              />
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSave}
        disabled={isSubmitting}
        className={`flex items-center gap-2 ${saved ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
        title={!isAuthenticated ? 'Sign in to save' : saved ? 'Unsave' : 'Save for later'}
      >
        <Bookmark 
          className={`h-4 w-4 ${saved ? 'fill-current' : ''}`}
        />
        <span className="hidden sm:inline">Save</span>
      </Button>
    </div>
  )
}

