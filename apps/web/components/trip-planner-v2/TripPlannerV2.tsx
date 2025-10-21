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
// Import V1 map component directly - DO NOT COPY, REUSE EXACT SAME COMPONENT
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'
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
    <div className="h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      {/* Compact progress header - Apple-like dark */}
      <div className="bg-[#2a2a2a] border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-6 py-2">
          <ProgressIndicator
            phases={PHASES}
            currentPhase={currentPhase}
            onPhaseClick={goToPhase}
          />
        </div>
      </div>

      {/* Main Content - 50/50 Split - Everything in viewport */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left: Current Phase (50%) */}
          <div className="w-1/2 overflow-y-auto bg-[#1a1a1a]">
            <div className="p-6">
              {renderPhase()}
            </div>
          </div>

          {/* Right: Map Only (50%) - Using V1 TripOverviewMap component */}
          <div className="w-1/2 bg-[#0a0a0a]">
            <TripOverviewMap
              locations={tripData.destinations
                .filter(d => d.latitude && d.longitude)
                .map(d => ({
                  name: d.name,
                  latitude: d.latitude!,
                  longitude: d.longitude!
                }))}
              transportMode="car"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

