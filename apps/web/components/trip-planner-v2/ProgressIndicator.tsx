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
    <div className="relative py-1">
      {/* Progress Bar - Using global CSS colors */}
      <div className="absolute top-1/2 left-[20%] right-[20%] h-0.5 bg-gray-200 -translate-y-1/2">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ 
            width: `${((currentPhase - 1) / (phases.length - 1)) * 100}%`,
            background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))'
          }}
        />
      </div>

      {/* Phase Steps - Compact bubbles with step numbers */}
      <div className="relative flex justify-center items-center gap-24">
        {phases.map((phase) => {
          const isCompleted = phase.id < currentPhase
          const isCurrent = phase.id === currentPhase
          const isClickable = phase.id <= currentPhase

          return (
            <button
              key={phase.id}
              onClick={() => isClickable && onPhaseClick(phase.id)}
              disabled={!isClickable}
              className={`flex flex-col items-center group relative ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >

              {/* Circle - Smaller */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-[#2C5F6F] border-[#2C5F6F]'
                    : isCurrent
                    ? 'bg-white border-[#2C5F6F] ring-2 ring-[#2C5F6F]/20'
                    : 'bg-white border-gray-300'
                } ${isClickable ? 'group-hover:scale-105' : ''}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-[#2C5F6F]' : 'text-gray-400'
                    }`}
                  >
                    {phase.id}
                  </span>
                )}
              </div>

              {/* Label - Below bubble with step number */}
              <div className="mt-2 text-center">
                <div
                  className={`text-xs font-semibold tracking-tight ${
                    isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}
                  style={isCurrent ? { color: 'var(--color-primary)' } : {}}
                >
                  Step {phase.id}: {phase.name}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {phase.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

