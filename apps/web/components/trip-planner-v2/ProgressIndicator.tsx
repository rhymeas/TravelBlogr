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
    <div className="flex items-center justify-center gap-8">
      {phases.map((phase, index) => {
        const isCompleted = phase.id < currentPhase
        const isCurrent = phase.id === currentPhase
        const isClickable = phase.id <= currentPhase

        return (
          <div key={phase.id} className="flex items-center">
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
                    ? 'shadow-sm'
                    : isCurrent
                    ? 'bg-white shadow-md'
                    : 'bg-white border-gray-300'
                } ${isClickable ? 'group-hover:scale-110' : ''}`}
                style={
                  isCompleted
                    ? { 
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        border: 'none'
                      }
                    : isCurrent
                    ? { border: '2px solid var(--color-primary)' }
                    : {}
                }
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                ) : (
                  <span
                    className={`text-[10px] font-semibold ${
                      isCurrent ? '' : 'text-gray-400'
                    }`}
                    style={isCurrent ? { color: 'var(--color-primary)' } : {}}
                  >
                    {phase.id}
                  </span>
                )}
              </div>

              {/* Label */}
              <div
                className={`text-xs font-medium transition-colors ${
                  isCurrent ? 'text-gray-900' : 'text-gray-500'
                }`}
                style={isCurrent ? { color: 'var(--color-primary)' } : {}}
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

