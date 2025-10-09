'use client'

import { X, MapPin, Calendar, DollarSign, Compass, Utensils, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatLocationDisplay } from '@/lib/utils/locationFormatter'

interface HeroProps {
  plan: any
  locationGroups: any[]
  totalCost: number
  onClose: () => void
}

export function Hero({ plan, locationGroups, totalCost, onClose }: HeroProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 via-purple-400/20 to-pink-400/20 animate-gradient-shift" />
      
      {/* Floating orbs for visual interest */}
      <div className="absolute top-10 right-20 w-32 h-32 bg-teal-300/30 rounded-full blur-3xl animate-gentle-float" />
      <div className="absolute bottom-10 left-20 w-40 h-40 bg-purple-300/30 rounded-full blur-3xl animate-gentle-float" style={{ animationDelay: '1s' }} />

      <div className="relative px-8 md:px-12 py-8 md:py-10">
        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="absolute top-6 right-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg transition-all group"
        >
          <X className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
        </motion.button>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 pr-16"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              {plan.title}
            </h2>
          </div>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl">
            {plan.summary}
          </p>
        </motion.div>

        {/* Journey Route - Horizontal scroll on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 overflow-x-auto scrollbar-hide"
        >
          <div className="flex items-center gap-3 pb-2 min-w-max">
            {locationGroups.map((group: any, index: number) => {
              const formatted = formatLocationDisplay(group.location)
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="glass-premium rounded-2xl px-5 py-3 flex items-center gap-3 hover:scale-105 transition-transform">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-lg">{formatted.main}</span>
                      {formatted.secondary && (
                        <span className="text-sm text-gray-500">({formatted.secondary})</span>
                      )}
                    </div>
                    <span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                      {group.days.length}d
                    </span>
                  </div>
                  {index < locationGroups.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Stats Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3"
        >
          <div className="glass-premium rounded-full px-5 py-2.5 flex items-center gap-2.5 hover:scale-105 transition-transform">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">{plan.stats.totalDays} days</span>
          </div>
          <div className="glass-premium rounded-full px-5 py-2.5 flex items-center gap-2.5 hover:scale-105 transition-transform">
            <Compass className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">{plan.stats.totalActivities} activities</span>
          </div>
          <div className="glass-premium rounded-full px-5 py-2.5 flex items-center gap-2.5 hover:scale-105 transition-transform">
            <Utensils className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">{plan.stats.totalMeals} meals</span>
          </div>
          <div className="glass-premium rounded-full px-5 py-2.5 flex items-center gap-2.5 hover:scale-105 transition-transform">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900">${totalCost.toLocaleString()}</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}