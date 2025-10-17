'use client'

/**
 * Animated Trip Reveal Component
 * Shows a centered trip card that animates into the trips grid
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Compass, Sparkles, Check } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface TripPreview {
  title: string
  destination: string
  duration: string
  activities: number
  coverImage: string
  startDate: string
  endDate: string
}

interface AnimatedTripRevealProps {
  isOpen: boolean
  tripPreview: TripPreview
  onAnimationComplete: () => void
}

export function AnimatedTripReveal({ 
  isOpen, 
  tripPreview, 
  onAnimationComplete 
}: AnimatedTripRevealProps) {
  const [stage, setStage] = useState<'centered' | 'shrinking' | 'complete'>('centered')

  useEffect(() => {
    if (!isOpen) {
      setStage('centered')
      return
    }

    // Stage 1: Show centered for 1.5 seconds
    const timer1 = setTimeout(() => {
      setStage('shrinking')
    }, 1500)

    // Stage 2: Shrink and fly away for 1 second
    const timer2 = setTimeout(() => {
      setStage('complete')
      onAnimationComplete()
    }, 2500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [isOpen, onAnimationComplete])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {stage !== 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          {/* Centered Trip Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -50 }}
            animate={
              stage === 'centered'
                ? { scale: 1, opacity: 1, y: 0 }
                : {
                    scale: 0.3,
                    opacity: 0,
                    x: window.innerWidth / 2 - 200,
                    y: window.innerHeight / 2 - 150,
                  }
            }
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 150,
              duration: stage === 'centered' ? 0.5 : 1,
            }}
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full mx-4"
          >
            {/* Success Badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', damping: 15 }}
              className="absolute top-4 right-4 z-10 bg-teal-500 text-white rounded-full p-3 shadow-lg"
            >
              <Check className="h-6 w-6" />
            </motion.div>

            {/* Sparkles Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-4 left-4 z-10"
            >
              <Sparkles className="h-6 w-6 text-yellow-400" />
            </motion.div>

            {/* Cover Image */}
            <div className="relative h-64 w-full">
              <Image
                src={tripPreview.coverImage}
                alt={tripPreview.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  {tripPreview.title}
                </motion.h2>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 text-white/90"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">{tripPreview.destination}</span>
                </motion.div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="p-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-4 mb-6"
              >
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-teal-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-900">{tripPreview.duration}</div>
                  <div className="text-xs text-gray-600">Duration</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-teal-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-900">
                    {tripPreview.destination.split('→').length}
                  </div>
                  <div className="text-xs text-gray-600">Locations</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Compass className="h-5 w-5 text-teal-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-900">{tripPreview.activities}</div>
                  <div className="text-xs text-gray-600">Activities</div>
                </div>
              </motion.div>

              {/* Success Message */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>Trip created successfully!</span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Taking you to your trips...
                </p>
              </motion.div>
            </div>

            {/* Animated Border Glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border-4 border-teal-400 rounded-2xl pointer-events-none"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

