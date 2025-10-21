'use client'

/**
 * Phase 2: Preferences (Combined)
 * Travel style, budget, companions, transport - all in one compact phase
 */

import { useState } from 'react'
import { Users, Car, Sparkles, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TripPlanData } from '../types'

interface PhaseProps {
  data: TripPlanData
  updateData: (data: Partial<TripPlanData>) => void
  onNext: () => void
  onBack: () => void
}

const TRAVEL_PACES = [
  { id: 'relaxed' as const, label: 'Relaxed', icon: '🌴', description: 'Take it easy' },
  { id: 'moderate' as const, label: 'Balanced', icon: '⚖️', description: 'Mix of both' },
  { id: 'active' as const, label: 'Active', icon: '⚡', description: 'Pack it in' }
]

const BUDGETS = [
  { id: 'budget' as const, label: 'Budget', icon: '💰' },
  { id: 'mid-range' as const, label: 'Moderate', icon: '💳' },
  { id: 'luxury' as const, label: 'Luxury', icon: '💎' }
]

const TRANSPORT_MODES = [
  { id: 'car' as const, label: 'Car', icon: '🚗' },
  { id: 'train' as const, label: 'Train', icon: '🚆' },
  { id: 'bus' as const, label: 'Bus', icon: '🚌' },
  { id: 'flight' as const, label: 'Flight', icon: '✈️' }
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-0.5">Customize your experience</h2>
        <p className="text-xs text-gray-600">Tell us about your travel preferences</p>
      </div>

      {/* Travel Pace */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gray-900" />
          Travel Pace
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {TRAVEL_PACES.map((paceOption) => (
            <button
              key={paceOption.id}
              onClick={() => setPace(paceOption.id)}
              className={`p-2 rounded-lg border-2 transition-all text-center ${
                pace === paceOption.id
                  ? 'border-[#2C5F6F] bg-[#2C5F6F]/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-xl mb-0.5">{paceOption.icon}</div>
              <div className="text-xs font-semibold text-gray-900">{paceOption.label}</div>
              <div className="text-[9px] text-gray-600">{paceOption.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-gray-900" />
          Budget
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {BUDGETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBudget(b.id)}
              className={`p-2 rounded-lg border-2 transition-all text-center ${
                budget === b.id
                  ? 'border-[#2C5F6F] bg-[#2C5F6F]/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-xl mb-0.5">{b.icon}</div>
              <div className="text-xs font-semibold text-gray-900">{b.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Transport */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Car className="w-3.5 h-3.5 text-gray-900" />
          Transport
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {TRANSPORT_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setTransportMode(mode.id)}
              className={`p-2 rounded-lg border-2 transition-all text-center ${
                transportMode === mode.id
                  ? 'border-[#2C5F6F] bg-[#2C5F6F]/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-xl mb-0.5">{mode.icon}</div>
              <div className="text-xs font-semibold text-gray-900">{mode.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Companions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-900" />
          Traveling with
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setCompanions('solo'); setGroupSize(1) }}
            className={`p-2 rounded-lg border-2 transition-all text-center ${
              companions === 'solo'
                ? 'border-[#2C5F6F] bg-[#2C5F6F]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-xl mb-0.5">🧍</div>
            <div className="text-xs font-semibold text-gray-900">Solo</div>
          </button>
          <button
            onClick={() => { setCompanions('couple'); setGroupSize(2) }}
            className={`p-2 rounded-lg border-2 transition-all text-center ${
              companions === 'couple'
                ? 'border-[#2C5F6F] bg-[#2C5F6F]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-xl mb-0.5">👫</div>
            <div className="text-xs font-semibold text-gray-900">Couple</div>
          </button>
          <button
            onClick={() => { setCompanions('family'); setGroupSize(4) }}
            className={`p-2 rounded-lg border-2 transition-all text-center ${
              companions === 'family'
                ? 'border-[#2C5F6F] bg-[#2C5F6F]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-xl mb-0.5">👨‍👩‍👧‍👦</div>
            <div className="text-xs font-semibold text-gray-900">Family</div>
          </button>
          <button
            onClick={() => { setCompanions('friends'); setGroupSize(4) }}
            className={`p-2 rounded-lg border-2 transition-all text-center ${
              companions === 'friends'
                ? 'border-[#2C5F6F] bg-[#2C5F6F]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-xl mb-0.5">👥</div>
            <div className="text-xs font-semibold text-gray-900">Friends</div>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-3 border-t border-gray-200">
        <Button
          onClick={onBack}
          className="px-5 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 font-semibold"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className="px-5 py-1.5 bg-[#2C5F6F] text-white text-xs rounded-lg hover:bg-[#1e4a56] font-semibold"
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

