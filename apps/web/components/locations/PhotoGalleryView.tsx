'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { ImageAttribution, getImageAttribution } from '@/components/ui/ImageAttribution'
import { X, ChevronLeft, Share2, Heart, Star, Trash2, CheckSquare, Square } from 'lucide-react'
import { Location } from '@/lib/data/locationsData'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'


interface PhotoGalleryViewProps {
  location: Location
  locationId: string
}

export function PhotoGalleryView({ location, locationId }: PhotoGalleryViewProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set())
  const [updatingFeatured, setUpdatingFeatured] = useState(false)
  const [uploaderMap, setUploaderMap] = useState<Record<string, { name: string; url?: string }>>({})
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    imageUrl: string | null
  }>({ isOpen: false, imageUrl: null })

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Optimistic display state derived from server props
  const [displayImages, setDisplayImages] = useState<string[]>([])
  const [displayFeatured, setDisplayFeatured] = useState<string>('')

  // Sync display state from server props; keep any in-flight deletions hidden
  useEffect(() => {
    const serverImages = (location.images || [])
    const nextImages = serverImages.filter(img => !deletingImages.has(img))
    setDisplayImages(nextImages)
    setDisplayFeatured(location.featured_image || nextImages[0] || '')
  }, [location.images, location.featured_image, deletingImages])

  // When server props update, drop any images that are gone from the deleting set
  // IMPORTANT: Compare against raw server images, not the optimistic display list
  useEffect(() => {
    if (deletingImages.size === 0) return
    const serverImages = location.images || []
    setDeletingImages(prev => {
      const next = new Set(prev)
      for (const img of Array.from(prev)) {
        if (!serverImages.includes(img)) {
          next.delete(img)
        }
      }
      return next
    })
  }, [location.images])

  // Fetch image contributors to map image URL -> uploader name
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/locations/contributions?locationId=${locationId}&limit=300`)
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
        // ignore
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

  // DEBUG: Log on every render
  console.log('📸 PhotoGalleryView render:', {
    locationName: location.name,
    locationSlug: location.slug,
    imageCount: displayImages.length,
    featuredImage: displayFeatured?.substring(0, 50) + '...',
    deletingCount: deletingImages.size,
    firstImage: displayImages[0]?.substring(0, 50) + '...'
  })

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleSetFeatured = async (imageUrl: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening lightbox

    // Check authentication
    if (!isAuthenticated) {
      toast.error('Please sign in to set featured images', { icon: '🔒' })
      return
    }

    // 1. IMMEDIATE: Optimistically reorder and mark featured
    setUpdatingFeatured(true)
    setDisplayFeatured(imageUrl)
    setDisplayImages(prev => [imageUrl, ...prev.filter(i => i !== imageUrl)])
    toast.success('Featured image updated! 🎉', { duration: 2000 })

    // 2. BACKGROUND: Update database
    try {
      const response = await fetch('/api/admin/set-featured-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationSlug: location.slug,
          imageUrl
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ Featured image updated in database')
        if (data.addedToGallery) {
          console.log('✅ Image also added to gallery')
        }

        // 3. IMPORTANT: Refresh router to get fresh data (non-blocking)
        setTimeout(() => {
          router.refresh() // This will refetch server components with fresh data
          setUpdatingFeatured(false) // Clear loading state after refresh

          // Notify other tabs/windows using localStorage (cross-tab communication)
          if (typeof window !== 'undefined') {
            const event = {
              locationSlug: location.slug,
              featuredImage: imageUrl,
              type: 'featured-image-changed',
              timestamp: Date.now()
            }

            // Trigger storage event for other tabs
            localStorage.setItem('location-update', JSON.stringify(event))
            // Remove immediately to allow same event to fire again
            localStorage.removeItem('location-update')

            // Also dispatch local event for same-page components
            window.dispatchEvent(new CustomEvent('location-updated', { detail: event }))
          }

          console.log('✅ Router refreshed - featured image cache cleared')
        }, 250) // debounce refresh slightly to avoid stale frame
      } else {
        // Error - clear loading state
        setUpdatingFeatured(false)
        toast.error(data.error || 'Failed to set featured image')
      }
    } catch (error) {
      // Error - clear loading state
      setUpdatingFeatured(false)
      toast.error('Error updating featured image')
      console.error('Set featured error:', error)
    }
  }

  const handleDeleteImage = async (imageUrl: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening lightbox
    console.log('🗑️ handleDeleteImage called:', imageUrl?.substring(0, 50))

    // Check authentication
    if (!isAuthenticated) {
      console.log('❌ Not authenticated')
      toast.error('Please sign in to delete images', { icon: '🔒' })
      return
    }

    console.log('✅ Opening confirmation dialog')
    // Open confirmation dialog
    setConfirmDialog({ isOpen: true, imageUrl })
  }

  const confirmDelete = async () => {
    console.log('🗑️ confirmDelete called')
    const imageUrl = confirmDialog.imageUrl
    if (!imageUrl) {
      console.log('❌ No imageUrl in confirmDialog')
      return
    }
    console.log('📝 Deleting image:', imageUrl?.substring(0, 50))

    // Close dialog
    setConfirmDialog({ isOpen: false, imageUrl: null })

    // 1. IMMEDIATE: Remove from UI and mark as deleting
    setDeletingImages(prev => new Set(prev).add(imageUrl))
    setDisplayImages(prev => {
      const next = prev.filter(img => img !== imageUrl)
      if (displayFeatured === imageUrl) {
        setDisplayFeatured(next[0] || '')
      }
      return next
    })

    // 2. IMMEDIATE: Show success toast
    toast.success('Image removed! 🗑️', { duration: 2000 })
    console.log('✅ Optimistic removal applied')

    // 3. BACKGROUND: Delete from backend
    try {
      console.log('📡 Calling API:', '/api/admin/delete-location-image')
      console.log('📝 Request body:', { locationSlug: location.slug, imageUrl: imageUrl?.substring(0, 50) })

      const response = await fetch('/api/admin/delete-location-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationSlug: location.slug,
          imageUrl
        })
      })

      console.log('📡 API response status:', response.status)

      if (!response.ok) {
        // Silently log error, don't bother user
        console.log('Backend delete failed (image may not exist in DB):', imageUrl.substring(0, 60))
        // Remove from deleting state
        setDeletingImages(prev => {
          const next = new Set(prev)
          next.delete(imageUrl)
          return next
        })
      } else {
        console.log('✅ Backend delete successful')

        // 4. IMPORTANT: Refresh router to get fresh data from server
        // Wait for animation to complete before refreshing
        setTimeout(() => {
          router.refresh() // This will refetch server components with fresh data

          // Notify other tabs/windows using localStorage (cross-tab communication)
          if (typeof window !== 'undefined') {
            const event = {
              locationSlug: location.slug,
              type: 'image-deleted',
              timestamp: Date.now()
            }

            // Trigger storage event for other tabs
            localStorage.setItem('location-update', JSON.stringify(event))
            // Remove immediately to allow same event to fire again
            localStorage.removeItem('location-update')

            // Also dispatch local event for same-page components
            window.dispatchEvent(new CustomEvent('location-updated', { detail: event }))
          }

          console.log('✅ Router refreshed - cache cleared')
          // Do not clear deleting state here; keep hidden until props confirm removal
        }, 250) // debounce refresh slightly to avoid stale frame
      }
    } catch (error) {
      // Silently fail - user already sees image removed
      console.log('Backend delete error (ignored):', error)
      // Remove from deleting state
      setDeletingImages(prev => {
        const next = new Set(prev)
        next.delete(imageUrl)
        return next
      })
    }
  }

  // Multi-select handlers
  const toggleSelectImage = (imageUrl: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setIsMultiSelectMode(true)
    setSelectedImages(prev => {
      const next = new Set(prev)
      if (next.has(imageUrl)) {
        next.delete(imageUrl)
      } else {
        next.add(imageUrl)
      }
      return next
    })
  }

  const selectAllImages = () => {
    if (selectedImages.size === displayImages.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(displayImages))
    }
  }

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return

    const count = selectedImages.size
    if (!confirm(`Delete ${count} image${count > 1 ? 's' : ''}?`)) return

    setIsDeletingMultiple(true)

    try {
      const response = await fetch('/api/admin/delete-location-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationSlug: location.slug,
          imageUrls: Array.from(selectedImages)
        })
      })

      if (response.ok) {
        // Optimistically remove from UI
        setDeletingImages(prev => new Set([...prev, ...selectedImages]))
        setDisplayImages(prev => prev.filter(img => !selectedImages.has(img)))
        setSelectedImages(new Set())
        setIsMultiSelectMode(false)
        toast.success(`${count} image${count > 1 ? 's' : ''} deleted! 🗑️`, { duration: 2000 })

        // Refresh data
        setTimeout(() => {
          router.refresh()
        }, 250)
      } else {
        toast.error('Failed to delete images')
      }
    } catch (error) {
      console.error('Error deleting images:', error)
      toast.error('Error deleting images')
    } finally {
      setIsDeletingMultiple(false)
    }
  }

  // Prepare slides for lightbox
  const slides = displayImages.map((src) => ({
    src,
    alt: location.name,
  }))

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <main className="bg-white min-h-screen flex justify-center items-center">
        <div className="text-gray-500">Loading gallery...</div>
      </main>
    )
  }

  return (
    <>
      {/* Gallery Grid - Max Width 1200px */}
      <main className="bg-white min-h-screen flex justify-center">

        <div className="w-full max-w-[1200px] p-[3px]">
          {/* Disclaimer + Edit button in one row */}
          <div className="mb-3 px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              We don't own these images. Please share your photos to promote your favorite location.
            </p>
            {isAuthenticated && !isMultiSelectMode && displayImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 py-0 pt-0 leading-none text-gray-600 hover:text-gray-900 font-normal opacity-80"
                onClick={() => setIsMultiSelectMode(true)}
              >
                Edit photos
              </Button>
            )}
          </div>


          {/* Multi-select toolbar */}
          {isMultiSelectMode && (
            <div className="mb-4 px-3 py-3 bg-white rounded-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAllImages}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {selectedImages.size === displayImages.length ? (
                    <CheckSquare className="h-5 w-5 text-rausch-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                  {selectedImages.size === displayImages.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedImages.size} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedImages(new Set())
                    setIsMultiSelectMode(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedImages}
                  disabled={selectedImages.size === 0 || isDeletingMultiple}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedImages.size})
                </Button>
              </div>
            </div>
          )}

          {/* Masonry Layout - CSS Columns */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-[3px]">
            {displayImages.map((image, index) => {
              // Irregular heights for masonry effect
              const heights = [
                'h-[400px]',
                'h-[280px]',
                'h-[350px]',
                'h-[320px]',
                'h-[450px]',
                'h-[300px]',
                'h-[380px]',
                'h-[340px]',
              ]
              const heightClass = heights[index % heights.length]

              const isFeatured = image === displayFeatured
              const isDeleting = deletingImages.has(image)

              // Allow delete only for images that exist in DB
              const rawGallery = location.db_gallery_images || []
              const rawFeatured = location.db_featured_image || null
              const canDelete = rawGallery.includes(image) || rawFeatured === image

              return (
                <div
                  key={image}
                  onClick={() => openLightbox(index)}
                  className={`relative ${heightClass} w-full overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-rausch-500 bg-gray-100 mb-[3px] break-inside-avoid transition-all duration-500 ${
                    isDeleting ? 'opacity-0 scale-95 blur-[1px] pointer-events-none' : 'opacity-100 scale-100'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${location.name} - Photo ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index < 6}
                  />

                  {/* Image Attribution */}
                  <ImageAttribution {...withUploader(image)} />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                  {/* Image number badge */}
                  <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {index + 1} / {displayImages.length}
                  </div>

                  {/* Multi-select checkbox */}
                  {isMultiSelectMode && (
                    <button
                      type="button"
                      onClick={(e) => toggleSelectImage(image, e)}
                      className="absolute top-2 left-2 z-50 bg-white/90 hover:bg-white rounded-md p-1.5 transition-all duration-200"
                    >
                      {selectedImages.has(image) ? (
                        <CheckSquare className="h-5 w-5 text-rausch-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  )}

                  {/* Delete button (top right, on hover) */}
                  {canDelete && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteImage(image, e)}
                        className="bg-black/50 hover:bg-black/70 text-white/90 p-1.5 rounded backdrop-blur-sm transition-all duration-200 hover:scale-105 relative z-50"
                        title="Remove from gallery"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Main Image badge (always visible if featured) */}
                  {isFeatured && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 shadow-sm">
                      <Star className="h-3 w-3 fill-gray-700" />
                      Main Image
                    </div>
                  )}

                  {/* Set as Main Image button (on hover) */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                    <button
                      type="button"
                      onClick={(e) => handleSetFeatured(image, e)}
                      disabled={isFeatured}
                      className={`
                        px-2.5 py-1 rounded text-xs font-medium backdrop-blur-sm
                        flex items-center gap-1.5 shadow-sm
                        transition-all duration-200 relative z-50
                        ${isFeatured
                          ? 'bg-white/90 text-gray-700 cursor-default'
                          : 'bg-black/50 text-white/90 hover:bg-black/70 hover:scale-105'
                        }
                      `}
                    >
                      <Star className={`h-3 w-3 ${isFeatured ? 'fill-gray-700' : ''}`} />
                      {isFeatured ? 'Main Image' : 'Set as Main'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty state if no images */}
          {displayImages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-body-large text-sleek-gray">No photos available</p>
            </div>
          )}
        </div>
      </main>

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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, imageUrl: null })}
        onConfirm={confirmDelete}
        title="Remove Image?"
        message="Are you sure you want to remove this image from the gallery? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

