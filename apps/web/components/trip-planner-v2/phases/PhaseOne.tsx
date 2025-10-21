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
      {/* Compact Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Where are you going?</h2>
        <p className="text-xs text-gray-600">Start with your journey basics</p>
      </div>

      {/* Destinations - Compact */}
      <div>
        <LocationInput
          locations={locations}
          onChange={setLocations}
        />
      </div>

      {/* Trip Type - Compact grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-900">Trip Type</h3>

        <div className="grid grid-cols-2 gap-2">
          {TRIP_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTripType(type.id)}
              className={`p-2.5 rounded-xl border-2 transition-all duration-200 text-left group ${
                selectedTripType === type.id
                  ? 'shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
              }`}
              style={
                selectedTripType === type.id
                  ? {
                      borderColor: 'var(--color-primary)',
                      background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))'
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-2">
                <div className="text-xl group-hover:scale-110 transition-transform duration-200">{type.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-xs truncate">{type.label}</div>
                  <div className="text-[9px] text-gray-600 truncate">{type.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dates + CTA - Ultra compact */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
          Travel Dates
        </h3>

        <div className="space-y-2">
          {/* Date picker */}
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
          
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[10px] text-gray-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={dateRange.flexible}
                onChange={(e) => setDateRange({ ...dateRange, flexible: e.target.checked })}
                className="w-3 h-3 border-gray-300 rounded focus:ring-2 transition-all"
                style={{ 
                  accentColor: 'var(--color-primary)',
                  '--tw-ring-color': 'var(--color-primary)'
                } as React.CSSProperties}
              />
              Flexible ±3 days
            </label>

            {/* CTA - Inline */}
            <Button
              onClick={handleNext}
              className="px-6 py-2 text-white text-xs rounded-lg hover:shadow-xl font-bold whitespace-nowrap transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              Continue →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

