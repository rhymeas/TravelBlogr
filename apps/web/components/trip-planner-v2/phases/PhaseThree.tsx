'use client'

/**
 * Phase 3: Transportation Mode
 * The most critical decision point that affects everything downstream
 */

import { useState } from 'react'
import { Car, Train, Bike, Plane, Bus, Shuffle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PhaseProps, TransportMode, TransportDetails } from '../types'

const TRANSPORT_MODES: { id: TransportMode; label: string; icon: any; description: string }[] = [
  {
    id: 'car',
    label: 'Car/Road Trip',
    icon: Car,
    description: 'Own car or rental'
  },
  {
    id: 'train',
    label: 'Train',
    icon: Train,
    description: 'Rail pass, scenic routes'
  },
  {
    id: 'bike',
    label: 'Cycling/Bike',
    icon: Bike,
    description: 'Touring, bike paths'
  },
  {
    id: 'flight',
    label: 'Flight',
    icon: Plane,
    description: 'Primary, with local transport'
  },
  {
    id: 'bus',
    label: 'Bus/Coach',
    icon: Bus,
    description: 'Scheduled routes'
  },
  {
    id: 'mixed',
    label: 'Mixed Transport',
    icon: Shuffle,
    description: 'Multiple modes'
  }
]

export function PhaseThree({ data, updateData, onNext, onBack }: PhaseProps) {
  const [selectedMode, setSelectedMode] = useState<TransportMode | null>(data.transportMode)
  const [showDetails, setShowDetails] = useState(false)
  const [details, setDetails] = useState<TransportDetails>(data.transportDetails || {})

  const handleNext = () => {
    if (!selectedMode) {
      alert('Please select a transport mode')
      return
    }

    updateData({
      transportMode: selectedMode,
      transportDetails: details
    })

    onNext()
  }

  const renderTransportDetails = () => {
    switch (selectedMode) {
      case 'car':
        return (
          <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">Car/Road Trip Details</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="vehicle"
                  checked={details.hasVehicle === true}
                  onChange={() => setDetails({ ...details, hasVehicle: true })}
                  className="w-4 h-4 text-[#2C5F6F]"
                />
                <span className="text-sm text-gray-700">I have my own vehicle</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="vehicle"
                  checked={details.hasVehicle === false}
                  onChange={() => setDetails({ ...details, hasVehicle: false })}
                  className="w-4 h-4 text-[#2C5F6F]"
                />
                <span className="text-sm text-gray-700">I'll rent a vehicle</span>
              </label>
            </div>

            {details.hasVehicle === false && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                <select
                  value={details.vehicleType || ''}
                  onChange={(e) => setDetails({ ...details, vehicleType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select type</option>
                  <option value="compact">Compact</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van/Minivan</option>
                </select>
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={details.scenicRoutes || false}
                onChange={(e) => setDetails({ ...details, scenicRoutes: e.target.checked })}
                className="w-4 h-4 text-[#2C5F6F] rounded"
              />
              <span className="text-sm text-gray-700">Prioritize scenic routes</span>
            </label>
          </div>
        )

      case 'train':
        return (
          <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">Train Travel Details</h4>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={details.railPass || false}
                onChange={(e) => setDetails({ ...details, railPass: e.target.checked })}
                className="w-4 h-4 text-[#2C5F6F] rounded"
              />
              <span className="text-sm text-gray-700">Consider rail passes (Eurail, JR Pass, etc.)</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Preference</label>
              <select
                value={details.classPreference || ''}
                onChange={(e) => setDetails({ ...details, classPreference: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">No preference</option>
                <option value="economy">Economy</option>
                <option value="first">First Class</option>
              </select>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={details.scenicTrains || false}
                onChange={(e) => setDetails({ ...details, scenicTrains: e.target.checked })}
                className="w-4 h-4 text-[#2C5F6F] rounded"
              />
              <span className="text-sm text-gray-700">Include scenic train routes</span>
            </label>
          </div>
        )

      case 'bike':
        return (
          <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">Cycling Details</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bike Type</label>
              <select
                value={details.bikeType || ''}
                onChange={(e) => setDetails({ ...details, bikeType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select type</option>
                <option value="road">Road Bike</option>
                <option value="touring">Touring Bike</option>
                <option value="ebike">E-Bike</option>
                <option value="mountain">Mountain Bike</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="bike-ownership"
                  checked={details.ownBike === true}
                  onChange={() => setDetails({ ...details, ownBike: true })}
                  className="w-4 h-4 text-[#2C5F6F]"
                />
                <span className="text-sm text-gray-700">Bringing my own bike</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="bike-ownership"
                  checked={details.ownBike === false}
                  onChange={() => setDetails({ ...details, ownBike: false })}
                  className="w-4 h-4 text-[#2C5F6F]"
                />
                <span className="text-sm text-gray-700">Renting a bike</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daily Distance Comfort</label>
              <input
                type="number"
                value={details.dailyDistance || 50}
                onChange={(e) => setDetails({ ...details, dailyDistance: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-500 mt-1">kilometers per day</span>
            </div>
          </div>
        )

      case 'flight':
        return (
          <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">Flight Details</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Preference</label>
              <select
                value={details.flightClass || ''}
                onChange={(e) => setDetails({ ...details, flightClass: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">No preference</option>
                <option value="economy">Economy</option>
                <option value="premium">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={details.directFlights || false}
                onChange={(e) => setDetails({ ...details, directFlights: e.target.checked })}
                className="w-4 h-4 text-[#2C5F6F] rounded"
              />
              <span className="text-sm text-gray-700">Prefer direct flights</span>
            </label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">How will you be getting around?</h2>
        <p className="text-gray-600">This is the most important decision for your trip planning</p>
      </div>

      {/* Transport Mode Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Primary Transport Method</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TRANSPORT_MODES.map((mode) => {
            const Icon = mode.icon
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id)
                  setShowDetails(true)
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedMode === mode.id
                    ? 'border-[#2C5F6F] bg-emerald-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-3 ${
                  selectedMode === mode.id ? 'text-[#2C5F6F]' : 'text-gray-600'
                }`} />
                <div className="font-semibold text-gray-900 text-sm mb-1">{mode.label}</div>
                <div className="text-xs text-gray-600">{mode.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Transport Details */}
      {selectedMode && showDetails && renderTransportDetails()}

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
          className="px-8 py-3 bg-[#2C5F6F] text-white rounded-lg hover:bg-[#1e4a56] font-semibold"
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

