'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { ImageAttribution, getImageAttribution } from '@/components/ui/ImageAttribution'
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
}

export function LocationImageGallery({ images, locationName, locationSlug }: LocationImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

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

  return (
    <>
      {/* Airbnb-Style Grid */}
      <div className="relative group">
        <div className="grid grid-cols-4 gap-2 rounded-xl overflow-hidden h-[400px] lg:h-[500px]">
          {/* Main large image - takes 2 columns and 2 rows */}
          <button
            onClick={() => openLightbox(0)}
            className="col-span-4 lg:col-span-2 lg:row-span-2 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2 rounded-l-xl"
          >
            <div className="relative w-full h-full">
              <Image
                src={displayImages[0] || '/placeholder-location.svg'}
                alt={locationName}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <ImageAttribution {...getImageAttribution(displayImages[0])} />
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
                <ImageAttribution {...getImageAttribution(displayImages[1])} />
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
                <ImageAttribution {...getImageAttribution(displayImages[2])} />
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
                <ImageAttribution {...getImageAttribution(displayImages[3])} />
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
                <ImageAttribution {...getImageAttribution(displayImages[4])} />
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
        <Link
          href={galleryUrl}
          className="absolute bottom-6 right-6 bg-white hover:bg-gray-50 text-airbnb-black px-4 py-2 rounded-lg shadow-lg border border-gray-200 font-semibold text-body-small transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rausch-500 focus:ring-offset-2 flex items-center gap-2"
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

