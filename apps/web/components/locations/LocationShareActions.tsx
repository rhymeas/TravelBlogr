'use client'

/**
 * Location Share Actions Component
 * 
 * Unified share/save buttons for location pages.
 * Supports: Share to social, Share to trips, Share to blogs, Save location
 */

import { useState, useEffect } from 'react'
import { Share2, Bookmark, Plus, FileText, Map } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SocialShare } from '@/components/blog/SocialShare'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface LocationShareActionsProps {
  locationId: string
  locationName: string
  locationSlug: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showLabels?: boolean
  className?: string
}

export function LocationShareActions({
  locationId,
  locationName,
  locationSlug,
  variant = 'outline',
  size = 'sm',
  showLabels = true,
  className = ''
}: LocationShareActionsProps) {
  const { isAuthenticated } = useAuth()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/locations/${locationSlug}`
    : `https://travelblogr.com/locations/${locationSlug}`

  // Load wishlist state on mount
  useEffect(() => {
    if (isAuthenticated && locationSlug) {
      loadWishlistState()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, locationSlug])

  // Listen for wishlist changes from other components
  useEffect(() => {
    const handleWishlistChange = (event: CustomEvent) => {
      if (event.detail.locationId === locationId) {
        setIsWishlisted(event.detail.isWishlisted)
      }
    }

    window.addEventListener('wishlistChanged' as any, handleWishlistChange)
    return () => window.removeEventListener('wishlistChanged' as any, handleWishlistChange)
  }, [locationId])

  const loadWishlistState = async () => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/customize`)
      const data = await response.json()

      if (response.ok && data.customization) {
        setIsWishlisted(data.customization.is_wishlisted || false)
      }
    } catch (error) {
      console.error('Error loading wishlist state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save locations', { icon: '🔒' })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    const newValue = !isWishlisted
    setIsWishlisted(newValue) // Optimistic update

    try {
      const response = await fetch(`/api/locations/${locationSlug}/customize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWishlisted: newValue })
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      toast.success(newValue ? 'Added to wishlist' : 'Removed from wishlist', {
        icon: newValue ? '❤️' : '💔'
      })

      // Notify other components
      window.dispatchEvent(new CustomEvent('wishlistChanged', {
        detail: { locationId, isWishlisted: newValue }
      }))
    } catch (error) {
      // Revert on failure
      setIsWishlisted(!newValue)
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
          title: locationName,
          text: `Check out ${locationName} on TravelBlogr`,
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

  const handleAddToTrip = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add to trips', { icon: '🔒' })
      return
    }

    // TODO: Implement add to trip functionality
    toast.success('Opening trip selector...', { icon: '🗺️' })
  }

  const handleAddToBlog = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add to blog', { icon: '🔒' })
      return
    }

    // TODO: Implement add to blog functionality
    toast.success('Opening blog editor...', { icon: '📝' })
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Share Button with Dropdown */}
      <div className="relative">
        <Button
          variant={variant}
          size={size}
          onClick={handleShare}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          {showLabels && <span className="hidden sm:inline">Share</span>}
        </Button>

        {/* Share Menu */}
        {showShareMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowShareMenu(false)}
            />

            {/* Share Menu Dropdown */}
            <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px] overflow-hidden">
              {/* Social Share Section */}
              <div className="p-4 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-900 mb-3">
                  Share {locationName}
                </div>
                <SocialShare
                  url={pageUrl}
                  title={locationName}
                  description={`Explore ${locationName} on TravelBlogr`}
                  variant="buttons"
                />
              </div>

              {/* Add to Trip/Blog Section */}
              <div className="p-2">
                <button
                  onClick={() => {
                    handleAddToTrip()
                    setShowShareMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                >
                  <Map className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Add to Trip</div>
                    <div className="text-xs text-gray-500">Include in your travel plans</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleAddToBlog()
                    setShowShareMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                >
                  <FileText className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Add to Blog Post</div>
                    <div className="text-xs text-gray-500">Write about this location</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save/Wishlist Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleSave}
        disabled={isSubmitting || isLoading}
        className={`flex items-center gap-2 ${isWishlisted ? 'text-red-600 border-red-200 bg-red-50' : ''}`}
        title={!isAuthenticated ? 'Sign in to save' : isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Bookmark
          className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`}
        />
        {showLabels && <span className="hidden sm:inline">{isWishlisted ? 'Saved' : 'Save'}</span>}
      </Button>
    </div>
  )
}

