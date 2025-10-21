'use client'

/**
 * Trip Planner Page
 * /plan
 *
 * Toggles between V1 (ItineraryGenerator) and V2 (TripPlannerV2) based on feature flag
 */

import { useState, useEffect } from 'react'
import { ItineraryGenerator } from '@/components/itinerary/ItineraryGenerator'
import { TripPlannerV2 } from '@/components/trip-planner-v2/TripPlannerV2'
import { useTripPlannerV2, toggleTripPlannerVersion } from '@/lib/featureFlags'
import { Settings } from 'lucide-react'

export default function PlanPage() {
  const [useV2, setUseV2] = useState(false)
  const [showToggle, setShowToggle] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    setUseV2(useTripPlannerV2())
    setShowToggle(true)
  }, [])

  // Listen for changes from other tabs
  useEffect(() => {
    const handleChange = () => {
      setUseV2(useTripPlannerV2())
    }

    window.addEventListener('tripPlannerVersionChanged', handleChange)
    return () => window.removeEventListener('tripPlannerVersionChanged', handleChange)
  }, [])

  const handleToggle = () => {
    const newValue = toggleTripPlannerVersion()
    setUseV2(newValue)
  }

  return (
    <div className="relative min-h-screen">
      {/* Feature Flag Toggle Button */}
      {showToggle && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all text-sm font-medium text-gray-700 hover:text-gray-900"
            title={`Switch to ${useV2 ? 'V1' : 'V2'}`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">
              Trip Planner {useV2 ? 'V2' : 'V1'}
            </span>
            <span className="inline sm:hidden">
              {useV2 ? 'V2' : 'V1'}
            </span>
          </button>
        </div>
      )}

      {/* Render V1 or V2 based on feature flag */}
      {useV2 ? (
        <div className="min-h-screen bg-gray-50">
          <TripPlannerV2 />
        </div>
      ) : (
        <ItineraryGenerator />
      )}
    </div>
  )
}

