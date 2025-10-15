'use client'

/**
 * Pro Plan Toggle
 * Allows users to enable enhanced AI planning with reasoning models
 */

import { useState } from 'react'
import { Sparkles, Zap } from 'lucide-react'

interface ProPlanToggleProps {
  value: boolean
  onChange: (enabled: boolean) => void
}

export function ProPlanToggle({ value, onChange }: ProPlanToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onChange(!value)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-full flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all
          ${value
            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-md'
            : 'border-gray-200 hover:border-purple-300 bg-white'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${value
              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {value ? <Zap className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-semibold ${value ? 'text-purple-900' : 'text-gray-900'}`}>
                Pro Planner
              </h3>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                BETA
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {value 
                ? 'Enhanced AI with reasoning model active'
                : 'Enable advanced AI planning'
              }
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className={`
          relative w-12 h-6 rounded-full transition-colors
          ${value ? 'bg-purple-500' : 'bg-gray-300'}
        `}>
          <div className={`
            absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform
            ${value ? 'translate-x-6' : 'translate-x-0.5'}
          `} />
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
          <div className="font-semibold mb-1">✨ Pro Planner Features:</div>
          <ul className="space-y-1 text-gray-300">
            <li>• Advanced reasoning AI model (DeepSeek-R1)</li>
            <li>• Detailed transportation analysis</li>
            <li>• Optimized route suggestions</li>
            <li>• Enhanced travel time calculations</li>
            <li>• Better activity recommendations</li>
          </ul>
          <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
            <strong>Note:</strong> May take 10-15 seconds longer to generate
          </div>
        </div>
      )}
    </div>
  )
}

