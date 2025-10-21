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
      {/* Compact Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Ready to generate?</h2>
        <p className="text-xs text-gray-600">Review and create your itinerary</p>
      </div>

      {/* Compact Summary Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        {/* Route */}
        <div className="col-span-2 p-3 rounded-xl border hover:shadow-lg transition-all duration-200" style={{ background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))', borderColor: 'var(--color-rose-200)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
            <span className="text-[10px] font-bold text-gray-900">Route</span>
          </div>
          <div className="text-[10px] text-gray-800 font-semibold leading-tight">
            {data.destinations[0]?.name || 'Not set'} → {data.destinations[data.destinations.length - 1]?.name || 'Not set'}
            {data.destinations.length > 2 && (
              <span className="inline-block ml-1 px-1.5 py-0.5 bg-white/60 rounded text-[9px]">
                +{data.destinations.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="p-3 rounded-xl border hover:shadow-lg transition-all duration-200" style={{ background: 'linear-gradient(135deg, var(--color-pink-50), var(--color-rose-100))', borderColor: 'var(--color-pink-200)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-secondary)' }} />
            <span className="text-[10px] font-bold text-gray-900">Dates</span>
          </div>
          <div className="text-[10px] text-gray-800 font-semibold">
            <span className="inline-block px-1.5 py-0.5 bg-white/60 rounded">
              {getDuration()}d
            </span>
          </div>
        </div>

        {/* Pace */}
        <div className="p-3 rounded-xl border hover:shadow-lg transition-all duration-200" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', borderColor: '#86efac' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
            <span className="text-[10px] font-bold text-gray-900">Pace</span>
          </div>
          <div className="text-[10px] text-gray-800 font-semibold capitalize">
            {data.pace || 'Moderate'}
          </div>
        </div>

        {/* Budget */}
        <div className="p-3 rounded-xl border hover:shadow-lg transition-all duration-200" style={{ background: 'linear-gradient(135deg, #fef3c7, #fed7aa)', borderColor: '#fcd34d' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
            <span className="text-[10px] font-bold text-gray-900">Budget</span>
          </div>
          <div className="text-[10px] text-gray-800 font-semibold capitalize">
            {data.budget || 'Moderate'}
          </div>
        </div>

        {/* Transport */}
        <div className="p-3 rounded-xl border hover:shadow-lg transition-all duration-200" style={{ background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))', borderColor: 'var(--color-rose-200)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Car className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
            <span className="text-[10px] font-bold text-gray-900">Transport</span>
          </div>
          <div className="text-[10px] text-gray-800 font-semibold capitalize">
            {data.transportMode || 'Car'}
          </div>
        </div>
      </div>

      {/* Generate Button - Bold CTA */}
      <div className="pt-3">
        <button
          onClick={onNext}
          className="w-full py-3.5 text-white rounded-xl hover:shadow-2xl transition-all duration-300 font-bold text-sm flex items-center justify-center gap-2 group hover:scale-[1.03] active:scale-[0.97] relative overflow-hidden"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          <span className="relative">Generate My Trip Plan</span>
        </button>
      </div>

      {/* Navigation - Minimal */}
      <div className="flex justify-start pt-2 border-t border-white/10">
        <Button
          onClick={onBack}
          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs rounded-lg font-bold border border-gray-300 transition-all duration-200"
        >
          ← Back
        </Button>
      </div>
    </div>
  )
}

