'use client'

/**
 * HorizontalActivityCards - Global Swipable Activity Browser
 * 
 * A horizontal scrolling card component for browsing activities, POIs, and attractions.
 * Works on mobile (swipe) and desktop (arrows + scroll).
 * 
 * Use cases:
 * - Trip planning modal (activity selection)
 * - POIs along route (stops browser)
 * - Location pages (things to do)
 */

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, DollarSign, Star, MapPin, Check, Plus } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'

export type ActivityCategory = 'food' | 'culture' | 'nature' | 'adventure' | 'shopping' | 'other'
export type MicroExperience = 'quick-stop' | 'coffee-break' | 'meal-break' | 'short-visit' | 'half-day' | 'full-day'

export interface ActivityCardData {
  id: string
  name: string
  category: ActivityCategory
  icon?: string
  image: string
  duration?: string
  price?: string
  rating?: number
  isAdded?: boolean
  distanceFromRoute?: number
  description?: string
  microExperience?: MicroExperience
  detourTimeMinutes?: number
}

interface HorizontalActivityCardsProps {
  activities: ActivityCardData[]
  onActivityClick: (activity: ActivityCardData, index: number) => void
  onAddToggle?: (activity: ActivityCardData, index: number) => void
  variant?: 'compact' | 'standard' | 'large'
  showArrows?: boolean
  showAddButton?: boolean
  className?: string
}

export function HorizontalActivityCards({
  activities,
  onActivityClick,
  onAddToggle,
  variant = 'standard',
  showArrows = true,
  showAddButton = true,
  className = ''
}: HorizontalActivityCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Card dimensions based on variant
  const cardSizes = {
    compact: { width: 160, height: 200 },
    standard: { width: 220, height: 280 },
    large: { width: 280, height: 360 }
  }

  const { width: cardWidth, height: cardHeight } = cardSizes[variant]

  // Update scroll button states
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Scroll handlers
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: -cardWidth - 12, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: cardWidth + 12, behavior: 'smooth' })
  }

  // Category colors
  const getCategoryColor = (category: ActivityCategory) => {
    const colors = {
      food: 'bg-orange-500',
      culture: 'bg-purple-500',
      nature: 'bg-green-500',
      adventure: 'bg-red-500',
      shopping: 'bg-pink-500',
      other: 'bg-gray-500'
    }
    return colors[category] || colors.other
  }

  // Category icons
  const getCategoryIcon = (category: ActivityCategory) => {
    const icons = {
      food: '🍽️',
      culture: '🏛️',
      nature: '🌲',
      adventure: '🏔️',
      shopping: '🛍️',
      other: '📍'
    }
    return icons[category] || icons.other
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
        className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            className="flex-shrink-0 snap-start group relative"
            style={{ width: cardWidth }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              onClick={() => onActivityClick(activity, index)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
              style={{ height: cardHeight }}
            >
              {/* Image */}
              <div className="relative h-32 overflow-hidden bg-gray-200">
                <Image
                  src={activity.image || '/placeholder-activity.jpg'}
                  alt={activity.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-activity.jpg'
                  }}
                />
                
                {/* Category Badge */}
                <div className={`absolute top-2 left-2 ${getCategoryColor(activity.category)} text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1`}>
                  <span>{activity.icon || getCategoryIcon(activity.category)}</span>
                  <span className="capitalize">{activity.category}</span>
                </div>

                {/* Rating */}
                {activity.rating !== undefined && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{activity.rating}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-gray-900">
                  {activity.name}
                </h3>

                {/* Micro-Experience Badge */}
                {activity.microExperience && (
                  <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getMicroExperienceStyle(activity.microExperience)}`}>
                    <Clock className="h-3 w-3" />
                    <span>{getMicroExperienceLabel(activity.microExperience)}</span>
                  </div>
                )}

                {activity.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {activity.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  {activity.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{activity.duration}</span>
                    </div>
                  )}
                  {activity.price && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{activity.price}</span>
                    </div>
                  )}
                  {activity.distanceFromRoute !== undefined && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{activity.distanceFromRoute.toFixed(1)}km</span>
                    </div>
                  )}
                </div>

                {/* Add Button */}
                {showAddButton && onAddToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToggle(activity, index)
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                      activity.isAdded
                        ? 'bg-teal-500 text-white hover:bg-teal-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {activity.isAdded ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check className="h-3 w-3" />
                        Added
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <Plus className="h-3 w-3" />
                        Add to Trip
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
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
      {activities.length > 2 && (
        <div className="md:hidden text-center mt-2 text-xs text-gray-500">
          Swipe to explore →
        </div>
      )}
    </div>
  )
}

// Helper: Get micro-experience label
function getMicroExperienceLabel(type: MicroExperience): string {
  const labels: Record<MicroExperience, string> = {
    'quick-stop': '< 30 min',
    'coffee-break': '30-60 min',
    'meal-break': '1-2 hours',
    'short-visit': '2-3 hours',
    'half-day': '3-5 hours',
    'full-day': '5+ hours'
  }
  return labels[type]
}

// Helper: Get micro-experience style
function getMicroExperienceStyle(type: MicroExperience): string {
  const styles: Record<MicroExperience, string> = {
    'quick-stop': 'bg-green-100 text-green-700',
    'coffee-break': 'bg-amber-100 text-amber-700',
    'meal-break': 'bg-orange-100 text-orange-700',
    'short-visit': 'bg-blue-100 text-blue-700',
    'half-day': 'bg-purple-100 text-purple-700',
    'full-day': 'bg-red-100 text-red-700'
  }
  return styles[type]
}

