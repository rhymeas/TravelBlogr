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
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
        <div
          className="h-full bg-[#2C5F6F] transition-all duration-500"
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

              {/* Label */}
              <div className="mt-1.5 text-center max-w-[100px]">
                <div
                  className={`text-[10px] font-semibold ${
                    isCurrent ? 'text-[#2C5F6F]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {phase.name}
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5 hidden sm:block">{phase.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

