/**
 * Progressive Loader Component
 * 
 * Shows loading progress for progressive data loading.
 * Displays 3 stages: cached → enhanced → validated
 */

import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'

interface ProgressiveLoaderProps {
  progress: number // 0-100
  stage: 'idle' | 'cached' | 'enhanced' | 'validated' | 'complete'
  cachedCount?: number
  enhancedCount?: number
  validatedCount?: number
  className?: string
}

export function ProgressiveLoader({
  progress,
  stage,
  cachedCount = 0,
  enhancedCount = 0,
  validatedCount = 0,
  className = ''
}: ProgressiveLoaderProps) {
  const stages = [
    {
      id: 'cached',
      label: 'Cached Data',
      description: 'Loading from cache',
      count: cachedCount,
      active: stage === 'cached',
      complete: ['enhanced', 'validated', 'complete'].includes(stage)
    },
    {
      id: 'enhanced',
      label: 'Enhanced Data',
      description: 'Fetching from APIs',
      count: enhancedCount,
      active: stage === 'enhanced',
      complete: ['validated', 'complete'].includes(stage)
    },
    {
      id: 'validated',
      label: 'AI Validated',
      description: 'GROQ validation',
      count: validatedCount,
      active: stage === 'validated',
      complete: stage === 'complete'
    }
  ]

  if (stage === 'idle' || stage === 'complete') {
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Loading POIs...
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-2">
        {stages.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-3 p-2 rounded ${
              s.active ? 'bg-blue-50' : s.complete ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {s.complete ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : s.active ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
            </div>

            {/* Label */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${
                  s.active ? 'text-blue-900' : s.complete ? 'text-green-900' : 'text-gray-500'
                }`}>
                  {s.label}
                </p>
                {s.id === 'validated' && (
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                )}
              </div>
              <p className={`text-xs ${
                s.active ? 'text-blue-700' : s.complete ? 'text-green-700' : 'text-gray-400'
              }`}>
                {s.description}
              </p>
            </div>

            {/* Count */}
            {s.count > 0 && (
              <div className={`text-sm font-semibold ${
                s.active ? 'text-blue-600' : s.complete ? 'text-green-600' : 'text-gray-400'
              }`}>
                {s.count}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Compact version for inline display
 */
export function ProgressiveLoaderCompact({
  progress,
  stage,
  className = ''
}: Pick<ProgressiveLoaderProps, 'progress' | 'stage' | 'className'>) {
  if (stage === 'idle' || stage === 'complete') {
    return null
  }

  const stageLabels = {
    cached: 'Loading cached data...',
    enhanced: 'Fetching fresh data...',
    validated: 'AI validation...',
    idle: '',
    complete: ''
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      <div className="flex-1">
        <p className="text-sm text-gray-700">{stageLabels[stage]}</p>
        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
    </div>
  )
}

