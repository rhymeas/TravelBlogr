'use client'

/**
 * Minimalist Airbnb-style plan Generator
 */

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LocationInput } from './LocationInput'
import { DateRangePicker } from './DateRangePicker'
import { TravelTimeSlider } from './TravelTimeSlider'
import { TransportModeSelector, type TransportMode } from './TransportModeSelector'
import { planModal as PlanModal } from './ItineraryModal'
import { LoadingModal } from './LoadingModal'
import { SignInModal } from '@/components/auth/SignInModal'
import { ChevronDown, ChevronUp, Map as MapIcon, Shield, Sparkles, Info } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import { useAuth } from '@/hooks/useAuth'
import {
  savePlanningFormData,
  getPlanningFormData,
  clearPlanningFormData
} from '@/lib/utils/planningFormStorage'
import toast from 'react-hot-toast'

export function ItineraryGenerator() {
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [showPlanningAuthModal, setShowPlanningAuthModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [ctaBottomOffset, setCtaBottomOffset] = useState(24) // 24px = bottom-6
  // @ts-ignore - Kept for backend logging only
  const [resolvedLocations, setResolvedLocations] = useState<any[]>([])
  const [locationImages, setLocationImages] = useState<Record<string, string>>({})
  const [locationCoordinates, setLocationCoordinates] = useState<Record<string, { latitude: number; longitude: number }>>({})

  // Multi-location state with resolved names and metadata
  const [locations, setLocations] = useState<Array<{
    id: string
    value: string
    resolvedName?: string
    region?: string
    country?: string
    latitude?: number
    longitude?: number
  }>>([
    { id: '1', value: '' },
    { id: '2', value: '' }
  ])

  // Map state - always visible, updates automatically
  const [mapLocations, setMapLocations] = useState<Array<{
    id: string
    lat: number
    lng: number
    title: string
    type: 'waypoint' | 'photo' | 'accommodation' | 'restaurant' | 'attraction'
  }>>([])
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])

  // Restore saved form data on mount (after login/signup)
  useEffect(() => {
    const savedData = getPlanningFormData()
    if (savedData) {
      console.log('🔄 Restoring saved planning form data:', savedData)

      // Restore locations
      if (savedData.locations && savedData.locations.length > 0) {
        setLocations(savedData.locations.map((loc, index) => ({
          id: (index + 1).toString(),
          value: loc.value,
          latitude: loc.coordinates?.lat,
          longitude: loc.coordinates?.lng
        })))
      }

      // Restore dates
      if (savedData.startDate && savedData.endDate) {
        setDateRange({
          startDate: new Date(savedData.startDate),
          endDate: new Date(savedData.endDate)
        })
      }

      // Restore pro mode
      if (savedData.proMode !== undefined) {
        setProMode(savedData.proMode)
      }

      toast.success('Your trip details have been restored!')

      // Clear saved data after restoring
      clearPlanningFormData()
    }
  }, [])

  // Prefill destination from URL parameter
  useEffect(() => {
    const toParam = searchParams.get('to')
    const fromParam = searchParams.get('from')

    if (toParam || fromParam) {
      setLocations(prev => {
        const newLocations = [...prev]
        if (fromParam) {
          newLocations[0] = { ...newLocations[0], value: fromParam }
        }
        if (toParam) {
          newLocations[1] = { ...newLocations[1], value: toParam }
        }
        return newLocations
      })
    }
  }, [searchParams])

  // Date range state
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null)

  // Travel time preference (optional)
  const [showTravelPace, setShowTravelPace] = useState(false)
  const [travelHoursPerDay, setTravelHoursPerDay] = useState<number | null>(null)

  // Transport mode and Pro mode
  const [transportMode, setTransportMode] = useState<TransportMode>('car')
  const [proMode, setProMode] = useState(false)

  // Advanced settings modal
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  // Distance calculation state
  const [totalDistance, setTotalDistance] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    interests: 'art, food, history',
    budget: 'moderate'
  })

  // Check if form is valid
  const isFormValid = () => {
    const filledLocations = locations.filter(loc => loc.value.trim())
    return filledLocations.length >= 2 && dateRange !== null
  }

  // Adjust CTA position to stay above footer
  useEffect(() => {
    const handleScroll = () => {
      // Find the footer element in the DOM (from root layout)
      const footer = document.querySelector('footer')
      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Calculate how much the footer overlaps with the viewport
        const footerOverlap = windowHeight - footerRect.top

        if (footerOverlap > 0) {
          // Footer is visible, push CTA up by the overlap amount plus padding
          setCtaBottomOffset(footerOverlap + 24)
        } else {
          // Footer not visible, use default position
          setCtaBottomOffset(24)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    handleScroll() // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      try {
        if (!mapContainer.current) return

        // Initialize map with CARTO basemap (same as location pages)
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

  // Auto-update map when locations change
  useEffect(() => {
    const updateMapLocations = async () => {
      const filledLocations = locations.filter(loc => loc.value.trim())

      // Need at least 1 location to show on map
      if (filledLocations.length === 0) {
        setMapLocations([])
        return
      }

      setIsLoadingCoordinates(true)

      try {
        // Fetch coordinates for each location in parallel
        const locationsWithCoords = await Promise.all(
          filledLocations.map(async (loc, index) => {
            // If we already have coordinates, use them
            if (loc.latitude && loc.longitude) {
              return {
                id: loc.id,
                lat: loc.latitude,
                lng: loc.longitude,
                title: loc.value,
                type: (index === 0 ? 'waypoint' :
                       index === filledLocations.length - 1 ? 'attraction' :
                       'waypoint') as 'waypoint' | 'attraction'
              }
            }

            // Otherwise, quick search for coordinates
            try {
              const response = await fetch(`/api/locations/search?q=${encodeURIComponent(loc.value)}&limit=1`)
              const data = await response.json()

              if (data.success && data.data.length > 0) {
                const result = data.data[0]
                return {
                  id: loc.id,
                  lat: result.latitude,
                  lng: result.longitude,
                  title: result.displayName || loc.value,
                  type: (index === 0 ? 'waypoint' :
                         index === filledLocations.length - 1 ? 'attraction' :
                         'waypoint') as 'waypoint' | 'attraction'
                }
              }
            } catch (err) {
              console.error('Error fetching coordinates for', loc.value, err)
            }

            return null
          })
        )

        // Filter out null results
        const validLocations = locationsWithCoords.filter(loc => loc !== null) as typeof mapLocations
        setMapLocations(validLocations)
      } catch (err) {
        console.error('Error updating map:', err)
      } finally {
        setIsLoadingCoordinates(false)
      }
    }

    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(updateMapLocations, 500)
    return () => clearTimeout(timeoutId)
  }, [locations])

  // Calculate total distance when locations change
  useEffect(() => {
    const filledLocations = locations.filter(loc =>
      loc.value.trim() && loc.latitude && loc.longitude
    )

    if (filledLocations.length >= 2) {
      let distance = 0

      // Calculate distance through all waypoints using Haversine formula
      for (let i = 0; i < filledLocations.length - 1; i++) {
        const from = filledLocations[i]
        const to = filledLocations[i + 1]

        // Haversine formula for great-circle distance
        const R = 6371 // Earth radius in km
        const dLat = (to.latitude! - from.latitude!) * Math.PI / 180
        const dLon = (to.longitude! - from.longitude!) * Math.PI / 180

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(from.latitude! * Math.PI / 180) *
                  Math.cos(to.latitude! * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance += R * c
      }

      setTotalDistance(distance)
    } else {
      setTotalDistance(null)
    }
  }, [locations])

  // Update map markers and route when mapLocations change
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

    if (mapLocations.length === 0) {
      // Reset to world view
      map.current.flyTo({ center: [0, 20], zoom: 1.5 })
      return
    }

    // Add markers
    mapLocations.forEach((location, index) => {
      const el = document.createElement('div')
      el.className = 'w-8 h-8 bg-rausch-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform'
      el.textContent = (index + 1).toString()

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([location.lng, location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`<div class="font-semibold">${location.title}</div>`)
        )
        .addTo(map.current!)

      markers.current.push(marker)
    })

    // Add REAL ROAD ROUTE if multiple locations
    if (mapLocations.length > 1) {
      // Fetch real road route from API
      const coordinates = mapLocations.map(loc => ({ longitude: loc.lng, latitude: loc.lat }))

      // Map transport mode to routing profile
      let profile = 'driving-car'
      if (transportMode === 'bike') profile = 'cycling-regular'
      // Train and flight use car routing (for road access to stations/airports)

      fetch('/api/routing/get-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates, profile })
      })
        .then(res => res.json())
        .then(routeData => {
          if (!map.current) return

          // Remove old route if exists
          if (map.current.getSource('route')) {
            map.current.removeLayer('route')
            map.current.removeSource('route')
          }

          // Add real road route
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: routeData.geometry
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

          console.log(`✅ Real road route loaded from ${routeData.provider}`)
        })
        .catch(error => {
          console.error('Failed to load real route, using straight line:', error)

          // Fallback to straight line if routing fails
          if (!map.current) return

          const coordinates = mapLocations.map(loc => [loc.lng, loc.lat])

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
              'line-opacity': 0.8,
              'line-dasharray': [2, 2] // Dashed line to indicate fallback
            }
          })
        })
    }

    // Fit bounds to show all markers
    if (mapLocations.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      mapLocations.forEach(loc => {
        bounds.extend([loc.lng, loc.lat])
      })
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 })
    }
  }, [mapLocations])

  const handleGenerate = async () => {
    // Validation first
    const filledLocations = locations.filter(loc => loc.value.trim())
    if (filledLocations.length < 2) {
      setError('Please enter at least a starting location and destination')
      return
    }

    if (!dateRange) {
      setError('Please select travel dates')
      return
    }

    // Check authentication - save form data before showing modal
    if (!isAuthenticated) {
      // Save form data to localStorage
      savePlanningFormData({
        locations: filledLocations.map(loc => ({
          value: loc.value,
          label: loc.resolvedName || loc.value,
          coordinates: loc.latitude && loc.longitude
            ? { lat: loc.latitude, lng: loc.longitude }
            : undefined
        })),
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        proMode,
        preferences: {
          budget: formData.budget,
          interests: formData.interests.split(',').map(i => i.trim())
        }
      })

      toast.success('Your trip details have been saved!')
      setShowPlanningAuthModal(true)
      return
    }

    setLoading(true)
    setError(null)
    setPlan(null)

    try {
      // Send all locations including stops
      const from = filledLocations[0].value
      const to = filledLocations[filledLocations.length - 1].value
      const stops = filledLocations.slice(1, -1).map(loc => loc.value) // Middle locations

      const requestBody: any = {
        from,
        to,
        stops, // Include all middle stops
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
        interests: formData.interests.split(',').map(i => i.trim()),
        budget: formData.budget,
        transportMode, // Include transport mode
        proMode // Include pro mode flag
      }

      // Only include travel pace if user specified it
      if (travelHoursPerDay !== null) {
        requestBody.maxTravelHoursPerDay = travelHoursPerDay
      }

      console.log('🚀 Sending request to API:', requestBody)

      const response = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(requestBody)
      })

      console.log('📡 API Response status:', response.status)

      const data = await response.json()
      console.log('📦 API Response data:', data)

      if (data.success) {
        setPlan(data.data)
        setResolvedLocations(data.resolvedLocations || [])
        setLocationImages(data.locationImages || {})

        // Extract location coordinates from the plan
        const coords: Record<string, { latitude: number; longitude: number }> = {}
        if (data.data?.days) {
          for (const day of data.data.days) {
            // Check for coordinates in locationMetadata (new format)
            if (day.location && day.locationMetadata?.latitude && day.locationMetadata?.longitude) {
              coords[day.location] = {
                latitude: day.locationMetadata.latitude,
                longitude: day.locationMetadata.longitude
              }
              console.log(`📍 Extracted coordinates for ${day.location}:`, coords[day.location])
            }
            // Fallback to old format (direct on day object)
            else if (day.location && day.latitude && day.longitude) {
              coords[day.location] = {
                latitude: day.latitude,
                longitude: day.longitude
              }
              console.log(`📍 Extracted coordinates (legacy) for ${day.location}:`, coords[day.location])
            }
            // If no coordinates, try to fetch them from the API
            else if (day.location) {
              console.warn(`⚠️  No coordinates in plan for: ${day.location}, fetching from API...`)
              try {
                const response = await fetch(`/api/locations/search?q=${encodeURIComponent(day.location)}&limit=1`)
                const searchData = await response.json()
                if (searchData.success && searchData.data.length > 0) {
                  const location = searchData.data[0]
                  coords[day.location] = {
                    latitude: location.latitude,
                    longitude: location.longitude
                  }
                  console.log(`✅ Fetched coordinates for ${day.location}:`, coords[day.location])
                } else {
                  console.error(`❌ Could not find coordinates for: ${day.location}`)
                }
              } catch (error) {
                console.error(`❌ Error fetching coordinates for ${day.location}:`, error)
              }
            }
          }
        }
        console.log('📍 Final location coordinates:', coords)
        console.log('📍 Total locations with coordinates:', Object.keys(coords).length)
        setLocationCoordinates(coords)
      } else {
        // Show helpful error message
        let errorMsg = data.error || 'Failed to generate plan'
        if (errorMsg.includes('not found')) {
          errorMsg += '. Please use the autocomplete dropdown to select a valid location.'
        }
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Error generating plan:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop: Side-by-side layout, Mobile: Stacked - Centered with more right margin */}
      <div className="max-w-6xl mx-auto p-6 lg:pl-12 lg:pr-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          {/* Left: Form */}
          <div>
            {/* Header - Mobile-Optimized Hero Section */}
            <div className="mb-6">
              {/* Mobile: Stacked Layout */}
              <div className="lg:hidden">
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Plan your trip
                </h1>

                {/* Planner Plus Toggle Card */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">Planner Plus</span>
                        <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded-full">
                          BETA
                        </span>
                        <div className="group relative">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <div className="font-semibold mb-1">✨ Plus Benefits:</div>
                            <ul className="space-y-1 text-gray-300">
                              <li>• Advanced AI reasoning model</li>
                              <li>• Detailed route optimization</li>
                              <li>• Better activity suggestions</li>
                              <li>• Enhanced travel times</li>
                            </ul>
                            <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
                              Takes 10-15s longer to generate
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {proMode ? 'Advanced AI planning enabled' : 'Get smarter recommendations'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProMode(!proMode)}
                      className={`
                        relative w-12 h-7 rounded-full transition-colors flex-shrink-0
                        ${proMode ? 'bg-purple-500' : 'bg-gray-300'}
                      `}
                      aria-label={proMode ? 'Disable Planner Plus' : 'Enable Planner Plus'}
                    >
                      <div className={`
                        absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform
                        ${proMode ? 'translate-x-6' : 'translate-x-1'}
                      `} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop: Original Horizontal Layout */}
              <div className="hidden lg:flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold">Plan your trip</h1>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    proMode
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {proMode ? 'Plus' : 'Basic'}
                  </span>
                </div>

                {/* Planner Plus BETA Toggle */}
                <div className="flex items-center gap-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Planner Plus</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                      BETA
                    </span>
                    <div className="group relative">
                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <div className="font-semibold mb-1">✨ Plus Benefits:</div>
                        <ul className="space-y-1 text-gray-300">
                          <li>• Advanced AI reasoning model</li>
                          <li>• Detailed route optimization</li>
                          <li>• Better activity suggestions</li>
                          <li>• Enhanced travel times</li>
                        </ul>
                        <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
                          Takes 10-15s longer to generate
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProMode(!proMode)}
                    className={`
                      relative w-11 h-6 rounded-full transition-colors
                      ${proMode ? 'bg-purple-500' : 'bg-gray-300'}
                    `}
                  >
                    <div className={`
                      absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform
                      ${proMode ? 'translate-x-5' : 'translate-x-0.5'}
                    `} />
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message - Above form */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Form - Separated Sections */}
            <div className="space-y-4 mb-6 pb-24">
        {/* Where to? */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Where to?</h3>
            {totalDistance && (
              <span className="text-sm text-gray-400 font-normal">
                {Math.round(totalDistance)} km · {Math.round(totalDistance * 0.621371)} mi
              </span>
            )}
          </div>
          <div className="relative">
            <LocationInput
              locations={locations}
              onChange={setLocations}
            />
          </div>
        </div>

        {/* Dates - Full Width */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="text-base font-semibold mb-3">Dates</h3>
          <DateRangePicker
            startDate={dateRange?.startDate}
            endDate={dateRange?.endDate}
            onSelect={setDateRange}
          />
        </div>

        {/* Advanced Settings Button */}
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(true)}
          className="w-full bg-white rounded-2xl shadow-sm border p-5 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold mb-2">Advanced Settings</h3>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {/* Transport Mode */}
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  {transportMode === 'car' && '🚗 Car'}
                  {transportMode === 'flight' && '✈️ Flight'}
                  {transportMode === 'train' && '🚂 Train'}
                  {transportMode === 'bike' && '🚴 Bike'}
                  {transportMode === 'bus' && '🚌 Bus'}
                  {transportMode === 'mixed' && '🔄 Mixed'}
                </span>

                {/* Budget */}
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  {formData.budget === 'budget' && '💰 Budget-friendly'}
                  {formData.budget === 'moderate' && '💵 Moderate'}
                  {formData.budget === 'luxury' && '💎 Luxury'}
                </span>

                {/* Interests - show first 2 */}
                {formData.interests && formData.interests.trim() && (
                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                    {formData.interests.split(',').slice(0, 2).map(i => i.trim()).join(', ')}
                    {formData.interests.split(',').length > 2 && '...'}
                  </span>
                )}

                {/* Travel Pace */}
                {travelHoursPerDay && (
                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                    ⏱️ {travelHoursPerDay}h/day
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
          </div>
        </button>

            </div>

            {/* Floating Sticky CTA Button - Mobile Safe Area Aware + Bottom Nav Bar */}
            <div
              className="fixed left-0 lg:left-auto lg:right-[42%] z-40 px-6 pointer-events-none transition-all duration-300 ease-out"
              style={{
                // Desktop: use ctaBottomOffset
                // Mobile: add 64px (bottom nav height) + safe area
                bottom: `max(${ctaBottomOffset}px, calc(64px + env(safe-area-inset-bottom)))`,
              }}
            >
              <div className="max-w-[800px] lg:max-w-[500px] mx-auto">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200 py-4 pl-6 pr-6 pointer-events-auto flex items-center justify-between gap-4">
                  {/* Secondary Gray CTA */}
                  <Button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    variant="outline"
                    className="px-6 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl font-medium"
                  >
                    Back to Top
                  </Button>

                  {/* Primary Red CTA */}
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !isFormValid()}
                    className="bg-rausch-500 hover:bg-rausch-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating your plan...
                      </span>
                    ) : (
                      'Generate plan'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Map Panel (Desktop only, sticky, always visible) - Aligned with form */}
          <div className="hidden lg:block">
            {/* Match the header height (mb-6) to align map with "Where to?" box */}
            <div className="h-[60px]"></div>
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden relative h-[600px]">
                {/* Loading overlay */}
                {isLoadingCoordinates && (
                  <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-600">Updating...</span>
                  </div>
                )}

                {/* Map container - always shows world view or locations */}
                <div ref={mapContainer} className="w-full h-full" />

                {/* Overlay hint when no locations */}
                {mapLocations.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg px-6 py-4 text-center">
                      <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">
                        Add locations to see your route
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Modal */}
      <LoadingModal isOpen={loading} />

      {/* Plan Modal */}
      {plan && dateRange && (
        <PlanModal
          plan={plan}
          onClose={() => setPlan(null)}
          locationImages={locationImages}
          transportMode={transportMode}
          proMode={proMode}
          totalDistance={totalDistance || undefined}
          locationCoordinates={locationCoordinates}
          startDate={dateRange.startDate.toISOString().split('T')[0]}
          endDate={dateRange.endDate.toISOString().split('T')[0]}
          interests={formData.interests.split(',').map(i => i.trim()).filter(i => i)}
          budget={formData.budget}
        />
      )}

      {/* Advanced Settings Modal */}
      {showAdvancedSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAdvancedSettings(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Advanced Settings</h2>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Interests */}
              <div>
                <h3 className="text-base font-semibold mb-3">Interests</h3>
                <Input
                  id="interests"
                  placeholder="art, food, history"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  className="border-gray-300 focus:border-black focus:ring-black"
                />
                <p className="text-xs text-gray-500 mt-2">Separate multiple interests with commas</p>
              </div>

              {/* Budget */}
              <div>
                <h3 className="text-base font-semibold mb-3">Budget</h3>
                <select
                  id="budget"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                >
                  <option value="budget">Budget-friendly</option>
                  <option value="moderate">Moderate</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              {/* Travel Pace */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold">Travel Pace</h3>
                  <button
                    type="button"
                    onClick={() => setShowTravelPace(!showTravelPace)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {showTravelPace ? 'Hide' : 'Optional'}
                    {showTravelPace ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </div>
                {showTravelPace ? (
                  <TravelTimeSlider
                    value={travelHoursPerDay || 5}
                    onChange={setTravelHoursPerDay}
                  />
                ) : (
                  <div className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500">
                    Click "Optional" to set
                  </div>
                )}
              </div>

              {/* Transport Mode */}
              <div>
                <h3 className="text-base font-semibold mb-3">Transport Mode</h3>
                <TransportModeSelector
                  value={transportMode}
                  onChange={setTransportMode}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <Button
                onClick={() => setShowAdvancedSettings(false)}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Planning Auth Modal - Reusing SignInModal with custom hero */}
      <SignInModal
        isOpen={showPlanningAuthModal}
        onClose={(userSignedIn) => {
          setShowPlanningAuthModal(false)
          if (userSignedIn) {
            // Form data will be restored by the useEffect on mount
            // Trigger generation after a short delay to allow state to update
            setTimeout(() => {
              handleGenerate()
            }, 500)
          }
        }}
        redirectTo="/plan"
        heroContent={{
          title: "Your Trip Plan is Waiting!",
          subtitle: "Sign in to unlock AI-powered itinerary generation and save your perfect trip.",
          features: [
            {
              icon: <Shield className="h-5 w-5" />,
              title: "Your Input is Saved",
              description: "We've saved your locations and dates - you won't lose anything!"
            },
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: "15 Free Credits",
              description: "New users get 10 regular plans + 5 pro mode AI generations and 2 manual trip plans for free"
            }
          ]
        }}
      />
    </div>
  )
}

