'use client'

/**
 * Trip Planner CTAs - Location Page Integration
 * Allows users to plan trips TO or FROM a specific location
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface TripPlannerCTAsProps {
  locationName: string
  locationSlug: string
  latitude?: number
  longitude?: number
  className?: string
}

export function TripPlannerCTAs({
  locationName,
  locationSlug,
  latitude,
  longitude,
  className = ''
}: TripPlannerCTAsProps) {
  const router = useRouter()
  const [hoveredButton, setHoveredButton] = useState<'to' | 'from' | null>(null)

  const handlePlanTo = () => {
    // Pre-fill trip planner with this location as destination
    const params = new URLSearchParams({
      to: locationName,
      ...(latitude && longitude && {
        to_lat: latitude.toString(),
        to_lng: longitude.toString()
      })
    })
    router.push(`/plan?${params.toString()}`)
  }

  const handlePlanFrom = () => {
    // Pre-fill trip planner with this location as starting point
    const params = new URLSearchParams({
      from: locationName,
      ...(latitude && longitude && {
        from_lat: latitude.toString(),
        from_lng: longitude.toString()
      })
    })
    router.push(`/plan?${params.toString()}`)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-teal-600" />
        <h3 className="text-lg font-bold text-gray-900">Plan Your Trip</h3>
      </div>

      {/* CTA Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Plan Trip TO This Location */}
        <motion.button
          onClick={handlePlanTo}
          onHoverStart={() => setHoveredButton('to')}
          onHoverEnd={() => setHoveredButton(null)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative overflow-hidden rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-blue-50 p-4 text-left transition-all hover:border-teal-400 hover:shadow-lg"
        >
          {/* Background Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: hoveredButton === 'to' ? 0.1 : 0,
              scale: hoveredButton === 'to' ? 1.2 : 0.8
            }}
            className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-400"
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <ArrowRight className="h-5 w-5 text-teal-600" />
              </div>
              <motion.div
                animate={{ x: hoveredButton === 'to' ? 4 : 0 }}
                className="text-teal-600"
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </div>
            
            <h4 className="font-bold text-gray-900 mb-1">
              Plan Trip <span className="text-teal-600">TO</span> Here
            </h4>
            <p className="text-sm text-gray-600">
              Set <span className="font-semibold">{locationName}</span> as your destination
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-teal-200/20 rounded-full blur-2xl" />
        </motion.button>

        {/* Plan Trip FROM This Location */}
        <motion.button
          onClick={handlePlanFrom}
          onHoverStart={() => setHoveredButton('from')}
          onHoverEnd={() => setHoveredButton(null)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative overflow-hidden rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 text-left transition-all hover:border-purple-400 hover:shadow-lg"
        >
          {/* Background Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: hoveredButton === 'from' ? 0.1 : 0,
              scale: hoveredButton === 'from' ? 1.2 : 0.8
            }}
            className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400"
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <ArrowLeft className="h-5 w-5 text-purple-600" />
              </div>
              <motion.div
                animate={{ x: hoveredButton === 'from' ? -4 : 0 }}
                className="text-purple-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.div>
            </div>
            
            <h4 className="font-bold text-gray-900 mb-1">
              Plan Trip <span className="text-purple-600">FROM</span> Here
            </h4>
            <p className="text-sm text-gray-600">
              Start your journey from <span className="font-semibold">{locationName}</span>
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl" />
        </motion.button>
      </div>

      {/* Info Text */}
      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600">
          Our AI will create a personalized itinerary with activities, restaurants, and travel tips for your trip.
        </p>
      </div>
    </div>
  )
}

