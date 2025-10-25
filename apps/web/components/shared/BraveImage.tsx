'use client'

import { useState, useEffect } from 'react'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { cn } from '@/lib/utils'

interface BraveImageProps {
  activityName: string
  locationName: string
  type?: 'activity' | 'restaurant'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  fallbackImage?: string
  showLinks?: boolean
  onLinksLoaded?: (links: any[]) => void
  tripType?: string
  context?: string
}

/**
 * BraveImage Component
 * 
 * Displays 16:9 optimized images from Brave Search API
 * Supports responsive sizing: sm, md, lg, xl, full
 * 
 * Sizes:
 * - sm: 96px height (6rem) - for small cards, lists
 * - md: 192px height (12rem) - for medium cards
 * - lg: 256px height (16rem) - for large cards
 * - xl: 384px height (24rem) - for hero sections
 * - full: 100% height - for custom layouts
 */

const sizeClasses = {
  sm: 'h-24',    // 96px
  md: 'h-48',    // 192px
  lg: 'h-64',    // 256px
  xl: 'h-96',    // 384px
  full: 'h-full' // 100%
}

export function BraveImage({
  activityName,
  locationName,
  type = 'activity',
  size = 'md',
  className,
  fallbackImage = '/placeholder-activity.jpg',
  showLinks = false,
  onLinksLoaded,
  tripType,
  context
}: BraveImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchImage() {
      try {
        setLoading(true)
        setError(false)

        const response = await fetch(
          `/api/brave/activity-image?name=${encodeURIComponent(activityName)}&location=${encodeURIComponent(locationName)}&type=${type}&count=1${tripType ? `&tripType=${encodeURIComponent(tripType)}` : ''}${context ? `&context=${encodeURIComponent(context)}` : ''}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch image')
        }

        const data = await response.json()

        if (data.success && data.data.images.length > 0) {
          // Use thumbnail (16:9 optimized) or fallback to full URL
          const img = data.data.images[0]
          setImageUrl(img.thumbnail || img.url)

          if (data.data.links && data.data.links.length > 0) {
            setLinks(data.data.links)
            if (onLinksLoaded) {
              onLinksLoaded(data.data.links)
            }
          }
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Error fetching Brave image:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [activityName, locationName, type, onLinksLoaded, tripType, context])

  return (
    <div className={cn('relative overflow-hidden rounded-lg', sizeClasses[size], className)}>
      {loading ? (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          <span className="text-xs text-gray-400">Loading...</span>
        </div>
      ) : (
        <Image
          src={imageUrl || fallbackImage}
          alt={activityName}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
          sizes={
            size === 'sm' ? '96px' :
            size === 'md' ? '384px' :
            size === 'lg' ? '512px' :
            size === 'xl' ? '768px' :
            '100vw'
          }
        />
      )}

      {/* Optional: Show booking links overlay */}
      {showLinks && links.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex gap-2 flex-wrap">
            {links.slice(0, 2).map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-white/90 hover:bg-white text-gray-900 px-2 py-1 rounded-full font-medium transition-colors"
              >
                {link.type === 'official' ? '🏛️' : link.type === 'booking' ? '🎫' : '🔗'} {link.title.slice(0, 20)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * BraveImageGallery Component
 * 
 * Displays multiple 16:9 images in a responsive grid
 */

interface BraveImageGalleryProps {
  activityName: string
  locationName: string
  type?: 'activity' | 'restaurant'
  count?: number
  columns?: 2 | 3 | 4
  imageSize?: 'sm' | 'md' | 'lg'
  className?: string
  tripType?: string
  context?: string
}

export function BraveImageGallery({
  activityName,
  locationName,
  type = 'activity',
  count = 6,
  columns = 3,
  imageSize = 'md',
  className,
  tripType,
  context
}: BraveImageGalleryProps) {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true)

        const response = await fetch(
          `/api/brave/activity-image?name=${encodeURIComponent(activityName)}&location=${encodeURIComponent(locationName)}&type=${type}&count=${count}${tripType ? `&tripType=${encodeURIComponent(tripType)}` : ''}${context ? `&context=${encodeURIComponent(context)}` : ''}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch images')
        }

        const data = await response.json()

        if (data.success && data.data.images.length > 0) {
          setImages(data.data.images)
        }
      } catch (err) {
        console.error('Error fetching Brave gallery:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [activityName, locationName, type, count, tripType, context])

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }

  if (loading) {
    return (
      <div className={cn('grid gap-4', gridCols[columns], className)}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className={cn('bg-gray-200 animate-pulse rounded-lg', sizeClasses[imageSize])}
          />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return null
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {images.map((img, idx) => (
        <div
          key={idx}
          className={cn('relative overflow-hidden rounded-lg', sizeClasses[imageSize])}
        >
          <Image
            src={img.thumbnail || img.url}
            alt={img.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes={
              imageSize === 'sm' ? '96px' :
              imageSize === 'md' ? '384px' :
              '512px'
            }
          />
        </div>
      ))}
    </div>
  )
}

