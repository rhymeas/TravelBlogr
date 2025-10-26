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
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { isAdmin } from '@/lib/utils/adminCheck'

interface TripPlannerV2Props {
  showVersionToggle?: boolean
  onVersionToggle?: () => void
  currentVersion?: 'V1' | 'V2'
}
// Import V1 components directly - DO NOT COPY, REUSE EXACT SAME COMPONENTS
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'
import { LoadingModal } from '@/components/itinerary/LoadingModal'
import type { TripPlanData } from './types'

const PHASES = [
  { id: 1, name: 'Journey', description: 'Where & When' },
  { id: 2, name: 'Preferences', description: 'Style & Budget' },
  { id: 3, name: 'Generate', description: 'Create Plan' }
]

export function TripPlannerV2({ showVersionToggle, onVersionToggle, currentVersion }: TripPlannerV2Props = {}) {
  const { user } = useAuth()
  const { showSignIn } = useAuthModal()
  const userIsAdmin = isAdmin(user?.email)

  const [currentPhase, setCurrentPhase] = useState(1)
  const [showResults, setShowResults] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [locationImages, setLocationImages] = useState<Record<string, { featured: string; gallery: string[] }>>({})
  const [structuredContext, setStructuredContext] = useState<any>(null)
  const [groqHeadline, setGroqHeadline] = useState<string>('') // GROQ-generated headline
  const [groqSubtitle, setGroqSubtitle] = useState<string>('') // GROQ-generated subtitle
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providerHealth, setProviderHealth] = useState<any>(null)
  const [generationMode, setGenerationMode] = useState<'standard' | 'pro' | 'two-stage' | undefined>(undefined)

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
    flexibleScheduling: {},

    // Trip Vision (moved to Phase 3)
    tripVision: ''
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

  const handleGeneratePlan = async (retryCount = 0) => {
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
      budget: (tripData.budget === 'mid-range' || tripData.budget === 'comfortable') ? 'moderate' : (tripData.budget === 'no-constraint' ? 'luxury' : tripData.budget),
      transportMode: tripData.transportMode || 'car',
      pace: tripData.pace,
      companions: tripData.companions,
      groupSize: tripData.groupSize,
      tripType: tripData.tripType,
      tripVision: (tripData as any).tripVision || '',
      retryAttempt: retryCount
    })

    setIsGenerating(true)
    setError(null)

    // Timeout detection (30 seconds)
    const timeoutId = setTimeout(() => {
      if (isGenerating) {
        console.warn('⏱️ V2 - Generation taking longer than expected (30s)')
        setError('Still working on your plan... This is taking longer than usual. Please wait a moment.')
      }
    }, 30000)

    try {
      const normalizedBudget = (tripData.budget === 'mid-range' || tripData.budget === 'comfortable')
        ? 'moderate'
        : (tripData.budget === 'no-constraint' ? 'luxury' : tripData.budget)

      const startTime = Date.now()
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
          budget: normalizedBudget,
          transportMode: tripData.transportMode || 'car',
          maxTravelHoursPerDay: tripData.dailyTravelHours || 5,
          proMode: false,
          tripType: tripData.tripType,
          tripVision: (tripData as any).tripVision || ''
        })
      })
      const endTime = Date.now()
      const duration = endTime - startTime

      clearTimeout(timeoutId)

      console.log(`⏱️ V2 - API response time: ${duration}ms`)

      const data = await response.json()

      console.log('✅ V2 - API response:', data)

      // Handle authentication error with friendly modal
      if (!response.ok && data.action === 'login') {
        console.log('🔐 V2 - Authentication required, showing sign-in modal')
        setIsGenerating(false)

        // Show sign-in modal with custom hero content
        showSignIn('/plan', {
          title: 'Sign in to Plan Your Trip',
          subtitle: 'Create an account to save your personalized travel plans and access them anytime.',
          features: [
            {
              icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              title: 'Save Your Plans',
              description: 'Keep all your trip ideas in one place'
            },
            {
              icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
              title: 'Smart Itineraries',
              description: 'AI-powered day-by-day travel plans'
            },
            {
              icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
              title: 'Share with Friends',
              description: 'Collaborate on trips with your travel buddies'
            }
          ]
        })
        return
      }

      if (data.success && data.plan) {
        console.log('✅ V2 - Plan generated successfully, showing results')
        console.log('📸 V2 - Location images:', data.locationImages)
        console.log('🗺️ V2 - Structured context:', data.structuredContext)
        console.log('✨ V2 - GROQ headline:', data.groqHeadline)

        setGeneratedPlan(data.plan)
        setLocationImages(data.locationImages || {})
        setStructuredContext(data.structuredContext || null)
        setGroqHeadline(data.groqHeadline || data.plan.title) // Cache GROQ headline
        setGroqSubtitle(data.groqSubtitle || data.plan.summary) // Cache GROQ subtitle

        // Provider health warnings
        if (data.meta?.providerHealth && data.meta.providerHealth.ok === false) {
          console.warn('⚠️ Provider health issues detected:', data.meta.providerHealth)
          setProviderHealth(data.meta.providerHealth)
        } else {
          setProviderHealth(null)
        }

        // Generation mode
        setGenerationMode(
          data.meta?.generationMode === 'two-stage' || data.meta?.generationMode === 'pro' || data.meta?.generationMode === 'standard'
            ? data.meta.generationMode
            : undefined
        )

        setShowResults(true)
      } else {
        console.error('❌ V2 - API returned error:', data.error)

        // Retry logic - max 2 retries
        if (retryCount < 2 && !data.error?.includes('Missing required')) {
          console.log(`🔄 V2 - Retrying plan generation (attempt ${retryCount + 1}/2)`)
          setError(`Generation failed. Retrying automatically (attempt ${retryCount + 1}/2)...`)
          setTimeout(() => handleGeneratePlan(retryCount + 1), 2000)
          return
        }

        setError(data.error || 'Failed to generate plan. Please try again.')
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ V2 - Network error:', error)

      // Retry logic for network errors - max 2 retries
      if (retryCount < 2) {
        console.log(`🔄 V2 - Retrying after network error (attempt ${retryCount + 1}/2)`)
        setError(`Network error. Retrying automatically (attempt ${retryCount + 1}/2)...`)
        setTimeout(() => handleGeneratePlan(retryCount + 1), 2000)
        return
      }

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
            tripVision={tripData.tripVision || ''}
            onTripVisionChange={(vision) => updateTripData({ tripVision: vision })}
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
        groqHeadline={groqHeadline} // Pass cached GROQ headline
        groqSubtitle={groqSubtitle} // Pass cached GROQ subtitle
        generationMode={generationMode}
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
          {/* Provider health banner (admin-only) */}
          {userIsAdmin && providerHealth && providerHealth.ok === false && (
            <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
              <strong>Warning:</strong> One or more providers are failing.
              <span className="ml-2">Brave: {providerHealth.brave?.ok ? 'OK' : 'Fail'}</span>
              <span className="ml-3">ImageKit: {providerHealth.imagekit?.ok ? 'OK' : 'Missing/Fail'}</span>
              <span className="ml-3">Upstash: {providerHealth.upstash?.ok ? 'OK' : 'Fail'}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <ProgressIndicator
              phases={PHASES}
              currentPhase={currentPhase}
              onPhaseClick={goToPhase}
            />

            {/* Version Toggle Switch (Admin Only) */}
            {showVersionToggle && onVersionToggle && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">V1</span>
                <button
                  onClick={onVersionToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    currentVersion === 'V2' ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={currentVersion === 'V2'}
                  title={`Switch to ${currentVersion === 'V2' ? 'V1' : 'V2'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentVersion === 'V2' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-500 font-medium">V2</span>
              </div>
            )}
          </div>
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
                transportMode={
                  // Map trip type to transport mode for route visualization
                  tripData.tripType === 'bike' ? 'bike' :
                  tripData.tripType === 'road-trip' ? 'car' :
                  tripData.tripType === 'city' || tripData.tripType === 'multi-destination' ? 'train' :
                  tripData.transportMode || 'car'
                }
                className="w-[calc(100%+150px)] -mr-[150px] h-[600px] rounded-xl"
                showElevation={false}
                showProviderBadge={userIsAdmin}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

