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
      console.log('🔧 Plan page - No user, setting isAdmin to false')
      setIsAdmin(false)
      return
    }

    // Use adminCheck utility to check if user is admin
    const adminStatus = checkIsAdmin(user.email)
    console.log('🔧 Plan page - Admin check:', { email: user.email, isAdmin: adminStatus })
    setIsAdmin(adminStatus)
  }, [user])

  // Initialize from localStorage (admin only)
  useEffect(() => {
    console.log('🔧 Plan page - isAdmin:', isAdmin)
    if (isAdmin) {
      const v2Enabled = useTripPlannerV2()
      console.log('🔧 Plan page - V2 enabled from localStorage:', v2Enabled)
      setUseV2(v2Enabled)
      setShowToggle(true)
    } else {
      setUseV2(false)
      setShowToggle(false)
    }
  }, [isAdmin])

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
    console.log('🔧 Plan page - Toggled to:', newValue ? 'V2' : 'V1')
    setUseV2(newValue)
  }

  console.log('🔧 Plan page - Rendering:', { useV2, isAdmin, showToggle })

  return (
    <div className="relative min-h-screen">
      {/* ADMIN-ONLY Feature Flag Toggle Button */}
      {showToggle && isAdmin && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-lg hover:shadow-xl transition-all text-sm font-medium text-gray-700 hover:text-gray-900"
            title={`Switch to ${useV2 ? 'V1' : 'V2'} (Admin Only)`}
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

      {/* Render V1 or V2 based on feature flag (admin only for V2) */}
      {useV2 && isAdmin ? (
        <div className="min-h-screen bg-gray-50">
          <TripPlannerV2 />
        </div>
      ) : (
        <ItineraryGenerator />
      )}
    </div>
  )
}

