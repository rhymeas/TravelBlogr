'use client'

/**
 * Trip Summary Component
 * Real-time preview of trip details as user progresses through phases
 */

import { MapPin, Calendar, Users, Car, Gauge, DollarSign, Hotel } from 'lucide-react'
import type { TripPlanData } from './types'

interface TripSummaryProps {
  data: TripPlanData
  currentPhase: number
}

export function TripSummary({ data, currentPhase }: TripSummaryProps) {
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
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* Header removed to save space */}

      {/* Destinations */}
      {currentPhase >= 1 && data.destinations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-[#2C5F6F]" />
            Route
          </div>
          <div className="pl-6 space-y-1">
            {data.destinations.map((dest, index) => (
              <div key={index} className="text-sm text-gray-600">
                {index === 0 ? '🅰️' : index === data.destinations.length - 1 ? '🅱️' : '📍'} {dest.name || 'Not set'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dates */}
      {currentPhase >= 1 && data.dateRange && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-[#2C5F6F]" />
            Dates
          </div>
          <div className="pl-6 text-sm text-gray-600">
            {formatDateRange()}
            <div className="text-xs text-gray-500 mt-1">
              {getDuration()} {getDuration() === 1 ? 'day' : 'days'}
              {data.dateRange.flexible && ' (flexible)'}
            </div>
          </div>
        </div>
      )}

      {/* Trip Type */}
      {currentPhase >= 1 && data.tripType && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">Trip Type</div>
          <div className="pl-6 text-sm text-gray-600 capitalize">
            {data.tripType.replace('-', ' ')}
          </div>
        </div>
      )}

      {/* Companions */}
      {currentPhase >= 2 && data.companions && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Users className="w-3.5 h-3.5 text-[#2C5F6F]" />
            Travelers
          </div>
          <div className="pl-6 text-sm text-gray-600 capitalize">
            {data.companions.replace('-', ' ')}
            {data.groupSize > 1 && ` (${data.groupSize} people)`}
            {data.childAges && data.childAges.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Children: {data.childAges.join(', ')} years old
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transport */}
      {currentPhase >= 3 && data.transportMode && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Car className="w-3.5 h-3.5 text-[#2C5F6F]" />
            Transport
          </div>
          <div className="pl-6 text-sm text-gray-600 capitalize">
            {data.transportMode.replace('-', ' ')}
          </div>
        </div>
      )}

      {/* Travel Pace */}
      {currentPhase >= 4 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Gauge className="w-3.5 h-3.5 text-[#2C5F6F]" />
            Pace
          </div>
          <div className="pl-6 text-sm text-gray-600 capitalize">
            {data.pace}
            {data.dailyTravelHours && ` (${data.dailyTravelHours}h/day)`}
          </div>
        </div>
      )}

      {/* Travel Style */}
      {currentPhase >= 4 && data.travelStyle.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">Interests</div>
          <div className="pl-6 flex flex-wrap gap-1">
            {data.travelStyle.slice(0, 3).map((style, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full"
              >
                {style}
              </span>
            ))}
            {data.travelStyle.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                +{data.travelStyle.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Budget */}
      {currentPhase >= 5 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <DollarSign className="w-3.5 h-3.5 text-[#2C5F6F]" />
            Budget
          </div>
          <div className="pl-6 text-sm text-gray-600 capitalize">
            {data.budget.replace('-', ' ')}
          </div>
        </div>
      )}

      {/* Accommodations */}
      {currentPhase >= 5 && data.accommodationTypes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Hotel className="w-3.5 h-3.5 text-[#2C5F6F]" />
            Accommodations
          </div>
          <div className="pl-6 text-sm text-gray-600">
            {data.accommodationTypes.slice(0, 2).join(', ')}
            {data.accommodationTypes.length > 2 && ` +${data.accommodationTypes.length - 2} more`}
          </div>
        </div>
      )}

      {/* Completion Indicator */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span className="font-semibold">{Math.round((currentPhase / 6) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${(currentPhase / 6) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

