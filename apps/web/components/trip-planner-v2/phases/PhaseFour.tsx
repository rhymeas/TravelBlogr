'use client'

/**
 * Phase 4: Travel Pace & Style
 * Define the rhythm and intensity of the journey
 */

import { useState } from 'react'
import { Gauge, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { PhaseProps, TravelPace } from '../types'

const PACE_OPTIONS: { id: TravelPace; label: string; hours: string; description: string }[] = [
  { id: 'relaxed', label: 'Relaxed', hours: '2-3h/day', description: 'Long stops, plenty of rest' },
  { id: 'moderate', label: 'Moderate', hours: '3-4h/day', description: 'Balanced pace' },
  { id: 'active', label: 'Active', hours: '4-6h/day', description: 'Multiple stops, active days' },
  { id: 'intensive', label: 'Intensive', hours: '6+h/day', description: 'Maximize coverage' }
]

const TRAVEL_STYLES = [
  { id: 'planned', label: 'Highly planned', icon: '📅', description: 'Detailed itinerary' },
  { id: 'spontaneous', label: 'Spontaneous', icon: '🎲', description: 'Loose framework' },
  { id: 'culture', label: 'Culture & history', icon: '🏛️', description: 'Museums, heritage sites' },
  { id: 'food', label: 'Food experiences', icon: '🍽️', description: 'Culinary adventures' },
  { id: 'nature', label: 'Nature & outdoors', icon: '🏞️', description: 'Hiking, parks, scenery' },
  { id: 'nightlife', label: 'Nightlife', icon: '🎉', description: 'Entertainment, bars, clubs' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', description: 'Markets, boutiques' },
  { id: 'photography', label: 'Photography', icon: '📸', description: 'Sightseeing, photo spots' },
  { id: 'relaxation', label: 'Relaxation', icon: '💆', description: 'Wellness, spa, downtime' }
]

export function PhaseFour({ data, updateData, onNext, onBack }: PhaseProps) {
  const [selectedPace, setSelectedPace] = useState<TravelPace>(data.pace || 'moderate')
  const [selectedStyles, setSelectedStyles] = useState<string[]>(data.travelStyle || [])
  const [dailyHours, setDailyHours] = useState(data.dailyTravelHours || 4)

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev =>
      prev.includes(styleId) ? prev.filter(s => s !== styleId) : [...prev, styleId]
    )
  }

  const handleNext = () => {
    if (selectedStyles.length === 0) {
      alert('Please select at least one travel style')
      return
    }

    updateData({
      pace: selectedPace,
      travelStyle: selectedStyles,
      dailyTravelHours: dailyHours
    })

    onNext()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">What's your travel style?</h2>
        <p className="text-gray-600">Help us understand your ideal trip rhythm and interests</p>
      </div>

      {/* Daily Pace */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-[#2C5F6F]" />
          Daily Travel Pace
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PACE_OPTIONS.map((pace) => (
            <button
              key={pace.id}
              onClick={() => {
                setSelectedPace(pace.id)
                // Set default hours based on pace
                const hours = { relaxed: 2.5, moderate: 3.5, active: 5, intensive: 7 }
                setDailyHours(hours[pace.id])
              }}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                selectedPace === pace.id
                  ? 'border-[#2C5F6F] bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-900 mb-1">{pace.label}</div>
              <div className="text-sm text-[#2C5F6F] font-medium mb-2">{pace.hours}</div>
              <div className="text-xs text-gray-600">{pace.description}</div>
            </button>
          ))}
        </div>

        {/* Fine-tune hours */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Fine-tune daily travel time</label>
            <span className="text-lg font-bold text-[#2C5F6F]">{dailyHours}h/day</span>
          </div>
          <input
            type="range"
            min="2"
            max="8"
            step="0.5"
            value={dailyHours}
            onChange={(e) => setDailyHours(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${((dailyHours - 2) / 6) * 100}%, #e5e7eb ${((dailyHours - 2) / 6) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2h</span>
            <span>8h</span>
          </div>
        </div>
      </div>

      {/* Travel Style */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#2C5F6F]" />
          What interests you? (Select all that apply)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TRAVEL_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => toggleStyle(style.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedStyles.includes(style.id)
                  ? 'border-[#2C5F6F] bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{style.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm mb-1">{style.label}</div>
                  <div className="text-xs text-gray-600">{style.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedStyles.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Selected:</strong> {selectedStyles.length} interest{selectedStyles.length > 1 ? 's' : ''}
            </div>
          </div>
        )}
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
          className="px-8 py-3 bg-[#2C5F6F] text-white rounded-lg hover:bg-[#1e4a56] font-semibold"
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

