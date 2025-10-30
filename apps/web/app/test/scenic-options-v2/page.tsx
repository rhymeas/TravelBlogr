'use client'

/**
 * Test page for scenic route options using TripOverviewMap from /plan v2
 */

import { useState } from 'react'
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'

// Sample destinations for testing
const DESTINATIONS = [
  { id: 'vancouver', name: 'Vancouver', country: 'Canada', emoji: '🏔️', lat: 49.2827, lng: -123.1207 },
  { id: 'banff', name: 'Banff', country: 'Canada', emoji: '⛰️', lat: 51.1784, lng: -115.5708 },
  { id: 'toronto', name: 'Toronto', country: 'Canada', emoji: '🏙️', lat: 43.6532, lng: -79.3832 },
  { id: 'san-francisco', name: 'San Francisco', country: 'USA', emoji: '🌉', lat: 37.7749, lng: -122.4194 },
  { id: 'los-angeles', name: 'Los Angeles', country: 'USA', emoji: '🎬', lat: 34.0522, lng: -118.2437 },
  { id: 'new-york', name: 'New York', country: 'USA', emoji: '🗽', lat: 40.7128, lng: -74.0060 },
  { id: 'miami', name: 'Miami', country: 'USA', emoji: '🏖️', lat: 25.7617, lng: -80.1918 },
  { id: 'las-vegas', name: 'Las Vegas', country: 'USA', emoji: '🎰', lat: 36.1699, lng: -115.1398 },
  { id: 'seattle', name: 'Seattle', country: 'USA', emoji: '☕', lat: 47.6062, lng: -122.3321 },
  { id: 'chicago', name: 'Chicago', country: 'USA', emoji: '🌆', lat: 41.8781, lng: -87.6298 },
  { id: 'london', name: 'London', country: 'UK', emoji: '🎡', lat: 51.5074, lng: -0.1278 },
  { id: 'paris', name: 'Paris', country: 'France', emoji: '🗼', lat: 48.8566, lng: 2.3522 },
  { id: 'rome', name: 'Rome', country: 'Italy', emoji: '🏛️', lat: 41.9028, lng: 12.4964 },
  { id: 'barcelona', name: 'Barcelona', country: 'Spain', emoji: '🏖️', lat: 41.3851, lng: 2.1734 },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', emoji: '🚲', lat: 52.3676, lng: 4.9041 },
  { id: 'berlin', name: 'Berlin', country: 'Germany', emoji: '🧱', lat: 52.5200, lng: 13.4050 },
  { id: 'prague', name: 'Prague', country: 'Czech Republic', emoji: '🏰', lat: 50.0755, lng: 14.4378 },
  { id: 'vienna', name: 'Vienna', country: 'Austria', emoji: '🎻', lat: 48.2082, lng: 16.3738 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', emoji: '🗾', lat: 35.6762, lng: 139.6503 },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', emoji: '⛩️', lat: 35.0116, lng: 135.7681 },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', emoji: '🏯', lat: 37.5665, lng: 126.9780 },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', emoji: '🛕', lat: 13.7563, lng: 100.5018 },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', emoji: '🦁', lat: 1.3521, lng: 103.8198 },
  { id: 'dubai', name: 'Dubai', country: 'UAE', emoji: '🏜️', lat: 25.2048, lng: 55.2708 },
  { id: 'bali', name: 'Bali', country: 'Indonesia', emoji: '🌺', lat: -8.3405, lng: 115.0920 },
  { id: 'sydney', name: 'Sydney', country: 'Australia', emoji: '🦘', lat: -33.8688, lng: 151.2093 },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia', emoji: '🏏', lat: -37.8136, lng: 144.9631 },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', emoji: '🥝', lat: -36.8485, lng: 174.7633 },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', emoji: '🏖️', lat: -22.9068, lng: -43.1729 },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', emoji: '💃', lat: -34.6037, lng: -58.3816 },
  { id: 'lima', name: 'Lima', country: 'Peru', emoji: '🦙', lat: -12.0464, lng: -77.0428 },
  { id: 'cape-town', name: 'Cape Town', country: 'South Africa', emoji: '🦁', lat: -33.9249, lng: 18.4241 },
  { id: 'marrakech', name: 'Marrakech', country: 'Morocco', emoji: '🕌', lat: 31.6295, lng: -7.9811 }
]

export default function ScenicOptionsV2Page() {
  const [from, setFrom] = useState<typeof DESTINATIONS[0] | null>(null)
  const [to, setTo] = useState<typeof DESTINATIONS[0] | null>(null)

  const handleDestinationClick = (dest: typeof DESTINATIONS[0]) => {
    if (!from) {
      setFrom(dest)
      setTo(null)
    } else if (!to) {
      setTo(dest)
    } else {
      // Reset and start over
      setFrom(dest)
      setTo(null)
    }
  }

  const handleReset = () => {
    setFrom(null)
    setTo(null)
  }

  // Convert selected destinations to locations array for TripOverviewMap
  const locations = []
  if (from) {
    locations.push({
      name: from.name,
      latitude: from.lat,
      longitude: from.lng
    })
  }
  if (to) {
    locations.push({
      name: to.name,
      latitude: to.lat,
      longitude: to.lng
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✈️ Scenic Route Explorer V2</h1>
          <p className="text-gray-600">
            {!from && 'Click any destination to start planning your journey'}
            {from && !to && `Now select your destination from ${from.name}`}
            {from && to && `Exploring routes from ${from.name} to ${to.name}`}
          </p>
        </div>

        {/* Selection Status */}
        {(from || to) && (
          <div className="mb-6 flex items-center justify-center gap-4">
            {from && (
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-gray-200">
                <span className="text-2xl">{from.emoji}</span>
                <div>
                  <div className="text-xs text-gray-500">From</div>
                  <div className="font-semibold text-gray-900">{from.name}</div>
                </div>
              </div>
            )}

            {from && to && (
              <div className="text-gray-400">→</div>
            )}

            {to && (
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-gray-200">
                <span className="text-2xl">{to.emoji}</span>
                <div>
                  <div className="text-xs text-gray-500">To</div>
                  <div className="font-semibold text-gray-900">{to.name}</div>
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-200 transition-colors"
            >
              ✕ Reset
            </button>
          </div>
        )}

        {/* Destinations Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🌍 Popular Destinations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {DESTINATIONS.map((dest) => {
              const isFrom = from?.id === dest.id
              const isTo = to?.id === dest.id
              const isActive = isFrom || isTo

              return (
                <button
                  key={dest.id}
                  onClick={() => handleDestinationClick(dest)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{dest.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{dest.name}</div>
                      <div className="text-xs text-gray-600 truncate">{dest.country}</div>
                    </div>
                    {isFrom && <div className="text-xs font-semibold text-blue-600">Start</div>}
                    {isTo && <div className="text-xs font-semibold text-blue-600">End</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Route Options Map - Using TripOverviewMap from /plan v2 */}
        {locations.length >= 2 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <TripOverviewMap
              locations={locations}
              transportMode="car"
              className="w-full h-[600px]"
              showElevation={false}
              showProviderBadge={false}
              showRouteOptions={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

