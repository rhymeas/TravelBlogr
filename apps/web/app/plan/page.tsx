'use client'

/**
 * Trip Planner Page
 * /plan
 *
 * Toggles between V1 (ItineraryGenerator) and V2 (TripPlannerV2) based on feature flag
 * ADMIN-ONLY TOGGLE
 */

import { useState, useEffect } from 'react'
import { ItineraryGenerator } from '@/components/itinerary/ItineraryGenerator'
import { TripPlannerV2 } from '@/components/trip-planner-v2/TripPlannerV2'
import { useTripPlannerV2, toggleTripPlannerVersion } from '@/lib/featureFlags'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin as checkIsAdmin } from '@/lib/utils/adminCheck'
import { Settings } from 'lucide-react'

export default function PlanPage() {
  const { user, isLoading } = useAuth()
  const [useV2, setUseV2] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    // Use adminCheck utility to check if user is admin
    const adminStatus = checkIsAdmin(user.email)

    // TEMPORARY: Force admin for testing
    // TODO: Remove this after testing
    setIsAdmin(true)
  }, [user])

  // Initialize from localStorage - no visible toggle, just use feature flag
  useEffect(() => {
    const v2Enabled = useTripPlannerV2()
    setUseV2(v2Enabled)
    // Never show toggle on page, only in admin dashboard
    setShowToggle(false)
  }, [])

  // Listen for changes from other tabs (admin only)
  useEffect(() => {
    if (!isAdmin) return

    const handleChange = () => {
      setUseV2(useTripPlannerV2())
    }

    window.addEventListener('tripPlannerVersionChanged', handleChange)
    return () => window.removeEventListener('tripPlannerVersionChanged', handleChange)
  }, [isAdmin])

  const handleToggle = () => {
    if (!isAdmin) return
    const newValue = toggleTripPlannerVersion()
    setUseV2(newValue)
  }

  return (
    <div className="relative min-h-screen">
      {/* No visible toggle - controlled only via admin dashboard */}

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

