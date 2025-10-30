'use client'

/**
 * Scenic Route Options Demo Page
 * 
 * 🎯 PURPOSE: Show users route options using V2 planner's TripOverviewMap
 * 
 * FEATURES:
 * - Clean route options pills: Fastest, Shortest, Scenic, Longest
 * - Interactive map with route visualization
 * - Simple destination selection
 */

import { useState, useMemo } from 'react'
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'
import { MapPin } from 'lucide-react'

const DESTINATIONS = [
  // North America
  { name: 'Vancouver', country: 'Canada', latitude: 49.2827, longitude: -123.1207, emoji: '🏔️' },
  { name: 'Banff', country: 'Canada', latitude: 51.1784, longitude: -115.5708, emoji: '⛰️' },
  { name: 'Toronto', country: 'Canada', latitude: 43.6532, longitude: -79.3832, emoji: '🏙️' },
  { name: 'San Francisco', country: 'USA', latitude: 37.7749, longitude: -122.4194, emoji: '🌉' },
  { name: 'Los Angeles', country: 'USA', latitude: 34.0522, longitude: -118.2437, emoji: '🎬' },
  { name: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060, emoji: '🗽' },
  { name: 'Seattle', country: 'USA', latitude: 47.6062, longitude: -122.3321, emoji: '☕' },
  { name: 'Chicago', country: 'USA', latitude: 41.8781, longitude: -87.6298, emoji: '🌆' },
]

export default function ScenicOptionsPage() {
  const [startLocation, setStartLocation] = useState<typeof DESTINATIONS[0] | null>(null)
  const [endLocation, setEndLocation] = useState<typeof DESTINATIONS[0] | null>(null)
  const [routeKey, setRouteKey] = useState(0) // Force route recalculation

  const handleDestinationClick = (destination: typeof DESTINATIONS[0]) => {
    if (!startLocation) {
      setStartLocation(destination)
    } else if (!endLocation && destination.name !== startLocation.name) {
      setEndLocation(destination)
      setRouteKey(prev => prev + 1) // Force fresh route calculation
    } else {
      // Reset and start over
      setStartLocation(destination)
      setEndLocation(null)
      setRouteKey(prev => prev + 1)
    }
  }

  const handleRefreshRoute = () => {
    setRouteKey(prev => prev + 1) // Force fresh route calculation
  }

  // Prepare locations for TripOverviewMap
  const mapLocations = useMemo(() => {
    if (!startLocation || !endLocation) return []
    return [
      {
        name: startLocation.name,
        latitude: startLocation.latitude,
        longitude: startLocation.longitude
      },
      {
        name: endLocation.name,
        latitude: endLocation.latitude,
        longitude: endLocation.longitude
      }
    ]
  }, [startLocation, endLocation])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Route Options Demo</h1>
          <p className="mt-1 text-sm text-gray-600">
            Select two destinations to see route options with the V2 planner map
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Destination Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Destinations</h2>
              
              {/* Selected Locations */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-700">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">From</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {startLocation ? `${startLocation.emoji} ${startLocation.name}` : 'Select start'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-medium text-red-700">
                    B
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">To</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {endLocation ? `${endLocation.emoji} ${endLocation.name}` : 'Select destination'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination Grid */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Available Destinations
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {DESTINATIONS.map((dest) => {
                    const isStart = startLocation?.name === dest.name
                    const isEnd = endLocation?.name === dest.name
                    const isSelected = isStart || isEnd

                    return (
                      <button
                        key={dest.name}
                        onClick={() => handleDestinationClick(dest)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg border transition-all text-sm
                          ${isSelected
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{dest.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{dest.name}</div>
                            <div className="text-xs text-gray-500">{dest.country}</div>
                          </div>
                          {isStart && (
                            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                              Start
                            </span>
                          )}
                          {isEnd && (
                            <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded">
                              End
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Map with Route Options */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {mapLocations.length === 2 ? (
                <div className="relative">
                  <TripOverviewMap
                    key={routeKey} // Force fresh route calculation
                    locations={mapLocations}
                    transportMode="car"
                    className="w-full h-[700px]"
                    showElevation={false}
                    showProviderBadge={true}
                    showRouteOptions={true}
                  />
                  {/* Refresh button */}
                  <button
                    onClick={handleRefreshRoute}
                    className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm text-xs font-medium text-gray-700 hover:bg-white transition-colors"
                    title="Refresh route (bust cache)"
                  >
                    🔄 Refresh Route
                  </button>
                </div>
              ) : (
                <div className="w-full h-[700px] flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Select two destinations to see route options</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose a start and end location from the list
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

