'use client'

/**
 * POI Section - Display Points of Interest from structured context
 * Shows attractions, landmarks, and notable places for each location
 */

import { useState } from 'react'
import { MapPin, ExternalLink, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface POI {
  name: string
  latitude?: number
  longitude?: number
  category?: string
  rating?: number
  description?: string
}

interface POISectionProps {
  locationName: string
  pois: POI[]
  className?: string
}

export function POISection({ locationName, pois, className = '' }: POISectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  if (!pois || pois.length === 0) return null

  // Extract unique categories
  const categories = ['all', ...Array.from(new Set(pois.map(poi => poi.category).filter(Boolean)))]
  
  // Filter POIs by category
  const filteredPOIs = selectedCategory === 'all' 
    ? pois 
    : pois.filter(poi => poi.category === selectedCategory)

  const openInMaps = (poi: POI) => {
    if (poi.latitude && poi.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`
      window.open(url, '_blank')
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' ' + locationName)}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500 rounded-lg">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-gray-900">Points of Interest</h3>
            <p className="text-xs text-gray-600">{filteredPOIs.length} places to explore</p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Category Filter */}
            {categories.length > 2 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category || 'all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All' : category}
                  </button>
                ))}
              </div>
            )}

            {/* POI List */}
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {filteredPOIs.map((poi, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {poi.name}
                        </h4>
                        {poi.rating && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 rounded-full">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-medium text-yellow-700">
                              {poi.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {poi.category && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full mb-1">
                          {poi.category}
                        </span>
                      )}
                      
                      {poi.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                          {poi.description}
                        </p>
                      )}
                      
                      {poi.latitude && poi.longitude && (
                        <p className="text-xs text-gray-400 mt-1">
                          {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => openInMaps(poi)}
                      className="flex-shrink-0 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group-hover:scale-110 active:scale-95"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredPOIs.length === 0 && (
              <div className="text-center py-6">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No POIs found for this category</p>
              </div>
            )}

            {/* Footer Info */}
            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs text-gray-600 text-center">
                💡 Click <ExternalLink className="inline h-3 w-3" /> to view on Google Maps
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

