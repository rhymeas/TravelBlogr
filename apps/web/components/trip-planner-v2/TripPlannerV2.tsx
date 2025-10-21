'use client'

/**
 * Trip Planner V2 - Progressive Workflow Component
 *
 * Implements a comprehensive travel planning experience by progressively
 * gathering information through contextual, conversational steps.
 */

import { useState, useRef, useEffect } from 'react'
import { PhaseOne } from './phases/PhaseOne'
import { PhaseTwoNew } from './phases/PhaseTwoNew'
import { PhaseThreeNew } from './phases/PhaseThreeNew'
import { ResultsView } from './ResultsView'
import { ProgressIndicator } from './ProgressIndicator'
import { TripSummary } from './TripSummary'
import { Logo } from '@/components/ui/Logo'
// Import V1 components directly - DO NOT COPY, REUSE EXACT SAME COMPONENTS
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'
import { LoadingModal } from '@/components/itinerary/LoadingModal'
import type { TripPlanData } from './types'

const PHASES = [
  { id: 1, name: 'Journey', description: 'Where & When' },
  { id: 2, name: 'Preferences', description: 'Style & Budget' },
  { id: 3, name: 'Generate', description: 'Create Plan' }
]

export function TripPlannerV2() {
  const [currentPhase, setCurrentPhase] = useState(1)
  const [showResults, setShowResults] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [locationImages, setLocationImages] = useState<Record<string, { featured: string; gallery: string[] }>>({})
  const [structuredContext, setStructuredContext] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const goToPhase = (phase: number) => {
    setCurrentPhase(phase)
  }

  const nextPhase = () => {
    if (currentPhase < 3) {
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
      setError('Missing required trip information. Please complete all fields.')
      return
    }

    console.log('🚀 V2 - Generating trip plan with data:', {
      from,
      to,
      stops,
      startDate: tripData.dateRange.startDate.toISOString().split('T')[0],
      endDate: tripData.dateRange.endDate.toISOString().split('T')[0],
      interests: tripData.travelStyle,
      budget: tripData.budget,
      transportMode: tripData.transportMode || 'car',
      pace: tripData.pace,
      companions: tripData.companions,
      groupSize: tripData.groupSize
    })

    setIsGenerating(true)
    setError(null)

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
          maxTravelHoursPerDay: tripData.dailyTravelHours || 5,
          proMode: false
        })
      })

      const data = await response.json()

      console.log('✅ V2 - API response:', data)

      if (data.success && data.plan) {
        console.log('✅ V2 - Plan generated successfully, showing results')
        console.log('📸 V2 - Location images:', data.locationImages)
        console.log('🗺️ V2 - Structured context:', data.structuredContext)

        setGeneratedPlan(data.plan)
        setLocationImages(data.locationImages || {})
        setStructuredContext(data.structuredContext || null)
        setShowResults(true)
      } else {
        console.error('❌ V2 - API returned error:', data.error)
        setError(data.error || 'Failed to generate plan. Please try again.')
      }
    } catch (error) {
      console.error('❌ V2 - Network error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsGenerating(false)
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
          <PhaseTwoNew
            data={tripData}
            updateData={updateTripData}
            onNext={nextPhase}
            onBack={previousPhase}
          />
        )
      case 3:
        return (
          <PhaseThreeNew
            data={tripData}
            updateData={updateTripData}
            onNext={nextPhase}
            onBack={previousPhase}
            isGenerating={isGenerating}
            error={error}
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
        locationImages={locationImages}
        structuredContext={structuredContext}
        onEdit={() => setShowResults(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* V1 Loading Modal - Reused directly */}
      <LoadingModal isOpen={isGenerating} />

      {/* Progress indicator - V1 style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <ProgressIndicator
            phases={PHASES}
            currentPhase={currentPhase}
            onPhaseClick={goToPhase}
          />
        </div>
      </div>

      {/* Main Content - V1 side-by-side layout */}
      <div className="max-w-6xl mx-auto p-6 lg:pl-12 lg:pr-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          {/* Left: Current Phase */}
          <div>
            {renderPhase()}
          </div>

          {/* Right: Map - V1 TripOverviewMap component */}
          <div className="relative">
            <div className="sticky top-6">
              <TripOverviewMap
                locations={tripData.destinations
                  .filter(d => d.latitude && d.longitude)
                  .map(d => ({
                    name: d.name,
                    latitude: d.latitude!,
                    longitude: d.longitude!
                  }))}
                transportMode="car"
                className="w-full h-[600px] rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

