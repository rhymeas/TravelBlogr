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
      {/* Progress Bar - Bolder */}
      <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
        <div
          className="h-full bg-[#2C5F6F] transition-all duration-500 rounded-full"
          style={{ width: `${((currentPhase - 1) / (phases.length - 1)) * 100}%` }}
        />
      </div>

      {/* Phase Steps - Bolder and closer */}
      <div className="relative flex justify-center gap-32">
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
              {/* Circle - Bolder */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-3 transition-all shadow-md ${
                  isCompleted
                    ? 'bg-[#2C5F6F] border-[#2C5F6F]'
                    : isCurrent
                    ? 'bg-white border-[#2C5F6F] ring-4 ring-[#2C5F6F]/30'
                    : 'bg-white border-gray-300'
                } ${isClickable ? 'group-hover:scale-110' : ''}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      isCurrent ? 'text-[#2C5F6F]' : 'text-gray-400'
                    }`}
                  >
                    {phase.id}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <div
                  className={`text-xs font-bold ${
                    isCurrent ? 'text-[#2C5F6F]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {phase.name}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{phase.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

