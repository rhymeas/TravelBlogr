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
    <div className="relative">
      {/* Progress Bar */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
        <div
          className="h-full bg-emerald-600 transition-all duration-500"
          style={{ width: `${((currentPhase - 1) / (phases.length - 1)) * 100}%` }}
        />
      </div>

      {/* Phase Steps */}
      <div className="relative flex justify-between">
        {phases.map((phase) => {
          const isCompleted = phase.id < currentPhase
          const isCurrent = phase.id === currentPhase
          const isClickable = phase.id <= currentPhase

          return (
            <button
              key={phase.id}
              onClick={() => isClickable && onPhaseClick(phase.id)}
              disabled={!isClickable}
              className={`flex flex-col items-center group ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-600'
                    : isCurrent
                    ? 'bg-white border-emerald-600 ring-4 ring-emerald-100'
                    : 'bg-white border-gray-300'
                } ${isClickable ? 'group-hover:scale-110' : ''}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  >
                    {phase.id}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="mt-2 text-center max-w-[120px]">
                <div
                  className={`text-xs font-semibold ${
                    isCurrent ? 'text-emerald-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {phase.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{phase.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

