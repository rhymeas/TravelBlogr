'use client'

/**
 * Phase 3: Generate Plan
 * Review and generate the trip plan
 */

import { Sparkles, MapPin, Calendar, Users, Car, DollarSign, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { TripPlanData } from '../types'

interface PhaseProps {
  data: TripPlanData
  updateData: (data: Partial<TripPlanData>) => void
  onNext: () => void
  onBack: () => void
  isGenerating?: boolean
  error?: string | null
}

export function PhaseThreeNew({ data, onNext, onBack, isGenerating, error }: PhaseProps) {
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
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-gray-900">Review your trip</h2>
        <p className="text-xs text-gray-600 mt-1">Confirm details before generating</p>
      </div>

      {/* Summary List - Bigger boxes and fonts */}
      <div className="space-y-3">
        {/* Route */}
        <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4.5 h-4.5 text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Route</div>
              <div className="text-sm text-gray-900 font-semibold">
                {data.destinations[0]?.name || 'Not set'} → {data.destinations[data.destinations.length - 1]?.name || 'Not set'}
                {data.destinations.length > 2 && (
                  <span className="ml-1.5 text-xs text-gray-600">
                    (+{data.destinations.length - 2} stops)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4.5 h-4.5 text-gray-700" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Dates</div>
              <div className="text-sm text-gray-900 font-semibold">
                {formatDateRange()} <span className="text-gray-600">({getDuration()} days)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pace */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Pace</div>
                <div className="text-xs text-gray-900 font-semibold capitalize">{data.pace || 'Moderate'}</div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Budget</div>
                <div className="text-xs text-gray-900 font-semibold capitalize">{data.budget || 'Moderate'}</div>
              </div>
            </div>
          </div>

          {/* Transport */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Car className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Transport</div>
                <div className="text-xs text-gray-900 font-semibold capitalize">{data.transportMode || 'Car'}</div>
              </div>
            </div>
          </div>

          {/* Travelers */}
          <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Travelers</div>
                <div className="text-xs text-gray-900 font-semibold capitalize">
                  {data.companions || 'Solo'} {data.groupSize && data.groupSize > 1 ? `(${data.groupSize})` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Generate Button + Manual Planner Link */}
      <div className="pt-3 space-y-3">
        <button
          onClick={onNext}
          disabled={isGenerating}
          className="w-full py-3 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating your perfect trip...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate My Trip Plan</span>
            </>
          )}
        </button>

        {/* Manual Trip Planner Link */}
        <div className="flex justify-center pr-2">
          <Link href="/plan">
            <Button
              variant="outline"
              className="text-xs text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400 px-4 py-2 flex items-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Or plan manually</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-start pt-1.5 border-t border-gray-200">
        <Button
          onClick={onBack}
          className="px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 text-[9px] rounded-lg font-bold border border-gray-300 transition-all"
        >
          ← Back
        </Button>
      </div>
    </div>
  )
}

