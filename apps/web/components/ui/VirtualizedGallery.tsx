'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { OptimizedImage } from './OptimizedImage'

interface VirtualizedGalleryProps {
  images: string[]
  locationName: string
  onImageClick?: (index: number) => void
  columns?: number
  rowHeight?: number
}

/**
 * Virtualized Gallery Component
 * 
 * Renders only visible images for smooth performance with large galleries.
 * Uses @tanstack/react-virtual for efficient DOM management.
 * 
 * Benefits:
 * - Renders only ~20-30 images at a time (instead of 100+)
 * - Smooth 60fps scrolling
 * - Minimal memory footprint
 * - Instant initial render
 */
export function VirtualizedGallery({
  images,
  locationName,
  onImageClick,
  columns = 3,
  rowHeight = 280
}: VirtualizedGalleryProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate number of rows
  const rowCount = Math.ceil(images.length / columns)

  // Create virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 2 // Render 2 extra rows above/below viewport
  })

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }} // Performance hint for browser
    >
      {/* Total height placeholder */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Render only visible rows */}
        {rowVirtualizer.getVirtualItems().map((virtualRow: any) => {
          const startIndex = virtualRow.index * columns
          const rowImages = images.slice(startIndex, startIndex + columns)

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <div className="grid gap-2 h-full px-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {rowImages.map((image, colIndex) => {
                  const imageIndex = startIndex + colIndex
                  
                  return (
                    <button
                      key={imageIndex}
                      onClick={() => onImageClick?.(imageIndex)}
                      className="relative overflow-hidden rounded-lg group focus:outline-none focus:ring-2 focus:ring-rausch-500 bg-gray-100"
                      style={{ aspectRatio: '4 / 3' }}
                    >
                      <OptimizedImage
                        src={image}
                        alt={`${locationName} - Photo ${imageIndex + 1}`}
                        fill
                        preset="card"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

