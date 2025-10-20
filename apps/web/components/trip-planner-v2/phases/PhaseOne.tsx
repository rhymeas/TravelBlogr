'use client'

/**
 * Phase 1: Journey Foundation
 * Establish the basic framework of the trip
 */

import { useState } from 'react'
import { MapPin, Calendar, Plus, X, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LocationAutocomplete } from '@/components/itinerary/LocationAutocomplete'
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
  const [destinations, setDestinations] = useState<Destination[]>(
    data.destinations.length > 0
      ? data.destinations
      : [
          { name: '', type: 'start' },
          { name: '', type: 'end' }
        ]
  )
  const [selectedTripType, setSelectedTripType] = useState<TripType | null>(data.tripType)
  const [dateRange, setDateRange] = useState({
    startDate: data.dateRange?.startDate ? data.dateRange.startDate.toISOString().split('T')[0] : '',
    endDate: data.dateRange?.endDate ? data.dateRange.endDate.toISOString().split('T')[0] : '',
    flexible: data.dateRange?.flexible || false
  })

  const addStop = () => {
    const newDestinations = [...destinations]
    newDestinations.splice(destinations.length - 1, 0, { name: '', type: 'stop' })
    setDestinations(newDestinations)
  }

  const removeStop = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index))
  }

  const updateDestination = (index: number, name: string) => {
    const newDestinations = [...destinations]
    newDestinations[index] = { ...newDestinations[index], name }
    setDestinations(newDestinations)
  }

  const handleNext = () => {
    // Validate
    const filledDestinations = destinations.filter(d => d.name.trim())
    if (filledDestinations.length < 2) {
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
      destinations: filledDestinations,
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Where are you thinking of going?</h2>
        <p className="text-gray-600">Let's start with the basics of your journey</p>
      </div>

      {/* Destinations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          Your Route
        </h3>

        <div className="space-y-3">
          {destinations.map((dest, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
                {index === 0 ? 'A' : index === destinations.length - 1 ? 'B' : index}
              </div>
              
              <div className="flex-1">
                <LocationAutocomplete
                  value={dest.name}
                  onChange={(value) => updateDestination(index, value)}
                  placeholder={
                    index === 0
                      ? 'Starting location'
                      : index === destinations.length - 1
                      ? 'Destination'
                      : `Stop ${index}`
                  }
                  className="w-full"
                />
              </div>

              {dest.type === 'stop' && (
                <button
                  onClick={() => removeStop(index)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addStop}
          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add stop along the way
        </button>
      </div>

      {/* Trip Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">What kind of trip are you planning?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TRIP_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedTripType(type.id)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedTripType === type.id
                  ? 'border-emerald-600 bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{type.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          When are you traveling?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={dateRange.flexible}
            onChange={(e) => setDateRange({ ...dateRange, flexible: e.target.checked })}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          My dates are flexible (±3 days)
        </label>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleNext}
          className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

