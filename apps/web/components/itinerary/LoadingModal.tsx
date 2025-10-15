'use client'

/**
 * Loading Modal for Plan Generation
 * Shows animated loading indicator while generating itinerary
 */

import { useEffect, useState } from 'react'

interface LoadingModalProps {
  isOpen: boolean
}

export function LoadingModal({ isOpen }: LoadingModalProps) {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.'
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        {/* Animated Loading Spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative w-20 h-20">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-rausch-500 rounded-full animate-spin"></div>
            
            {/* Inner pulsing circle */}
            <div className="absolute inset-3 bg-rausch-100 rounded-full animate-pulse"></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-rausch-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Generating your plan{dots}
          </h3>
          <p className="text-sm text-gray-600">
            Finding the best routes and attractions for your trip
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mt-6 space-y-2">
          <LoadingStep text="Analyzing locations" delay={0} />
          <LoadingStep text="Calculating routes" delay={800} />
          <LoadingStep text="Finding attractions" delay={1600} />
          <LoadingStep text="Optimizing itinerary" delay={2400} />
        </div>
      </div>
    </div>
  )
}

function LoadingStep({ text, delay }: { text: string; delay: number }) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsActive(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`flex items-center gap-2 text-sm transition-all duration-500 ${
      isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
        isActive ? 'bg-rausch-500' : 'bg-gray-300'
      }`}></div>
      <span className={`transition-colors duration-300 ${
        isActive ? 'text-gray-900' : 'text-gray-400'
      }`}>{text}</span>
    </div>
  )
}

