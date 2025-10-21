'use client'

/**
 * Phase 1: Journey Foundation
 * Establish the basic framework of the trip
 */

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LocationInput } from '@/components/itinerary/LocationInput'
import { DateRangePicker } from '@/components/itinerary/DateRangePicker'
import type { PhaseProps, TripType, Destination } from '../types'

const TRIP_TYPES: { id: TripType; label: string; icon: string; description: string }[] = [
  {
    id: 'specific',
    label: 'Single Destination',
    icon: '🎯',
    description: 'City trip, resort stay, or single location'
  },
  {
    id: 'journey',
    label: 'Point A to B Journey',
    icon: '🛣️',
    description: 'Travel from one place to another with stops'
  },
  {
    id: 'multi-destination',
    label: 'Multi-Destination',
    icon: '🗺️',
    description: 'Multiple cities or locations'
  },
  {
    id: 'adventure',
    label: 'Adventure Route',
    icon: '🏕️',
    description: 'Hiking trail, cycling route, or road trip'
  }
]

export function PhaseOne({ data, updateData, onNext }: PhaseProps) {
  // Convert Destination[] to Location[] format for LocationInput
  const [locations, setLocations] = useState(() => {
    if (data.destinations.length > 0) {
      return data.destinations.map(dest => ({
        id: crypto.randomUUID(),
        value: dest.name,
        latitude: dest.latitude,
        longitude: dest.longitude,
        region: dest.region,
        country: dest.country
      }))
    }
    return [
      { id: crypto.randomUUID(), value: '' },
      { id: crypto.randomUUID(), value: '' }
    ]
  })

  const [selectedTripType, setSelectedTripType] = useState<TripType | null>(data.tripType)
  const [dateRange, setDateRange] = useState({
    startDate: data.dateRange?.startDate ? data.dateRange.startDate.toISOString().split('T')[0] : '',
    endDate: data.dateRange?.endDate ? data.dateRange.endDate.toISOString().split('T')[0] : '',
    flexible: data.dateRange?.flexible || false
  })

  // Sync locations back to destinations format
  useEffect(() => {
    const destinations: Destination[] = locations.map((loc, index) => ({
      name: loc.value,
      type: index === 0 ? 'start' : index === locations.length - 1 ? 'end' : 'stop',
      latitude: 'latitude' in loc ? loc.latitude : undefined,
      longitude: 'longitude' in loc ? loc.longitude : undefined,
      region: 'region' in loc ? loc.region : undefined,
      country: 'country' in loc ? loc.country : undefined
    }))
    updateData({ destinations })
  }, [locations])

  const handleNext = () => {
    // Validate
    const filledLocations = locations.filter(loc => loc.value.trim())
    if (filledLocations.length < 2) {
      alert('Please enter at least a starting location and destination')
      return
    }

    if (!selectedTripType) {
      alert('Please select a trip type')
      return
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select travel dates')
      return
    }

    // Update data
    updateData({
      tripType: selectedTripType,
      dateRange: {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate),
        flexible: dateRange.flexible
      }
    })

    onNext()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Plan Your Journey</h2>
        <p className="text-sm text-gray-400 mt-1">Where would you like to go?</p>
      </div>

      {/* Destinations */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Destinations</h3>
        <LocationInput
          locations={locations}
          onChange={setLocations}
        />
      </div>

      {/* Trip Type */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">Trip Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {TRIP_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTripType(type.id)}
              className={`p-4 rounded-xl border transition-all text-left ${
                selectedTripType === type.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{type.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Travel Dates
        </h3>
        <div className="space-y-3">
          <DateRangePicker
            startDate={dateRange.startDate ? new Date(dateRange.startDate) : undefined}
            endDate={dateRange.endDate ? new Date(dateRange.endDate) : undefined}
            onSelect={(range) => {
              if (range) {
                setDateRange({
                  startDate: range.startDate.toISOString().split('T')[0],
                  endDate: range.endDate.toISOString().split('T')[0],
                  flexible: dateRange.flexible
                })
              }
            }}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={dateRange.flexible}
                onChange={(e) => setDateRange({ ...dateRange, flexible: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              Flexible ±3 days
            </label>

            <Button
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-all"
            >
              Continue →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

