'use client'

/**
 * Phase 1: Journey Foundation
 * Establish the basic framework of the trip
 */

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Navigation, Map, Mountain, Bike, Car, Home, Gem, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
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
    id: 'road-trip',
    label: 'Road Trip',
    icon: Car,
    description: 'Flexible scenic driving'
  },
  {
    id: 'bike',
    label: 'Bike Trip',
    icon: Bike,
    description: 'Cycling adventure'
  },
  {
    id: 'family',
    label: 'Family Trip',
    icon: Home,
    description: 'Kid-friendly with downtime'
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: Mountain,
    description: 'Active outdoor experiences'
  },
  {
    id: 'luxury',
    label: 'Luxury Trip',
    icon: Gem,
    description: 'Premium stays & fine dining'
  },
  {
    id: 'city',
    label: 'Cultural/City Trip',
    icon: MapPin,
    description: 'Museums, galleries, neighborhoods'
  },
  {
    id: 'solo',
    label: 'Solo Travel',
    icon: User,
    description: 'Safe, flexible, social options'
  },
  {
    id: 'wellness',
    label: 'Wellness/Retreat',
    icon: Sparkles,
    description: 'Spa, yoga, restorative pace'
  }

]


const QUICK_TYPE_IDS: TripType[] = ['road-trip', 'family', 'adventure']
const QUICK_TYPES = TRIP_TYPES.filter(t => QUICK_TYPE_IDS.includes(t.id))
const OTHER_TYPES = TRIP_TYPES.filter(t => !QUICK_TYPE_IDS.includes(t.id))

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


  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)

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
      {/* Destinations - Compact */}
      <div>
        <LocationInput
          locations={locations}
          onChange={setLocations}
        />
      </div>

      {/* Trip Type - Quick access top 3 + modal for the rest */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">Trip Type</h3>

        {/* Quick access — Vertically swipable on mobile/tablet, grid on desktop */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-2 lg:block hidden">
          {QUICK_TYPES.map((type) => {
            const IconComponent = type.icon
            const selected = selectedTripType === type.id
            return (
              <button
                key={type.id}
                onClick={() => setSelectedTripType(type.id)}
                aria-pressed={selected}
                className={`w-full p-3 rounded-lg border transition-all text-left ${
                  selected
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${selected ? 'text-green-700' : 'text-gray-700'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-xs leading-tight">{type.label}</div>
                    <div className="text-[9px] text-gray-600 leading-tight">{type.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Mobile/Tablet: Vertical swipable scroll */}
        <div className="lg:hidden overflow-y-auto snap-y snap-mandatory max-h-[280px] space-y-2 pr-1 scrollbar-thin">
          {QUICK_TYPES.map((type) => {
            const IconComponent = type.icon
            const selected = selectedTripType === type.id
            return (
              <button
                key={type.id}
                onClick={() => setSelectedTripType(type.id)}
                aria-pressed={selected}
                className={`w-full p-3 rounded-lg border transition-all text-left snap-start ${
                  selected
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${selected ? 'text-green-700' : 'text-gray-700'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-xs leading-tight">{type.label}</div>
                    <div className="text-[9px] text-gray-600 leading-tight">{type.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* More types trigger - shows selected type if from modal */}
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            className={`w-full border-gray-300 text-gray-800 hover:text-gray-900 ${
              selectedTripType && !QUICK_TYPE_IDS.includes(selectedTripType) ? 'bg-green-50 border-green-300' : ''
            }`}
            onClick={() => setIsTypeModalOpen(true)}
          >
            {selectedTripType && !QUICK_TYPE_IDS.includes(selectedTripType)
              ? `${TRIP_TYPES.find(t => t.id === selectedTripType)?.label} • Change`
              : 'More trip types…'
            }
          </Button>
        </div>
      </div>

      {/* Trip Type modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Choose a trip type"
        size="lg"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {OTHER_TYPES.map((type) => {
            const IconComponent = type.icon
            const selected = selectedTripType === type.id
            return (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedTripType(type.id)
                  setIsTypeModalOpen(false)
                }}
                aria-pressed={selected}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selected
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${selected ? 'text-green-700' : 'text-gray-700'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-xs leading-tight">{type.label}</div>
                    <div className="text-[9px] text-gray-600 leading-tight">{type.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Modal>

      {/* Dates - White Background */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">Travel Dates</h3>
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

