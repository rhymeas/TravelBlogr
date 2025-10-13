'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { ImageAttribution, getImageAttribution } from '@/components/ui/ImageAttribution'
import { X, ChevronLeft, Share2, Heart, Star } from 'lucide-react'
import { Location } from '@/lib/data/locationsData'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface PhotoGalleryViewProps {
  location: Location
}

export function PhotoGalleryView({ location }: PhotoGalleryViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [featuredImage, setFeaturedImage] = useState(location.featured_image || location.images?.[0] || '')
  const [mounted, setMounted] = useState(false)
  const [deletedImages, setDeletedImages] = useState<Set<string>>(new Set())
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set())
  const [updatingFeatured, setUpdatingFeatured] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    imageUrl: string | null
  }>({ isOpen: false, imageUrl: null })

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Ensure images array exists and filter out deleted images
  const allImages = location.images || []
  const images = allImages.filter(img => !deletedImages.has(img))

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleSetFeatured = async (imageUrl: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening lightbox

    // 1. IMMEDIATE: Update UI optimistically
    const previousFeatured = featuredImage
    setFeaturedImage(imageUrl)
    setUpdatingFeatured(true)
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

        // 3. IMPORTANT: Trigger cache revalidation
        // This ensures the location card shows the new featured image
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            fetch('/api/revalidate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: `/locations/${location.slug}` })
            }).catch(() => console.log('Cache revalidation skipped'))
          }
        }, 500)
      } else {
        // Rollback on error
        setFeaturedImage(previousFeatured)
        toast.error(data.error || 'Failed to set featured image')
      }
    } catch (error) {
      // Rollback on error
      setFeaturedImage(previousFeatured)
      toast.error('Error updating featured image')
      console.error('Set featured error:', error)
    } finally {
      setUpdatingFeatured(false)
    }
  }

  const handleDeleteImage = async (imageUrl: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening lightbox

    // Open confirmation dialog
    setConfirmDialog({ isOpen: true, imageUrl })
  }

  const confirmDelete = async () => {
    const imageUrl = confirmDialog.imageUrl
    if (!imageUrl) return

    // 1. IMMEDIATE: Start delete animation
    setDeletingImages(prev => new Set(prev).add(imageUrl))

    // 2. IMMEDIATE: Show success toast
    toast.success('Image removed! 🗑️', { duration: 2000 })

    // 3. AFTER ANIMATION: Mark as deleted (removes from DOM)
    setTimeout(() => {
      setDeletedImages(prev => new Set(prev).add(imageUrl))
      setDeletingImages(prev => {
        const next = new Set(prev)
        next.delete(imageUrl)
        return next
      })
    }, 500) // Match animation duration

    // 4. BACKGROUND: Try to delete from backend (silently)
    try {
      const response = await fetch('/api/admin/delete-location-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationSlug: location.slug,
          imageUrl
        })
      })

      if (!response.ok) {
        // Silently log error, don't bother user
        console.log('Backend delete failed (image may not exist in DB):', imageUrl.substring(0, 60))
      } else {
        console.log('✅ Backend delete successful')

        // 5. IMPORTANT: Revalidate cache so other pages update
        setTimeout(() => {
          fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `/locations/${location.slug}` })
          }).catch(() => console.log('Cache revalidation skipped'))
        }, 600) // After animation completes
      }
    } catch (error) {
      // Silently fail - user already sees image removed
      console.log('Backend delete error (ignored):', error)
    }
  }

  // Prepare slides for lightbox
  const slides = images.map((src) => ({
    src,
    alt: location.name,
  }))

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <main className="bg-gray-200 min-h-screen flex justify-center items-center">
        <div className="text-gray-500">Loading gallery...</div>
      </main>
    )
  }

  return (
    <>
      {/* Gallery Grid - Max Width 1200px */}
      <main className="bg-gray-200 min-h-screen flex justify-center">
        <div className="w-full max-w-[1200px] p-[3px]">
          {/* Masonry Layout - CSS Columns */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-[3px]">
            {images.map((image, index) => {
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

              const isFeatured = image === featuredImage
              const isDeleting = deletingImages.has(image)

              return (
                <div
                  key={index}
                  onClick={() => openLightbox(index)}
                  className={`relative ${heightClass} w-full overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-rausch-500 bg-gray-100 mb-[3px] break-inside-avoid transition-all duration-500 ${
                    isDeleting
                      ? 'opacity-0 scale-75 blur-sm'
                      : 'opacity-100 scale-100'
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
                  <ImageAttribution {...getImageAttribution(image)} />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                  {/* Image number badge */}
                  <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {index + 1} / {images.length}
                  </div>

                  {/* Delete button (top right, on hover) */}
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

                  {/* Featured badge (always visible if featured) */}
                  {isFeatured && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 shadow-sm">
                      <Star className="h-3 w-3 fill-gray-700" />
                      Featured
                    </div>
                  )}

                  {/* Set as Featured button (on hover) */}
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
                      {isFeatured ? 'Featured' : 'Set Featured'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty state if no images */}
          {images.length === 0 && (
            <div className="text-center py-20">
              <p className="text-body-large text-airbnb-gray">No photos available</p>
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

