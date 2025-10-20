'use client'

/**
 * Trip Planner V2 - Progressive Workflow Component
 *
 * Implements a comprehensive travel planning experience by progressively
 * gathering information through contextual, conversational steps.
 */

import { useState, useRef, useEffect } from 'react'
import { PhaseOne } from './phases/PhaseOne'
import { PhaseTwo } from './phases/PhaseTwo'
import { PhaseThree } from './phases/PhaseThree'
import { PhaseFour } from './phases/PhaseFour'
import { PhaseFive } from './phases/PhaseFive'
import { PhaseSix } from './phases/PhaseSix'
import { ResultsView } from './ResultsView'
import { ProgressIndicator } from './ProgressIndicator'
import { TripSummary } from './TripSummary'
import { Logo } from '@/components/ui/Logo'
import maplibregl from 'maplibre-gl'
import type { TripPlanData } from './types'

const PHASES = [
  { id: 1, name: 'Journey Foundation', description: 'Where and when' },
  { id: 2, name: 'Travel Companions', description: 'Who\'s coming' },
  { id: 3, name: 'Transportation', description: 'How you\'ll travel' },
  { id: 4, name: 'Travel Style', description: 'Your pace and preferences' },
  { id: 5, name: 'Practical Details', description: 'Budget and accommodations' },
  { id: 6, name: 'Route Planning', description: 'Waypoints and stops' }
]

export function TripPlannerV2() {
  const [currentPhase, setCurrentPhase] = useState(1)
  const [showResults, setShowResults] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)

  // Map state
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])

  const [tripData, setTripData] = useState<TripPlanData>({
    // Phase 1: Journey Foundation
    destinations: [],
    tripType: null,
    dateRange: null,
    
    // Phase 2: Travel Companions
    companions: null,
    groupSize: 1,
    specialNeeds: [],
    
    // Phase 3: Transportation
    transportMode: null,
    transportDetails: {},
    
    // Phase 4: Travel Style
    pace: 'moderate',
    travelStyle: [],
    
    // Phase 5: Practical Details
    budget: 'mid-range',
    accommodationTypes: [],
    diningPreference: 'mixed',
    
    // Phase 6: Route Planning (conditional)
    waypointStrategy: null,
    stopPreferences: [],
    flexibleScheduling: {}
  })

  const updateTripData = (updates: Partial<TripPlanData>) => {
    setTripData(prev => ({ ...prev, ...updates }))
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [0, 20],
      zoom: 1.5,
      attributionControl: false
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update map markers when destinations change
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add markers for destinations with coordinates
    const validDestinations = tripData.destinations.filter(
      dest => dest.latitude && dest.longitude
    )

    if (validDestinations.length === 0) return

    validDestinations.forEach((dest, index) => {
      const el = document.createElement('div')
      el.className = 'w-8 h-8 bg-[#2C5F6F] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg'
      el.textContent = String.fromCharCode(65 + index) // A, B, C...

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([dest.longitude!, dest.latitude!])
        .addTo(map.current!)

      markers.current.push(marker)
    })

    // Fit bounds to show all markers
    if (validDestinations.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      validDestinations.forEach(dest => {
        bounds.extend([dest.longitude!, dest.latitude!])
      })
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 })
    }
  }, [tripData.destinations])

  const goToPhase = (phase: number) => {
    setCurrentPhase(phase)
  }

  const nextPhase = () => {
    if (currentPhase < 6) {
      setCurrentPhase(prev => prev + 1)
    } else {
      handleGeneratePlan()
    }
  }

  const previousPhase = () => {
    if (currentPhase > 1) {
      setCurrentPhase(prev => prev - 1)
    }
  }

  const handleGeneratePlan = async () => {
    // Prepare API request from tripData
    const from = tripData.destinations[0]?.name
    const to = tripData.destinations[tripData.destinations.length - 1]?.name
    const stops = tripData.destinations.slice(1, -1).map(d => d.name)

    if (!from || !to || !tripData.dateRange) {
      alert('Missing required trip information')
      return
    }

    try {
      const response = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          stops,
          startDate: tripData.dateRange.startDate.toISOString().split('T')[0],
          endDate: tripData.dateRange.endDate.toISOString().split('T')[0],
          interests: tripData.travelStyle,
          budget: tripData.budget,
          transportMode: tripData.transportMode || 'car',
          maxTravelHoursPerDay: tripData.dailyTravelHours,
          proMode: false
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedPlan(data.plan)
        setShowResults(true)
      } else {
        alert(`Failed to generate plan: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      alert('Network error. Please try again.')
    }
  }

  const renderPhase = () => {
    switch (currentPhase) {
      case 1:
        return (
          <PhaseOne
            data={tripData}
            updateData={updateTripData}
            onNext={nextPhase}
          />
        )
      case 2:
        return (
          <PhaseTwo
            data={tripData}
            updateData={updateTripData}
            onNext={nextPhase}
            onBack={previousPhase}
          />
        )
      case 3:
        return (
          <PhaseThree
            data={tripData}
            updateData={updateTripData}
            onNext={nextPhase}
            onBack={previousPhase}
          />
        )
      case 4:
        return (
          <PhaseFour
            data={tripData}
            updateData={updateTripData}
            onNext={nextPhase}
            onBack={previousPhase}
          />
        )
      case 5:
        return (
          <PhaseFive
            data={tripData}
            updateData={updateTripData}
            onNext={nextPhase}
            onBack={previousPhase}
          />
        )
      case 6:
        return (
          <PhaseSix
            data={tripData}
            updateData={updateTripData}
            onNext={nextPhase}
            onBack={previousPhase}
          />
        )
      default:
        return null
    }
  }

  if (showResults && generatedPlan) {
    return (
      <ResultsView
        plan={generatedPlan}
        tripData={tripData}
        onEdit={() => setShowResults(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="small" />
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded">
                V2 Experimental
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/plan'}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                ← Classic Planner
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <ProgressIndicator
            phases={PHASES}
            currentPhase={currentPhase}
            onPhaseClick={goToPhase}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Current Phase */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow p-6">
              {renderPhase()}
            </div>
          </div>

          {/* Right: Map & Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              {/* Map */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div
                  ref={mapContainer}
                  className="w-full h-64"
                  style={{ minHeight: '256px' }}
                />
              </div>

              {/* Trip Summary */}
              <TripSummary data={tripData} currentPhase={currentPhase} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <span className="font-semibold">Experimental Feature:</span> This is a test version of our new trip planner.
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-gray-900">Give Feedback</a>
              <a href="#" className="hover:text-gray-900">Report Issue</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

