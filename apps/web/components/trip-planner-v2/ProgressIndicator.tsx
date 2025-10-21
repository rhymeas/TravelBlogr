'use client'

/**
 * Progress Indicator Component
 * Shows the current phase and allows navigation between completed phases
 */

import { Check } from 'lucide-react'

interface Phase {
  id: number
  name: string
  description: string
}

interface ProgressIndicatorProps {
  phases: Phase[]
  currentPhase: number
  onPhaseClick: (phase: number) => void
}

export function ProgressIndicator({ phases, currentPhase, onPhaseClick }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-12">
      {phases.map((phase, index) => {
        const isCompleted = phase.id < currentPhase
        const isCurrent = phase.id === currentPhase
        const isClickable = phase.id <= currentPhase

        return (
          <div key={phase.id} className="relative flex items-center">
            {/* Connecting Line */}
            {index > 0 && (
              <div className="absolute right-full w-12 h-px -mr-12 bg-gray-700">
                <div
                  className="h-full transition-all duration-500 bg-blue-500"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}

            {/* Step */}
            <button
              onClick={() => isClickable && onPhaseClick(phase.id)}
              disabled={!isClickable}
              className={`flex items-center gap-2 transition-all ${
                isClickable ? 'cursor-pointer group' : 'cursor-not-allowed opacity-40'
              }`}
            >
              {/* Circle */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                  isCompleted
                    ? 'bg-blue-500 border-blue-500'
                    : isCurrent
                    ? 'bg-gray-800 border-blue-500'
                    : 'bg-gray-800 border-gray-600'
                } ${isClickable ? 'group-hover:scale-110' : ''}`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <span
                    className={`text-[10px] font-semibold ${
                      isCurrent ? 'text-blue-400' : 'text-gray-500'
                    }`}
                  >
                    {phase.id}
                  </span>
                )}
              </div>

              {/* Label */}
              <div
                className={`text-xs font-medium transition-colors ${
                  isCurrent ? 'text-white' : 'text-gray-400'
                }`}
              >
                {phase.name}
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}

