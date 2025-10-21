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
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 hover:shadow-blue-500/20 transition-all duration-300">
      {/* Compact horizontal summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Dates */}
        {currentPhase >= 1 && data.dateRange && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
            <Calendar className="w-3.5 h-3.5 text-cyan-600" />
            <div className="text-[10px] font-semibold text-gray-800">
              {getDuration()}d
              {data.dateRange.flexible && <span className="ml-1 text-cyan-600">±3</span>}
            </div>
          </div>
        )}

        {/* Trip Type */}
        {currentPhase >= 1 && data.tripType && (
          <div className="px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <div className="text-[10px] font-semibold text-gray-800 capitalize">
              {data.tripType.replace('-', ' ')}
            </div>
          </div>
        )}

        {/* Companions */}
        {currentPhase >= 2 && data.companions && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-lg border border-rose-500/20">
            <Users className="w-3.5 h-3.5 text-rose-600" />
            <div className="text-[10px] font-semibold text-gray-800 capitalize">
              {data.companions}
              {data.groupSize > 1 && ` (${data.groupSize})`}
            </div>
          </div>
        )}

        {/* Transport */}
        {currentPhase >= 2 && data.transportMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/20">
            <Car className="w-3.5 h-3.5 text-blue-600" />
            <div className="text-[10px] font-semibold text-gray-800 capitalize">
              {data.transportMode}
            </div>
          </div>
        )}

        {/* Pace */}
        {currentPhase >= 2 && data.pace && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
            <Gauge className="w-3.5 h-3.5 text-green-600" />
            <div className="text-[10px] font-semibold text-gray-800 capitalize">
              {data.pace}
            </div>
          </div>
        )}

        {/* Budget */}
        {currentPhase >= 2 && data.budget && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <div className="text-[10px] font-semibold text-gray-800 capitalize">
              {data.budget.replace('-', ' ')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

