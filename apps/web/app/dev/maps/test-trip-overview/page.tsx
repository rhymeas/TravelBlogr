"use client"

import { useMemo, useState } from 'react'
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'

export default function TestTripOverviewMapPage() {
  const [highlightedIndex, setHighlightedIndex] = useState<number | undefined>(0)

  // Simple 4-point demo across US Southwest to reproduce issues quickly
  const locations = useMemo(() => ([
    { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903 },
    { name: 'Grand Junction, CO', latitude: 39.0639, longitude: -108.5506 },
    { name: 'Flagstaff, AZ', latitude: 35.1983, longitude: -111.6513 },
    { name: 'Phoenix, AZ', latitude: 33.4484, longitude: -112.0740 },
  ]), [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-semibold">Test: TripOverviewMap</h1>
      <p className="text-sm text-gray-600">Use the controls below to change highlightedIndex and observe marker behavior. This page is for debugging the top-left marker issue.</p>

      <div className="flex items-center gap-3">
        <button
          className="px-3 py-1.5 rounded-md border text-sm"
          onClick={() => setHighlightedIndex((prev) => {
            const next = (prev ?? -1) - 1
            return next < 0 ? locations.length - 1 : next
          })}
        >Prev</button>
        <div className="text-sm text-gray-700">highlightedIndex: {highlightedIndex ?? 'none'}</div>
        <button
          className="px-3 py-1.5 rounded-md border text-sm"
          onClick={() => setHighlightedIndex((prev) => {
            const next = (prev ?? -1) + 1
            return next >= locations.length ? 0 : next
          })}
        >Next</button>
        <button
          className="px-3 py-1.5 rounded-md border text-sm"
          onClick={() => setHighlightedIndex(undefined)}
        >Clear highlight</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold">Complete Route (Debug)</div>
        <TripOverviewMap
          locations={locations}
          transportMode="car"
          highlightedIndex={highlightedIndex}
          className="w-full h-[520px]"
        />
      </div>
    </div>
  )
}

