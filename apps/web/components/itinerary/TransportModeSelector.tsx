'use client'

/**
 * Transport Mode Selector
 * Allows users to select their preferred mode of transportation
 */

import { useState } from 'react'
import { Car, Train, Bus, Plane, Shuffle } from 'lucide-react'

export type TransportMode = 'car' | 'train' | 'bus' | 'flight' | 'mixed'

interface TransportModeOption {
  id: TransportMode
  label: string
  icon: React.ReactNode
  avgSpeed: number // km/h for route calculation
  description: string
  color: string
}

const TRANSPORT_MODES: TransportModeOption[] = [
  {
    id: 'car',
    label: 'Car / Road Trip',
    icon: <Car className="w-5 h-5" />,
    avgSpeed: 80,
    description: 'Flexible stops, scenic routes',
    color: 'blue'
  },
  {
    id: 'train',
    label: 'Train',
    icon: <Train className="w-5 h-5" />,
    avgSpeed: 100,
    description: 'Comfortable, city-to-city',
    color: 'green'
  },
  {
    id: 'bus',
    label: 'Bus / Coach',
    icon: <Bus className="w-5 h-5" />,
    avgSpeed: 60,
    description: 'Budget-friendly travel',
    color: 'orange'
  },
  {
    id: 'flight',
    label: 'Flight',
    icon: <Plane className="w-5 h-5" />,
    avgSpeed: 500,
    description: 'Long distances, major cities',
    color: 'purple'
  },
  {
    id: 'mixed',
    label: 'Mixed Transport',
    icon: <Shuffle className="w-5 h-5" />,
    avgSpeed: 80,
    description: 'Combination of methods',
    color: 'gray'
  }
]

interface TransportModeSelectorProps {
  value: TransportMode
  onChange: (mode: TransportMode) => void
}

export function TransportModeSelector({ value, onChange }: TransportModeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {TRANSPORT_MODES.map((mode) => {
          const isSelected = value === mode.id
          
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              className={`
                relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                ${isSelected
                  ? 'border-black bg-gray-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`
                ${isSelected ? 'text-black' : 'text-gray-600'}
              `}>
                {mode.icon}
              </div>
              <div className="text-center">
                <div className={`text-xs font-semibold ${isSelected ? 'text-black' : 'text-gray-700'}`}>
                  {mode.label}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {mode.description}
                </div>
              </div>
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full" />
              )}
            </button>
          )
        })}
      </div>
      
      {/* Speed info */}
      <p className="text-xs text-gray-500 pl-1">
        Avg. speed: {TRANSPORT_MODES.find(m => m.id === value)?.avgSpeed} km/h
      </p>
    </div>
  )
}

export function getSpeedForMode(mode: TransportMode): number {
  return TRANSPORT_MODES.find(m => m.id === mode)?.avgSpeed || 80
}

