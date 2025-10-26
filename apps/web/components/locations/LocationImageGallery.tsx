'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { ImageAttribution, getImageAttribution } from '@/components/ui/ImageAttribution'
import { useAuth } from '@/hooks/useAuth'
import { getLocationFallbackImage } from '@/lib/services/fallbackImageService'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'

interface LocationImageGalleryProps {
  images: string[]
  locationName: string
  locationSlug: string
  locationId: string
  country?: string
}

export function LocationImageGallery({ images, locationName, locationSlug, locationId, country }: LocationImageGalleryProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [uploaderMap, setUploaderMap] = useState<Record<string, { name: string; url?: string }>>({})
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // Listen for location updates from photos page (cross-tab communication)
  useEffect(() => {
    // Handle custom events (same page)
    const handleLocationUpdate = (event: CustomEvent) => {
      const { locationSlug: updatedSlug, type } = event.detail

      // Only refresh if it's our location
      if (updatedSlug === locationSlug) {
        console.log(`🔄 Location updated (${type}), refreshing gallery in 800ms...`)

        // CRITICAL: Wait for Upstash cache invalidation to complete
        // The API invalidates cache, but we need to wait for it to propagate
        setTimeout(() => {
          console.log(`🔄 Refreshing gallery now...`)
          router.refresh() // Refetch server component data with fresh cache
        }, 800) // Wait 800ms to ensure cache invalidation completed
      }
    }

    // Handle localStorage events (cross-tab communication)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'location-update' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue)
          const { locationSlug: updatedSlug, type } = data

          // Only refresh if it's our location
          if (updatedSlug === locationSlug) {
            console.log(`🔄 Location updated from another tab (${type}), refreshing gallery in 800ms...`)

            // CRITICAL: Wait for Upstash cache invalidation to complete
            setTimeout(() => {
              console.log(`🔄 Refreshing gallery now...`)
              router.refresh() // Refetch server component data with fresh cache
            }, 800) // Wait 800ms to ensure cache invalidation completed
          }
        } catch (error) {
          console.error('Failed to parse location update event:', error)
        }
      }
    }

    window.addEventListener('location-updated', handleLocationUpdate as EventListener)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('location-updated', handleLocationUpdate as EventListener)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [locationSlug, router])

  // Fetch image contributions to map image URL -> uploader name
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/locations/contributions?locationId=${locationId}&limit=200`)
        const json = await res.json()
        if (!cancelled && json?.success) {
          const map: Record<string, { name: string; url?: string }> = {}
          for (const c of json.contributions || []) {
            if (c.contribution_type === 'image_add') {
              const imageUrl = c?.new_value?.image_url || null
              const srcName = c?.new_value?.meta?.source?.name || c?.profiles?.full_name || c?.profiles?.username || 'Community member'
              const srcUrl = c?.new_value?.meta?.source?.url || undefined
              if (imageUrl && srcName) map[imageUrl] = { name: srcName, url: srcUrl }

            }
          }
          setUploaderMap(map)
        }
      } catch {
        // non-critical
      }
    }
    load()
    return () => { cancelled = true }
  }, [locationId])
  const withUploader = (src?: string) => {
    const base = getImageAttribution(src)
    const up = src ? uploaderMap[src] : undefined
    return { ...base, photographer: up?.name || base.photographer, sourceUrl: base.sourceUrl || up?.url }
  }


  // Ensure we have at least 5 images for the grid
  const displayImages = images.slice(0, 5)
  const hasMoreImages = images.length > 5

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const galleryUrl = `/locations/${locationSlug}/photos`

  // Prepare slides for lightbox
  const slides = images.map((src) => ({
    src,
    alt: locationName,
  }))

  // Handle image load error - use fallback
  const handleImageError = (imageSrc: string) => {
    console.warn(`❌ Image failed to load: ${imageSrc}`)
    setFailedImages(prev => new Set([...prev, imageSrc]))
  }

  // Get display image with fallback
  const getDisplayImage = (imageSrc: string | undefined, index: number): string => {
    if (!imageSrc) {
      return getLocationFallbackImage(locationName, country)
    }
    if (failedImages.has(imageSrc)) {
      return getLocationFallbackImage(locationName, country)
    }
    return imageSrc
  }

  return (
    <>
      {/* sleek-Style Grid */}
      <div className="relative group">
        <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden h-[400px] lg:h-[500px]">
          {/* Main large image - takes 2 columns and 2 rows */}
          <button
            onClick={() => openLightbox(0)}
            className="col-span-4 lg:col-span-2 lg:row-span-2 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2 rounded-l-xl"
          >
            <div className="relative w-full h-full bg-gray-100">
              <Image
                src={getDisplayImage(displayImages[0], 0)}
                alt={locationName}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                onError={() => handleImageError(displayImages[0] || '')}
              />
              <ImageAttribution {...withUploader(displayImages[0])} />
            </div>
          </button>

          {/* Top right image */}
          {displayImages[1] && (
            <button
              onClick={() => openLightbox(1)}
              className="col-span-2 lg:col-span-1 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2"
            >
              <div className="relative w-full h-full">
                <Image
                  src={displayImages[1]}
                  alt={`${locationName} view 2`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <ImageAttribution {...withUploader(displayImages[1])} />
              </div>
            </button>
          )}

          {/* Second row, first image */}
          {displayImages[2] && (
            <button
              onClick={() => openLightbox(2)}
              className="col-span-2 lg:col-span-1 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2"
            >
              <div className="relative w-full h-full">
                <Image
                  src={displayImages[2]}
                  alt={`${locationName} view 3`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <ImageAttribution {...withUploader(displayImages[2])} />
              </div>
            </button>
          )}

          {/* Bottom right, first image */}
          {displayImages[3] && (
            <button
              onClick={() => openLightbox(3)}
              className="col-span-2 lg:col-span-1 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2 rounded-br-xl lg:rounded-none"
            >
              <div className="relative w-full h-full">
                <Image
                  src={displayImages[3]}
                  alt={`${locationName} view 4`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <ImageAttribution {...withUploader(displayImages[3])} />
              </div>
            </button>
          )}

          {/* Bottom right, second image with "Show all photos" overlay */}
          {displayImages[4] && (
            <button
              onClick={() => openLightbox(4)}
              className="col-span-2 lg:col-span-1 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2 rounded-br-xl"
            >
              <div className="relative w-full h-full">
                <Image
                  src={displayImages[4]}
                  alt={`${locationName} view 5`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <ImageAttribution {...withUploader(displayImages[4])} />
                {hasMoreImages && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-semibold text-body-medium">
                      +{images.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            </button>
          )}
        </div>

        {/* "Show all photos" button - appears on hover */}
        <div className="absolute bottom-6 right-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <Link
            href={galleryUrl}
            className="bg-white hover:bg-gray-50 text-sleek-black px-4 py-2 rounded-lg shadow-lg border border-gray-200 font-semibold text-body-small transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Show all {images.length} photos
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={lightboxIndex}
        plugins={[Zoom, Fullscreen, Counter]}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        animation={{
          fade: 250,
          swipe: 250,
        }}
        controller={{
          closeOnBackdropClick: true,
        }}
        styles={{
          container: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          },
        }}
      />
    </>
  )
}

