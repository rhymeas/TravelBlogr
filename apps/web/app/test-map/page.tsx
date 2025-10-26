'use client'

export const dynamic = 'force-dynamic'


import { useState } from 'react'
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'

const TEST_LOCATIONS = [
  { name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Lyon', latitude: 45.764, longitude: 4.8357 },
  { name: 'Marseille', latitude: 43.2965, longitude: 5.3698 },
  { name: 'Nice', latitude: 43.7102, longitude: 7.2620 },
  { name: 'Toulouse', latitude: 43.6047, longitude: 1.4442 }
]

export default function TestMapPage() {
  const [highlightedIndex, setHighlightedIndex] = useState<number | undefined>(0)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Map Highlighter Test Page</h1>
          <p className="text-sm text-gray-600 mb-4">
            Click on a day to highlight the corresponding marker on the map. The marker should stay at the correct location.
          </p>

          {/* Day Selector */}
          <div className="flex gap-2 mb-6">
            {TEST_LOCATIONS.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => setHighlightedIndex(idx)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  highlightedIndex === idx
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Day {idx + 1}: {loc.name}
              </button>
            ))}
            <button
              onClick={() => setHighlightedIndex(undefined)}
              className="px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            >
              Clear
            </button>
          </div>

          {/* Debug Info */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Debug Info:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Highlighted Index: {highlightedIndex !== undefined ? highlightedIndex : 'None'}</div>
              <div>Highlighted Location: {highlightedIndex !== undefined ? TEST_LOCATIONS[highlightedIndex].name : 'None'}</div>
              <div>Total Locations: {TEST_LOCATIONS.length}</div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Route Map</h2>
          <TripOverviewMap
            locations={TEST_LOCATIONS}
            transportMode="car"
            className="w-full h-[600px]"
            highlightedIndex={highlightedIndex}
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Click on different "Day X" buttons above</li>
            <li>Watch the map - the highlighted marker should:
              <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                <li>Stay at the correct location (not jump to top-left corner)</li>
                <li>Pulse with animation</li>
                <li>Be larger and emerald-colored</li>
                <li>Trigger a smooth fly-to animation</li>
              </ul>
            </li>
            <li>Check browser console for any errors</li>
            <li>Try clicking rapidly between different days</li>
            <li>Click "Clear" to remove highlighting</li>
          </ol>
        </div>

        {/* Expected vs Actual */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ Expected Behavior:</h3>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>Marker stays at location coordinates</li>
              <li>Smooth size/color transition</li>
              <li>Map flies to highlighted location</li>
              <li>No console errors</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="font-semibold text-red-900 mb-2">❌ Bug Symptoms:</h3>
            <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
              <li>Marker jumps to top-left corner (0,0)</li>
              <li>Marker position breaks after className change</li>
              <li>MapLibre transform/position lost</li>
              <li>Console shows positioning errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

