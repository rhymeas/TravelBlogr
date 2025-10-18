'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { HorizontalActivityCards, type ActivityCardData } from '@/components/ui/HorizontalActivityCards'

interface RoutePOI {
  name: string
  category: string
  latitude: number
  longitude: number
  distanceFromRoute: number
  rating?: number
  description?: string
  wikidata?: string
  kinds?: string
  detourTimeMinutes?: number
  visitDurationMinutes?: number
  microExperience?: 'quick-stop' | 'coffee-break' | 'meal-break' | 'short-visit' | 'half-day' | 'full-day'
  score?: number
}

interface RoutePoiSectionProps {
  pois: RoutePOI[]
  className?: string
}

export function RoutePoiSection({ pois, className = '' }: RoutePoiSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  if (!pois || pois.length === 0) {
    return null
  }

  // Sort by score (highest first)
  const sortedPOIs = [...pois].sort((a, b) => (b.score || 0) - (a.score || 0))

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(sortedPOIs.map(poi => poi.category)))]

  // Filter POIs by category
  const filteredPOIs = selectedCategory === 'all'
    ? sortedPOIs
    : sortedPOIs.filter(poi => poi.category === selectedCategory)

  // Get category icon
  const getCategoryIcon = (category: string) => {
    if (category.includes('food') || category.includes('restaurant')) return '🍽️'
    if (category.includes('natural') || category.includes('nature')) return '🌲'
    if (category.includes('museum') || category.includes('cultural')) return '🏛️'
    if (category.includes('viewpoint') || category.includes('scenic')) return '👁️'
    if (category.includes('historic') || category.includes('monument')) return '🏰'
    return '📍'
  }

  // Format category name
  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="h-5 w-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-purple-900">
            Stops Along the Way
          </h3>
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            {pois.length} places
          </span>
          {sortedPOIs.filter(p => (p.score || 0) >= 70).length > 0 && (
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
              ⭐ {sortedPOIs.filter(p => (p.score || 0) >= 70).length} highly ranked
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-purple-600 group-hover:text-purple-700" />
        ) : (
          <ChevronDown className="h-4 w-4 text-purple-600 group-hover:text-purple-700" />
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    {category === 'all' ? 'All' : formatCategory(category)}
                  </button>
                ))}
              </div>

              {/* POI List - Horizontal Swipable Cards */}
              {filteredPOIs.length > 0 ? (
                <HorizontalActivityCards
                  activities={filteredPOIs.map((poi, index) => ({
                    id: `poi-${index}`,
                    name: poi.name,
                    category: poi.category.includes('food') ? 'food' :
                             poi.category.includes('natural') ? 'nature' :
                             poi.category.includes('museum') || poi.category.includes('cultural') ? 'culture' :
                             'other',
                    icon: getCategoryIcon(poi.category),
                    image: '/placeholder-poi.jpg',
                    rating: poi.rating,
                    distanceFromRoute: poi.distanceFromRoute,
                    description: formatCategory(poi.category),
                    microExperience: poi.microExperience,
                    detourTimeMinutes: poi.detourTimeMinutes
                  } as ActivityCardData))}
                  onActivityClick={(activity, index) => {
                    const poi = filteredPOIs[index]
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`,
                      '_blank'
                    )
                  }}
                  variant="compact"
                  showArrows={true}
                  showAddButton={false}
                />
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  No {selectedCategory !== 'all' ? formatCategory(selectedCategory).toLowerCase() : 'places'} found
                </div>
              )}

              {/* Info Text */}
              <p className="text-xs text-purple-700 bg-purple-100 rounded-lg p-2">
                💡 These are interesting stops along your route. Click the map icon to view in Google Maps.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

