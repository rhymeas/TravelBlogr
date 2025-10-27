'use client'

/**
 * Loading Modal for Plan Generation
 * Shows animated loading indicator while generating itinerary
 */

import { useEffect, useState } from 'react'

interface LoadingModalProps {
  isOpen: boolean
  onCancel?: () => void
}

export function LoadingModal({ isOpen, onCancel }: LoadingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = [
    'Analyzing locations',
    'Calculating routes',
    'Finding attractions',
    'Optimizing itinerary'
  ]

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
      return
    }

    // Cycle through steps every 2 seconds
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full mx-4 animate-in fade-in zoom-in duration-300">
        {/* Animated Loading Spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-rausch-500 border-r-rausch-400 rounded-full animate-spin"></div>

            {/* Inner pulsing circle */}
            <div className="absolute inset-4 bg-gradient-to-br from-rausch-100 to-rausch-50 rounded-full animate-pulse"></div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-rausch-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Generating your plan
          </h3>
          <p className="text-sm text-gray-500">
            Finding the best routes and attractions for your trip
          </p>
        </div>

        {/* Animated Steps - One at a time, centered */}
        <div className="flex flex-col items-center justify-center min-h-[120px]">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`absolute transition-all duration-700 ${
                index === currentStep
                  ? 'opacity-100 scale-100 translate-y-0'
                  : index < currentStep
                  ? 'opacity-0 scale-95 -translate-y-4'
                  : 'opacity-0 scale-95 translate-y-4'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Step indicator */}
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rausch-500 animate-pulse"></div>
                  <span className="text-lg font-medium text-gray-700">
                    {step}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-rausch-500 animate-pulse"></div>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? 'bg-rausch-500 scale-125'
                          : i < currentStep
                          ? 'bg-rausch-300'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
            >
              Cancel Generation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Removed - no longer needed with new centered animation

