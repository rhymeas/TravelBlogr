'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { X, ChevronLeft, Share2, Heart } from 'lucide-react'
import { Location } from '@/lib/data/locationsData'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import 'yet-another-react-lightbox/plugins/counter.css'

interface PhotoGalleryViewProps {
  location: Location
}

export function PhotoGalleryView({ location }: PhotoGalleryViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Ensure images array exists
  const images = location.images || []

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Prepare slides for lightbox
  const slides = images.map((src) => ({
    src,
    alt: location.name,
  }))

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

              return (
                <button
                  key={index}
                  onClick={() => openLightbox(index)}
                  className={`relative ${heightClass} w-full overflow-hidden group focus:outline-none focus:ring-2 focus:ring-rausch-500 transition-all bg-gray-100 mb-[3px] break-inside-avoid`}
                >
                  <Image
                    src={image}
                    alt={`${location.name} - Photo ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index < 6}
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  
                  {/* Image number badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-body-small font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {index + 1} / {images.length}
                  </div>
                </button>
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
    </>
  )
}

