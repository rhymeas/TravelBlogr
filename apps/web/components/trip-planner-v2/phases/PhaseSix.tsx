'use client'

/**
 * Phase 6: Route Intelligence (Conditional)
 * For journey-based trips (Point A to B or multi-destination)
 */

import { useState } from 'react'
import { Route, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PhaseProps, WaypointStrategy } from '../types'

const WAYPOINT_STRATEGIES: { id: WaypointStrategy; label: string; icon: string; description: string }[] = [
  {
    id: 'direct',
    label: 'Direct route',
    icon: '🎯',
    description: 'Fastest path, minimal stops'
  },
  {
    id: 'suggested',
    label: 'Suggested highlights',
    icon: '🗺️',
    description: 'We recommend points of interest'
  },
  {
    id: 'custom',
    label: 'Custom waypoints',
    icon: '✏️',
    description: 'You add specific stops'
  },
  {
    id: 'scenic',
    label: 'Scenic detours',
    icon: '🌟',
    description: 'Prioritize beautiful routes'
  }
]

const STOP_TYPES = [
  { id: 'historic', label: 'Historic sites', icon: '🏛️' },
  { id: 'natural', label: 'Natural landmarks', icon: '🏞️' },
  { id: 'food', label: 'Local food experiences', icon: '🍽️' },
  { id: 'cultural', label: 'Cultural attractions', icon: '🎭' },
  { id: 'photo', label: 'Photo opportunities', icon: '📸' },
  { id: 'rest', label: 'Rest/comfort breaks', icon: '☕' }
]

const STOP_DURATIONS = [
  { id: 'quick', label: 'Quick breaks', duration: '15-30 min' },
  { id: 'short', label: 'Short visits', duration: '1-2 hours' },
  { id: 'half-day', label: 'Half-day experiences', duration: '3-4 hours' },
  { id: 'overnight', label: 'Overnight stays', duration: 'Full day+' }
]

export function PhaseSix({ data, updateData, onNext, onBack }: PhaseProps) {
  // Skip this phase if trip type is 'specific' (single destination)
  const shouldSkip = data.tripType === 'specific'

  const [selectedStrategy, setSelectedStrategy] = useState<WaypointStrategy | null>(
    data.waypointStrategy || null
  )
  const [selectedStopTypes, setSelectedStopTypes] = useState<string[]>(data.stopPreferences || [])
  const [selectedDuration, setSelectedDuration] = useState(data.flexibleScheduling?.endTimePreference || 'short')
  const [bufferTime, setBufferTime] = useState(data.flexibleScheduling?.bufferTime || false)

  const toggleStopType = (type: string) => {
    setSelectedStopTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleNext = () => {
    if (shouldSkip) {
      // Skip to generation
      onNext()
      return
    }

    if (!selectedStrategy) {
      alert('Please select a waypoint strategy')
      return
    }

    if (selectedStrategy !== 'direct' && selectedStopTypes.length === 0) {
      alert('Please select at least one type of stop you\'re interested in')
      return
    }

    updateData({
      waypointStrategy: selectedStrategy,
      stopPreferences: selectedStopTypes,
      flexibleScheduling: {
        bufferTime,
        endTimePreference: selectedDuration
      }
    })

    onNext()
  }

  if (shouldSkip) {
    // Auto-skip to next phase
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Single Destination Trip</h2>
          <p className="text-gray-600 mb-6">
            Route planning is not needed for single destination trips.
          </p>
          <Button
            onClick={handleNext}
            className="px-8 py-3 bg-[#2C5F6F] text-white rounded-lg hover:bg-[#1e4a56] font-semibold"
          >
            Generate Trip Plan →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">How do you want to approach your route?</h2>
        <p className="text-gray-600">Let's plan the stops and waypoints along your journey</p>
      </div>

      {/* Waypoint Strategy */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Route className="w-5 h-5 text-[#2C5F6F]" />
          Route Strategy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WAYPOINT_STRATEGIES.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedStrategy === strategy.id
                  ? 'border-[#2C5F6F] bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{strategy.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{strategy.label}</div>
                  <div className="text-sm text-gray-600">{strategy.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stop Preferences (if not direct route) */}
      {selectedStrategy && selectedStrategy !== 'direct' && (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2C5F6F]" />
              What types of stops interest you?
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {STOP_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleStopType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedStopTypes.includes(type.id)
                      ? 'border-[#2C5F6F] bg-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2C5F6F]" />
              Preferred Stop Duration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STOP_DURATIONS.map((duration) => (
                <button
                  key={duration.id}
                  onClick={() => setSelectedDuration(duration.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedDuration === duration.id
                      ? 'border-[#2C5F6F] bg-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">{duration.label}</div>
                  <div className="text-sm text-gray-600">{duration.duration}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={bufferTime}
                onChange={(e) => setBufferTime(e.target.checked)}
                className="w-4 h-4 text-[#2C5F6F] border-gray-300 rounded focus:ring-emerald-500"
              />
              <div>
                <div className="font-medium text-gray-900">Include buffer time for spontaneity</div>
                <div className="text-sm text-gray-600">Add extra time for unexpected discoveries</div>
              </div>
            </label>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6 py-3"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg font-semibold"
        >
          Generate Trip Plan →
        </Button>
      </div>
    </div>
  )
}

