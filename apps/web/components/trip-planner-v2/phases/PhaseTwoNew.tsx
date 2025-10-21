'use client'

/**
 * Phase 2: Preferences (Combined)
 * Travel style, budget, companions, transport - all in one compact phase
 */

import { useState } from 'react'
import { Users, Car, Sparkles, DollarSign, Zap, Scale, TrendingUp, Wallet, CreditCard, Gem, User, UserPlus, Home, Plane, Train, Bus, Bike } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TripPlanData } from '../types'
import type { LucideIcon } from 'lucide-react'

interface PhaseProps {
  data: TripPlanData
  updateData: (data: Partial<TripPlanData>) => void
  onNext: () => void
  onBack: () => void
}

const TRAVEL_PACES = [
  { id: 'relaxed' as const, label: 'Relaxed', icon: Sparkles },
  { id: 'moderate' as const, label: 'Balanced', icon: Scale },
  { id: 'active' as const, label: 'Active', icon: Zap }
]

const BUDGETS = [
  { id: 'budget' as const, label: 'Budget', icon: Wallet },
  { id: 'mid-range' as const, label: 'Moderate', icon: CreditCard },
  { id: 'luxury' as const, label: 'Luxury', icon: Gem }
]

const TRANSPORT_MODES = [
  { id: 'car' as const, label: 'Car', icon: Car },
  { id: 'bike' as const, label: 'Bike', icon: Bike },
  { id: 'train' as const, label: 'Train', icon: Train },
  { id: 'bus' as const, label: 'Bus', icon: Bus },
  { id: 'flight' as const, label: 'Flight', icon: Plane }
]

const COMPANIONS = [
  { id: 'solo' as const, label: 'Solo', icon: User, size: 1 },
  { id: 'couple' as const, label: 'Couple', icon: UserPlus, size: 2 },
  { id: 'family' as const, label: 'Family', icon: Home, size: 4 },
  { id: 'friends' as const, label: 'Friends', icon: Users, size: 4 }
]

export function PhaseTwoNew({ data, updateData, onNext, onBack }: PhaseProps) {
  const [pace, setPace] = useState(data.pace || 'moderate')
  const [budget, setBudget] = useState(data.budget || 'mid-range')
  const [transportMode, setTransportMode] = useState(data.transportMode || 'car')
  const [companions, setCompanions] = useState(data.companions || 'solo')
  const [groupSize, setGroupSize] = useState(data.groupSize || 1)

  const handleNext = () => {
    updateData({
      pace,
      budget,
      transportMode,
      companions,
      groupSize,
      travelStyle: [] // Keep empty for now
    })
    onNext()
  }

  return (
    <div className="space-y-2.5">
      {/* Header - Larger titles */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Customize your trip</h2>
        <p className="text-xs text-gray-600 mt-0.5">Set your travel preferences</p>
      </div>

      {/* Travel Pace - Larger buttons with green selection */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">Travel Pace</h3>
        <div className="grid grid-cols-3 gap-2">
          {TRAVEL_PACES.map((paceOption) => {
            const IconComponent = paceOption.icon
            return (
              <button
                key={paceOption.id}
                onClick={() => setPace(paceOption.id)}
                className={`p-2.5 rounded-lg border transition-all text-center ${
                  pace === paceOption.id
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center ${
                  pace === paceOption.id ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${
                    pace === paceOption.id ? 'text-green-700' : 'text-gray-700'
                  }`} />
                </div>
                <div className="text-xs font-semibold text-gray-900">{paceOption.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Budget - Larger buttons with green selection */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">Budget</h3>
        <div className="grid grid-cols-3 gap-2">
          {BUDGETS.map((b) => {
            const IconComponent = b.icon
            return (
              <button
                key={b.id}
                onClick={() => setBudget(b.id)}
                className={`p-2.5 rounded-lg border transition-all text-center ${
                  budget === b.id
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center ${
                  budget === b.id ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${
                    budget === b.id ? 'text-green-700' : 'text-gray-700'
                  }`} />
                </div>
                <div className="text-xs font-semibold text-gray-900">{b.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Transport - Larger buttons with green selection, 5 items in grid */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">Transport</h3>
        <div className="grid grid-cols-3 gap-2">
          {TRANSPORT_MODES.map((mode) => {
            const IconComponent = mode.icon
            return (
              <button
                key={mode.id}
                onClick={() => setTransportMode(mode.id)}
                className={`p-2.5 rounded-lg border transition-all text-center ${
                  transportMode === mode.id
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center ${
                  transportMode === mode.id ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${
                    transportMode === mode.id ? 'text-green-700' : 'text-gray-700'
                  }`} />
                </div>
                <div className="text-xs font-semibold text-gray-900">{mode.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Travelers - Larger buttons with green selection */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-gray-900">Travelers</h3>
        <div className="grid grid-cols-4 gap-2">
          {COMPANIONS.map((companion) => {
            const IconComponent = companion.icon
            return (
              <button
                key={companion.id}
                onClick={() => { setCompanions(companion.id); setGroupSize(companion.size) }}
                className={`p-2.5 rounded-lg border transition-all text-center ${
                  companions === companion.id
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center ${
                  companions === companion.id ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <IconComponent className={`w-5 h-5 ${
                    companions === companion.id ? 'text-green-700' : 'text-gray-700'
                  }`} />
                </div>
                <div className="text-xs font-semibold text-gray-900">{companion.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2 border-t border-gray-200">
        <Button
          onClick={onBack}
          className="px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 text-[9px] rounded-lg font-bold border border-gray-300 transition-all"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className="px-4 py-1 text-white text-[9px] rounded-lg hover:shadow-lg font-bold transition-all"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

