'use client'

/**
 * Phase 2: Travel Companions & Dynamics
 * Understand who's traveling and their needs
 */

import { useState } from 'react'
import { Users, Baby, Heart, Briefcase, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PhaseProps, CompanionType } from '../types'

const COMPANION_TYPES: { id: CompanionType; label: string; icon: any; description: string }[] = [
  {
    id: 'solo',
    label: 'Solo Traveler',
    icon: User,
    description: 'Traveling alone'
  },
  {
    id: 'couple',
    label: 'Couple/Partner',
    icon: Heart,
    description: 'Romantic getaway or couples trip'
  },
  {
    id: 'family',
    label: 'Family with Children',
    icon: Baby,
    description: 'Traveling with kids'
  },
  {
    id: 'friends',
    label: 'Friends Group',
    icon: Users,
    description: 'Group of friends'
  },
  {
    id: 'business',
    label: 'Business/Colleagues',
    icon: Briefcase,
    description: 'Work-related travel'
  }
]

const SPECIAL_NEEDS = [
  'Accessibility needs',
  'Elderly travelers',
  'Teenagers',
  'Mixed mobility levels',
  'Dietary restrictions'
]

export function PhaseTwo({ data, updateData, onNext, onBack }: PhaseProps) {
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionType | null>(data.companions)
  const [groupSize, setGroupSize] = useState(data.groupSize || 1)
  const [childAges, setChildAges] = useState<number[]>(data.childAges || [])
  const [specialNeeds, setSpecialNeeds] = useState<string[]>(data.specialNeeds || [])

  const toggleSpecialNeed = (need: string) => {
    setSpecialNeeds(prev =>
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    )
  }

  const addChildAge = () => {
    setChildAges([...childAges, 5])
  }

  const updateChildAge = (index: number, age: number) => {
    const newAges = [...childAges]
    newAges[index] = age
    setChildAges(newAges)
  }

  const removeChildAge = (index: number) => {
    setChildAges(childAges.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (!selectedCompanion) {
      alert('Please select who is traveling')
      return
    }

    updateData({
      companions: selectedCompanion,
      groupSize,
      childAges: selectedCompanion === 'family' ? childAges : undefined,
      specialNeeds
    })

    onNext()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Who's coming along?</h2>
        <p className="text-gray-600">This helps us tailor recommendations to your group</p>
      </div>

      {/* Companion Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Travel Companions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPANION_TYPES.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setSelectedCompanion(type.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedCompanion === type.id
                    ? 'border-[#2C5F6F] bg-emerald-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    selectedCompanion === type.id ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      selectedCompanion === type.id ? 'text-[#2C5F6F]' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Group Size (if friends or business) */}
      {(selectedCompanion === 'friends' || selectedCompanion === 'business') && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">How many people?</h3>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="2"
              max="20"
              value={groupSize}
              onChange={(e) => setGroupSize(parseInt(e.target.value) || 2)}
              className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-gray-600">travelers</span>
          </div>
        </div>
      )}

      {/* Child Ages (if family) */}
      {selectedCompanion === 'family' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Children's Ages</h3>
          <p className="text-sm text-gray-600">This helps us recommend age-appropriate activities</p>
          
          <div className="space-y-3">
            {childAges.map((age, index) => (
              <div key={index} className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Child {index + 1}:</label>
                <input
                  type="number"
                  min="0"
                  max="18"
                  value={age}
                  onChange={(e) => updateChildAge(index, parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">years old</span>
                <button
                  onClick={() => removeChildAge(index)}
                  className="ml-auto text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addChildAge}
            className="text-sm text-[#2C5F6F] hover:text-emerald-700 font-medium"
          >
            + Add another child
          </button>
        </div>
      )}

      {/* Special Considerations */}
      {(selectedCompanion === 'family' || selectedCompanion === 'friends' || groupSize > 1) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Any special considerations?</h3>
          <p className="text-sm text-gray-600">Optional - helps us provide better recommendations</p>
          
          <div className="space-y-2">
            {SPECIAL_NEEDS.map((need) => (
              <label
                key={need}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={specialNeeds.includes(need)}
                  onChange={() => toggleSpecialNeed(need)}
                  className="w-4 h-4 text-[#2C5F6F] border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{need}</span>
              </label>
            ))}
          </div>
        </div>
      )}

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

