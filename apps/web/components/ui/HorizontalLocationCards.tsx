'use client'

/**
 * HorizontalLocationCards - Global Swipable Location Navigator
 * 
 * A horizontal scrolling card component for browsing locations.
 * Works on mobile (swipe) and desktop (arrows + scroll).
 * 
 * Use cases:
 * - Trip planning modal (location navigation)
 * - Trip detail pages (jump to location)
 * - Dashboard (filter by location)
 */

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Activity } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export interface LocationCardData {
  id: string
  name: string
  country?: string
  countryFlag?: string
  image: string
  dayNumber?: number
  activitiesCount?: number
  weather?: {
    temp: number
    icon: string
  }
  distanceFromPrevious?: number
  isActive?: boolean
}

interface HorizontalLocationCardsProps {
  locations: LocationCardData[]
  activeIndex?: number
  onLocationClick: (index: number) => void
  variant?: 'compact' | 'standard' | 'large'
  showArrows?: boolean
  snapToCenter?: boolean
  className?: string
}

export function HorizontalLocationCards({
  locations,
  activeIndex = 0,
  onLocationClick,
  variant = 'standard',
  showArrows = true,
  snapToCenter = true,
  className = ''
}: HorizontalLocationCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Card dimensions based on variant
  const cardSizes = {
    compact: { width: 120, height: 160 },
    standard: { width: 180, height: 240 },
    large: { width: 240, height: 320 }
  }

  const { width: cardWidth, height: cardHeight } = cardSizes[variant]

  // Update scroll button states
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Scroll to active card
  useEffect(() => {
    if (!scrollContainerRef.current || !snapToCenter) return

    const container = scrollContainerRef.current
    const cardElement = container.children[activeIndex] as HTMLElement
    if (!cardElement) return

    const containerWidth = container.clientWidth
    const cardLeft = cardElement.offsetLeft
    const cardWidth = cardElement.offsetWidth

    // Center the active card
    const scrollTo = cardLeft - (containerWidth / 2) + (cardWidth / 2)
    container.scrollTo({ left: scrollTo, behavior: 'smooth' })
  }, [activeIndex, snapToCenter])

  // Scroll handlers
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: -cardWidth - 12, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: cardWidth + 12, behavior: 'smooth' })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Left Arrow */}
      {showArrows && canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all hidden md:block"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {locations.map((location, index) => {
          const isActive = index === activeIndex

          return (
            <motion.button
              key={location.id}
              onClick={() => onLocationClick(index)}
              className={`flex-shrink-0 snap-center group relative overflow-hidden rounded-xl transition-all ${
                isActive
                  ? 'ring-2 ring-teal-500 shadow-lg scale-105'
                  : 'hover:scale-105 hover:shadow-md'
              }`}
              style={{ width: cardWidth, height: cardHeight }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={location.image}
                  alt={location.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Content Overlay */}
              <div className="relative h-full flex flex-col justify-between p-3">
                {/* Top Badges */}
                <div className="flex items-start justify-between gap-2">
                  {location.dayNumber !== undefined && (
                    <div className="bg-teal-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Day {location.dayNumber}
                    </div>
                  )}
                  {location.countryFlag && (
                    <div className="text-2xl">{location.countryFlag}</div>
                  )}
                </div>

                {/* Bottom Info */}
                <div className="space-y-1">
                  <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight">
                    {location.name}
                  </h3>
                  
                  {location.country && (
                    <div className="flex items-center gap-1 text-white/80 text-xs">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{location.country}</span>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 text-white/90 text-xs">
                    {location.activitiesCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>{location.activitiesCount}</span>
                      </div>
                    )}
                    {location.weather && (
                      <div className="flex items-center gap-1">
                        <span>{location.weather.icon}</span>
                        <span>{location.weather.temp}°</span>
                      </div>
                    )}
                    {location.distanceFromPrevious !== undefined && (
                      <div className="text-xs">
                        {location.distanceFromPrevious}km
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-blue-500"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Right Arrow */}
      {showArrows && canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all hidden md:block"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      )}

      {/* Mobile Scroll Hint */}
      {locations.length > 2 && (
        <div className="md:hidden text-center mt-2 text-xs text-gray-500">
          Swipe to explore →
        </div>
      )}
    </div>
  )
}

