'use client'

/**
 * Phase 3: Generate Plan
 * Review and generate the trip plan
 */

import { Sparkles, MapPin, Calendar, Users, Car, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TripPlanData } from '../types'

interface PhaseProps {
  data: TripPlanData
  updateData: (data: Partial<TripPlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function PhaseThreeNew({ data, onNext, onBack }: PhaseProps) {
  const formatDateRange = () => {
    if (!data.dateRange) return 'Not set'
    const start = data.dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = data.dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${start} - ${end}`
  }

  const getDuration = () => {
    if (!data.dateRange) return 0
    const diff = data.dateRange.endDate.getTime() - data.dateRange.startDate.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-0.5">Ready to create your plan?</h2>
        <p className="text-xs text-gray-600">Review your selections and generate your personalized itinerary</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Route */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-900" />
            <span className="text-xs font-semibold text-gray-900">Route</span>
          </div>
          <div className="text-[10px] text-gray-600">
            {data.destinations[0]?.name || 'Not set'} → {data.destinations[data.destinations.length - 1]?.name || 'Not set'}
            {data.destinations.length > 2 && ` (+${data.destinations.length - 2} stops)`}
          </div>
        </div>

        {/* Dates */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-900" />
            <span className="text-xs font-semibold text-gray-900">Dates</span>
          </div>
          <div className="text-[10px] text-gray-600">
            {formatDateRange()}
            <div className="mt-0.5">{getDuration()} days</div>
          </div>
        </div>

        {/* Travel Pace */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gray-900" />
            <span className="text-xs font-semibold text-gray-900">Pace</span>
          </div>
          <div className="text-[10px] text-gray-600 capitalize">
            {data.pace || 'Moderate'}
          </div>
        </div>

        {/* Budget */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="w-3.5 h-3.5 text-gray-900" />
            <span className="text-xs font-semibold text-gray-900">Budget</span>
          </div>
          <div className="text-[10px] text-gray-600 capitalize">
            {data.budget || 'Moderate'}
          </div>
        </div>

        {/* Transport */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Car className="w-3.5 h-3.5 text-gray-900" />
            <span className="text-xs font-semibold text-gray-900">Transport</span>
          </div>
          <div className="text-[10px] text-gray-600 capitalize">
            {data.transportMode || 'Car'}
          </div>
        </div>

        {/* Companions */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users className="w-3.5 h-3.5 text-gray-900" />
            <span className="text-xs font-semibold text-gray-900">Travelers</span>
          </div>
          <div className="text-[10px] text-gray-600 capitalize">
            {data.companions || 'Solo'} {data.groupSize && data.groupSize > 1 ? `(${data.groupSize})` : ''}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="pt-2">
        <button
          onClick={onNext}
          className="w-full py-3 bg-gradient-to-r from-[#2C5F6F] to-[#1e4a56] text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate My Trip Plan
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-start pt-2 border-t border-gray-200">
        <Button
          onClick={onBack}
          className="px-5 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 font-semibold"
        >
          ← Back
        </Button>
      </div>
    </div>
  )
}

