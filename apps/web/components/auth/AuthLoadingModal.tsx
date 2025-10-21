'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AuthLoadingModalProps {
  message?: string
  error?: string | null
  showDelayMessage?: boolean
  success?: boolean
}

export function AuthLoadingModal({
  message = "Signing you in...",
  error,
  showDelayMessage = false,
  success = false
}: AuthLoadingModalProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative mx-4 w-full max-w-sm"
        >
          {/* Modal Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800">
            {/* Gradient Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            {/* Content */}
            <div className="p-8">
              {success ? (
                // Success State
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <svg
                      className="h-6 w-6 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Success!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You're signed in. Closing window...
                  </p>
                </div>
              ) : error ? (
                // Error State
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    <svg
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Authentication Error
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Redirecting to sign in...
                  </p>
                </div>
              ) : (
                // Loading State
                <div className="text-center">
                  {/* Animated Spinner */}
                  <div className="mx-auto mb-6 relative h-16 w-16">
                    {/* Outer Ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Spinning Gradient Ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                    {/* Inner Pulse */}
                    <motion.div
                      className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </div>

                  {/* Message */}
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {message}
                  </h3>
                  
                  {/* Animated Dots */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-5">
                    <span className="inline-block w-12 text-left">{dots}</span>
                  </p>

                  {/* Delay Message */}
                  <AnimatePresence>
                    {showDelayMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-100 dark:border-blue-800"
                      >
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          This is taking longer than usual. Please wait...
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Subtle Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Securing your connection
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Glow Effect */}
          <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

