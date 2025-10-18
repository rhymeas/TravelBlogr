'use client'

/**
 * DestinationsCarousel - Horizontal Scrolling Destinations
 * 
 * A horizontal scrolling carousel for browsing popular destinations.
 * Follows the same pattern as HorizontalLocationCards and HorizontalActivityCards.
 * Works on mobile (swipe) and desktop (arrows + scroll).
 * 
 * Use cases:
 * - Blog homepage "Popular Destinations" section
 * - Related destinations in blog posts
 * - Destination browser on location pages
 */

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DestinationCard, DestinationCardData, DestinationCardSkeleton } from './DestinationCard'

interface DestinationsCarouselProps {
  destinations: DestinationCardData[]
  onDestinationClick?: (destination: DestinationCardData) => void
  variant?: 'default' | 'compact' | 'featured'
  showArrows?: boolean
  title?: string
  subtitle?: string
  isLoading?: boolean
  className?: string
}

export function DestinationsCarousel({
  destinations,
  onDestinationClick,
  variant = 'default',
  showArrows = true,
  title,
  subtitle,
  isLoading = false,
  className = ''
}: DestinationsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Card widths based on variant
  const cardWidths = {
    compact: 'w-64',
    default: 'w-80',
    featured: 'w-96'
  }

  const cardWidth = cardWidths[variant]

  // Update scroll button visibility
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Scroll handlers
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return
    const scrollAmount = variant === 'compact' ? 280 : variant === 'featured' ? 400 : 340
    scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (!scrollContainerRef.current) return
    const scrollAmount = variant === 'compact' ? 280 : variant === 'featured' ? 400 : 340
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {showArrows && canScrollLeft && !isLoading && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all hidden md:block"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollButtons}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={`flex-shrink-0 snap-start ${cardWidth}`}>
                <DestinationCardSkeleton variant={variant} />
              </div>
            ))
          ) : destinations.length > 0 ? (
            // Destination cards
            destinations.map((destination) => (
              <div key={destination.id} className={`flex-shrink-0 snap-start ${cardWidth}`}>
                <DestinationCard
                  destination={destination}
                  variant={variant}
                  onClick={onDestinationClick}
                />
              </div>
            ))
          ) : (
            // Empty state
            <div className="w-full text-center py-12 text-gray-500">
              <p>No destinations found</p>
            </div>
          )}
        </div>

        {/* Right Arrow */}
        {showArrows && canScrollRight && !isLoading && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all hidden md:block"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        )}
      </div>

      {/* Mobile Scroll Hint */}
      {!isLoading && destinations.length > 2 && (
        <div className="md:hidden text-center mt-2 text-xs text-gray-500">
          Swipe to explore →
        </div>
      )}
    </div>
  )
}

/**
 * DestinationsGrid - Grid layout alternative to carousel
 * 
 * Use this for static grid layouts instead of horizontal scrolling
 */
interface DestinationsGridProps {
  destinations: DestinationCardData[]
  onDestinationClick?: (destination: DestinationCardData) => void
  variant?: 'default' | 'compact' | 'featured'
  columns?: 2 | 3 | 4
  title?: string
  subtitle?: string
  isLoading?: boolean
  className?: string
}

export function DestinationsGrid({
  destinations,
  onDestinationClick,
  variant = 'default',
  columns = 3,
  title,
  subtitle,
  isLoading = false,
  className = ''
}: DestinationsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={className}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Grid */}
      <div className={`grid ${gridCols[columns]} gap-6`}>
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: columns * 2 }).map((_, index) => (
            <DestinationCardSkeleton key={index} variant={variant} />
          ))
        ) : destinations.length > 0 ? (
          // Destination cards
          destinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              variant={variant}
              onClick={onDestinationClick}
            />
          ))
        ) : (
          // Empty state
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No destinations found</p>
          </div>
        )}
      </div>
    </div>
  )
}

