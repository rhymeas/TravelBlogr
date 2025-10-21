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
import maplibregl from 'maplibre-gl'
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

  // Initialize map - Same as V1
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      try {
        if (!mapContainer.current) return

        // Initialize map with CARTO basemap (same as V1)
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: [
                  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                  'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                  'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              }
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 22
              }
            ]
          },
          center: [0, 20], // World view
          zoom: 1.5
        })

        // Add navigation controls
        map.current.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true
          }),
          'top-right'
        )

        // Add fullscreen control
        map.current.addControl(
          new maplibregl.FullscreenControl(),
          'top-right'
        )
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update map markers and route when destinations change - EXACT V1 LOGIC
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Remove existing route layer
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route')
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route')
    }

    const validDestinations = tripData.destinations.filter(
      dest => dest.latitude && dest.longitude
    )

    if (validDestinations.length === 0) {
      // Reset to world view
      map.current.flyTo({ center: [0, 20], zoom: 1.5 })
      return
    }

    // Add markers - V1 style
    validDestinations.forEach((dest, index) => {
      const el = document.createElement('div')
      el.className = 'w-8 h-8 bg-rausch-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform'
      el.textContent = (index + 1).toString()

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([dest.longitude!, dest.latitude!])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`<div class="font-semibold">${dest.name}</div>`)
        )
        .addTo(map.current!)

      markers.current.push(marker)
    })

    // Add route line if multiple destinations
    if (validDestinations.length > 1) {
      const coordinates = validDestinations.map(dest => [dest.longitude!, dest.latitude!])

      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates
          }
        }
      })

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FF5A5F',
          'line-width': 3,
          'line-opacity': 0.8
        }
      })
    }

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

          {/* Right: Map Only (50%) */}
          <div className="w-1/2 bg-[#0a0a0a]">
            <div
              ref={mapContainer}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

