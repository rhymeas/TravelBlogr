'use client'

/**
 * Phase 5: Practical Considerations
 * Budget, accommodations, and logistics
 */

import { useState } from 'react'
import { DollarSign, Hotel, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PhaseProps, BudgetRange } from '../types'

const BUDGET_RANGES: { id: BudgetRange; label: string; range: string; description: string }[] = [
  { id: 'budget', label: 'Budget-friendly', range: '$30-60/day', description: 'Hostels, street food, public transport' },
  { id: 'mid-range', label: 'Mid-range', range: '$60-120/day', description: 'Hotels, local restaurants, some activities' },
  { id: 'comfortable', label: 'Comfortable', range: '$120-200/day', description: 'Nice hotels, good dining, tours' },
  { id: 'luxury', label: 'Luxury', range: '$200+/day', description: 'Premium hotels, fine dining, private tours' },
  { id: 'no-constraint', label: 'No constraint', range: 'Unlimited', description: 'Best of everything' }
]

const ACCOMMODATION_TYPES = [
  { id: 'hotels', label: 'Hotels', icon: '🏨' },
  { id: 'hostels', label: 'Hostels', icon: '🛏️' },
  { id: 'vacation-rentals', label: 'Vacation rentals', icon: '🏠' },
  { id: 'bnb', label: 'B&Bs', icon: '🏡' },
  { id: 'camping', label: 'Camping', icon: '⛺' },
  { id: 'unique', label: 'Unique stays', icon: '🌟' }
]

const DINING_PREFERENCES = [
  { id: 'self-catering', label: 'Cook my own meals', description: 'Groceries and self-catering' },
  { id: 'mixed', label: 'Mix of restaurants & self-catering', description: 'Balanced approach' },
  { id: 'dining-out', label: 'Primarily dining out', description: 'Local restaurants' },
  { id: 'fine-dining', label: 'Fine dining experiences', description: 'Premium restaurants' },
  { id: 'street-food', label: 'Street food & casual', description: 'Local street food and casual eateries' }
]

export function PhaseFive({ data, updateData, onNext, onBack }: PhaseProps) {
  const [selectedBudget, setSelectedBudget] = useState<BudgetRange>(data.budget || 'mid-range')
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>(data.accommodationTypes || [])
  const [selectedDining, setSelectedDining] = useState(data.diningPreference || 'mixed')

  const toggleAccommodation = (type: string) => {
    setSelectedAccommodations(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleNext = () => {
    if (selectedAccommodations.length === 0) {
      alert('Please select at least one accommodation type')
      return
    }

    updateData({
      budget: selectedBudget,
      accommodationTypes: selectedAccommodations,
      diningPreference: selectedDining
    })

    onNext()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Let's talk budget and logistics</h2>
        <p className="text-gray-600">This helps us recommend options within your comfort zone</p>
      </div>

      {/* Budget Range */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Budget Range
        </h3>

        <div className="space-y-3">
          {BUDGET_RANGES.map((budget) => (
            <button
              key={budget.id}
              onClick={() => setSelectedBudget(budget.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedBudget === budget.id
                  ? 'border-emerald-600 bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{budget.label}</div>
                  <div className="text-sm text-gray-600">{budget.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-emerald-600">{budget.range}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accommodation Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Hotel className="w-5 h-5 text-emerald-600" />
          Accommodation Preferences (Select all that apply)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ACCOMMODATION_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => toggleAccommodation(type.id)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selectedAccommodations.includes(type.id)
                  ? 'border-emerald-600 bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dining Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-600" />
          Dining Preferences
        </h3>

        <div className="space-y-3">
          {DINING_PREFERENCES.map((pref) => (
            <button
              key={pref.id}
              onClick={() => setSelectedDining(pref.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedDining === pref.id
                  ? 'border-emerald-600 bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-1">{pref.label}</div>
              <div className="text-sm text-gray-600">{pref.description}</div>
            </button>
          ))}
        </div>
      </div>

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
          className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

