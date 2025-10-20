'use client'

/**
 * Trip Planner V2 - Progressive Workflow Component
 * 
 * Implements a comprehensive travel planning experience by progressively
 * gathering information through contextual, conversational steps.
 */

import { useState } from 'react'
import { PhaseOne } from './phases/PhaseOne'
import { PhaseTwo } from './phases/PhaseTwo'
import { PhaseThree } from './phases/PhaseThree'
import { PhaseFour } from './phases/PhaseFour'
import { PhaseFive } from './phases/PhaseFive'
import { PhaseSix } from './phases/PhaseSix'
import { ResultsView } from './ResultsView'
import { ProgressIndicator } from './ProgressIndicator'
import { TripSummary } from './TripSummary'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-emerald-600">TravelBlogr</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                V2 Experimental
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/plan'}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Classic Planner
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <ProgressIndicator
            phases={PHASES}
            currentPhase={currentPhase}
            onPhaseClick={goToPhase}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Current Phase */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {renderPhase()}
            </div>
          </div>

          {/* Right: Trip Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
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

