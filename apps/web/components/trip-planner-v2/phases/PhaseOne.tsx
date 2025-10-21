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
    <div className="space-y-4">
      {/* Header - More compact */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-0.5">Where are you thinking of going?</h2>
        <p className="text-xs text-gray-600">Let's start with the basics of your journey</p>
      </div>

      {/* Destinations - Using V1 LocationInput with drag-and-drop */}
      <div>
        <LocationInput
          locations={locations}
          onChange={setLocations}
        />
      </div>

      {/* Trip Type - More compact */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">What kind of trip are you planning?</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TRIP_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTripType(type.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedTripType === type.id
                  ? 'border-[#2C5F6F] bg-[#2C5F6F]/5 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="text-2xl">{type.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-xs">{type.label}</div>
                  <div className="text-[10px] text-gray-600 leading-tight">{type.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dates - More compact */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#2C5F6F]" />
          When are you traveling?
        </h3>

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

        <label className="flex items-center gap-1.5 text-[10px] text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={dateRange.flexible}
            onChange={(e) => setDateRange({ ...dateRange, flexible: e.target.checked })}
            className="w-3 h-3 text-[#2C5F6F] border-gray-300 rounded focus:ring-[#2C5F6F]"
          />
          My dates are flexible (±3 days)
        </label>
      </div>

      {/* Navigation - More compact */}
      <div className="flex justify-end pt-3 border-t border-gray-200">
        <Button
          onClick={handleNext}
          className="px-5 py-1.5 bg-[#2C5F6F] text-white text-xs rounded-lg hover:bg-[#1e4a56] font-semibold"
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

