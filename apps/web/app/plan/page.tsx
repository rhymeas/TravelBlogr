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
import { Settings } from 'lucide-react'

export default function PlanPage() {
  const { user, isLoading } = useAuth()
  const [useV2, setUseV2] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }

      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        setIsAdmin(data.role === 'admin')
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [user])

  // Initialize from localStorage (admin only)
  useEffect(() => {
    if (isAdmin) {
      setUseV2(useTripPlannerV2())
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
    setUseV2(newValue)
  }

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

