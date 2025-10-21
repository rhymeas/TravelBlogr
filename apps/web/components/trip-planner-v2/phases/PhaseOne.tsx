'use client'

/**
 * Phase 1: Journey Foundation
 * Establish the basic framework of the trip
 */

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Navigation, Map, Mountain, Bike } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LocationInput } from '@/components/itinerary/LocationInput'
import { DateRangePicker } from '@/components/itinerary/DateRangePicker'
import type { PhaseProps, TripType, Destination } from '../types'
import type { LucideIcon } from 'lucide-react'

const TRIP_TYPES: { id: TripType; label: string; icon: LucideIcon; description: string }[] = [
  {
    id: 'specific',
    label: 'Single Destination',
    icon: MapPin,
    description: 'City trip or resort'
  },
  {
    id: 'journey',
    label: 'Point A to B',
    icon: Navigation,
    description: 'Travel with stops'
  },
  {
    id: 'multi-destination',
    label: 'Multi-Destination',
    icon: Map,
    description: 'Multiple cities'
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: Mountain,
    description: 'Hiking or road trip'
  },
  {
    id: 'bike',
    label: 'Bike Trip',
    icon: Bike,
    description: 'Cycling adventure'
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
    <div className="space-y-2.5">
      {/* Header - Larger titles */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Where are you going?</h2>
        <p className="text-xs text-gray-600 mt-0.5">Start with your journey basics</p>
      </div>

      {/* Destinations - Compact */}
      <div>
        <LocationInput
          locations={locations}
          onChange={setLocations}
        />
      </div>

      {/* Trip Type - Larger buttons with green selection */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">Trip Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {TRIP_TYPES.map((type) => {
            const IconComponent = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setSelectedTripType(type.id)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedTripType === type.id
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selectedTripType === type.id ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${
                      selectedTripType === type.id ? 'text-green-700' : 'text-gray-700'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-xs leading-tight truncate">{type.label}</div>
                    <div className="text-[9px] text-gray-600 leading-tight truncate">{type.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dates - White Background */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          Travel Dates
        </h3>
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
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

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={dateRange.flexible}
                onChange={(e) => setDateRange({ ...dateRange, flexible: e.target.checked })}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 transition-all"
                style={{
                  accentColor: 'var(--color-primary)',
                  '--tw-ring-color': 'var(--color-primary)'
                } as React.CSSProperties}
              />
              Flexible ±3 days
            </label>

            <Button
              onClick={handleNext}
              className="px-6 py-2.5 text-white text-sm rounded-lg hover:shadow-lg font-semibold whitespace-nowrap transition-all"
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

