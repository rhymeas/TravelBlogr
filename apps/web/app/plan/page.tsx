'use client'

export const dynamic = 'force-dynamic'

/**
 * Trip Planner Page
 * /plan
 *
 * V2 Planner is now the default for all users (V2 Milestone Complete)
 * V1 can still be accessed via feature flag toggle in admin dashboard
 */

import { useState, useEffect } from 'react'
import { ItineraryGenerator } from '@/components/itinerary/ItineraryGenerator'
import { TripPlannerV2 } from '@/components/trip-planner-v2/TripPlannerV2'
import { useTripPlannerV2 } from '@/lib/featureFlags'

export default function PlanPage() {
  const [useV2, setUseV2] = useState(true) // Default to V2

  // Initialize from feature flag
  useEffect(() => {
    const v2Enabled = useTripPlannerV2()
    setUseV2(v2Enabled)
  }, [])

  // Listen for feature flag changes (from admin dashboard)
  useEffect(() => {
    const handleChange = () => {
      setUseV2(useTripPlannerV2())
    }

    window.addEventListener('tripPlannerVersionChanged', handleChange)
    return () => window.removeEventListener('tripPlannerVersionChanged', handleChange)
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* Render V2 by default, V1 only if explicitly disabled via admin */}
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

