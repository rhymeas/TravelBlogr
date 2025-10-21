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
      {/* Compact Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Customize your trip</h2>
        <p className="text-xs text-gray-600">Set your travel preferences</p>
      </div>

      {/* Compact 2-column layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Travel Pace */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
            Pace
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {TRAVEL_PACES.map((paceOption) => (
              <button
                key={paceOption.id}
                onClick={() => setPace(paceOption.id)}
                className={`p-2 rounded-lg border-2 transition-all duration-200 text-center group ${
                  pace === paceOption.id
                    ? 'shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                }`}
                style={
                  pace === paceOption.id
                    ? {
                        borderColor: 'var(--color-primary)',
                        background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))'
                      }
                    : {}
                }
              >
                <div className="text-lg mb-0.5 group-hover:scale-110 transition-transform">{paceOption.icon}</div>
                <div className="text-[9px] font-bold text-gray-900">{paceOption.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            Budget
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBudget(b.id)}
                className={`p-2 rounded-lg border-2 transition-all duration-200 text-center group ${
                  budget === b.id
                    ? 'shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                }`}
                style={
                  budget === b.id
                    ? {
                        borderColor: 'var(--color-accent)',
                        background: 'linear-gradient(135deg, #fef3c7, #fed7aa)'
                      }
                    : {}
                }
              >
                <div className="text-lg mb-0.5">{b.icon}</div>
                <div className="text-[9px] font-bold text-gray-900">{b.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transport */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <Car className="w-3.5 h-3.5 text-blue-600" />
          Transport
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {TRANSPORT_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setTransportMode(mode.id)}
              className={`p-2 rounded-lg border-2 transition-all duration-200 text-center group ${
                transportMode === mode.id
                  ? 'shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
              }`}
              style={
                transportMode === mode.id
                  ? {
                      borderColor: 'var(--color-primary)',
                      background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))'
                    }
                  : {}
              }
            >
              <div className="text-lg mb-0.5">{mode.icon}</div>
              <div className="text-[9px] font-bold text-gray-900">{mode.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Companions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-rose-600" />
          Travelers
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => { setCompanions('solo'); setGroupSize(1) }}
            className={`p-2 rounded-lg border-2 transition-all duration-200 text-center group ${
              companions === 'solo'
                ? 'shadow-lg'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
            }`}
            style={
              companions === 'solo'
                ? {
                    borderColor: 'var(--color-secondary)',
                    background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))'
                  }
                : {}
            }
          >
            <div className="text-lg mb-0.5">🧍</div>
            <div className="text-[9px] font-bold text-gray-900">Solo</div>
          </button>
          <button
            onClick={() => { setCompanions('couple'); setGroupSize(2) }}
            className={`p-2 rounded-lg border-2 transition-all duration-200 text-center group ${
              companions === 'couple'
                ? 'shadow-lg'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
            }`}
            style={
              companions === 'couple'
                ? {
                    borderColor: 'var(--color-secondary)',
                    background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))'
                  }
                : {}
            }
          >
            <div className="text-lg mb-0.5">👫</div>
            <div className="text-[9px] font-bold text-gray-900">Couple</div>
          </button>
          <button
            onClick={() => { setCompanions('family'); setGroupSize(4) }}
            className={`p-2 rounded-lg border-2 transition-all duration-200 text-center group ${
              companions === 'family'
                ? 'shadow-lg'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
            }`}
            style={
              companions === 'family'
                ? {
                    borderColor: 'var(--color-secondary)',
                    background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))'
                  }
                : {}
            }
          >
            <div className="text-lg mb-0.5">👨‍👩‍👧‍👦</div>
            <div className="text-[9px] font-bold text-gray-900">Family</div>
          </button>
          <button
            onClick={() => { setCompanions('friends'); setGroupSize(4) }}
            className={`p-2 rounded-lg border-2 transition-all duration-200 text-center group ${
              companions === 'friends'
                ? 'shadow-lg'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
            }`}
            style={
              companions === 'friends'
                ? {
                    borderColor: 'var(--color-secondary)',
                    background: 'linear-gradient(135deg, var(--color-rose-50), var(--color-pink-50))'
                  }
                : {}
            }
          >
            <div className="text-lg mb-0.5">👥</div>
            <div className="text-[9px] font-bold text-gray-900">Friends</div>
          </button>
        </div>
      </div>

      {/* Navigation - Compact */}
      <div className="flex justify-between pt-3 border-t border-white/10">
        <Button
          onClick={onBack}
          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs rounded-lg font-bold border border-gray-300 transition-all duration-200"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className="px-6 py-2 text-white text-xs rounded-lg hover:shadow-xl font-bold transition-all duration-300 hover:scale-105"
          style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

