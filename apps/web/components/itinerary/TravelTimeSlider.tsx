'use client'

/**
 * Travel time preference slider
 */

import { useState } from 'react'

interface TravelTimeSliderProps {
  value: number
  onChange: (value: number) => void
}

export function TravelTimeSlider({ value, onChange }: TravelTimeSliderProps) {
  const [localValue, setLocalValue] = useState(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    setLocalValue(newValue)
    onChange(newValue)
  }

  const getLabel = () => {
    if (localValue <= 3) return 'Short drives'
    if (localValue <= 5) return 'Moderate travel'
    if (localValue <= 7) return 'Long journeys'
    return 'Epic road trip'
  }

  const getDescription = () => {
    if (localValue <= 3) return 'Up to 3 hours per day'
    if (localValue <= 5) return 'Up to 5 hours per day'
    if (localValue <= 7) return 'Up to 7 hours per day'
    return 'Up to 10 hours per day'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">{getLabel()}</div>
          <div className="text-xs text-gray-500">{getDescription()}</div>
        </div>
        <div className="text-2xl font-bold text-gray-900">{localValue}h</div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={localValue}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #000 0%, #000 ${((localValue - 1) / 9) * 100}%, #e5e7eb ${((localValue - 1) / 9) * 100}%, #e5e7eb 100%)`
          }}
        />
        
        {/* Tick marks */}
        <div className="flex justify-between mt-2 px-1">
          {[1, 3, 5, 7, 10].map(tick => (
            <div
              key={tick}
              className={`text-xs ${localValue === tick ? 'text-black font-semibold' : 'text-gray-400'}`}
            >
              {tick}h
            </div>
          ))}
        </div>
      </div>

      {/* Icons */}
      <div className="flex items-center justify-between text-gray-400 px-1">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #000;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .slider::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #000;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
        .slider::-moz-range-thumb:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  )
}

