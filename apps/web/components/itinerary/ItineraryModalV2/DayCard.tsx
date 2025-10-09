'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronDown, MapPin } from 'lucide-react'
import { ActivityItem } from './ActivityItem'
import { formatLocationDisplay } from '@/lib/utils/locationFormatter'

interface DayCardProps {
  day: any
  index: number
  isExpanded: boolean
  onToggle: () => void
}

export function DayCard({ day, index, isExpanded, onToggle }: DayCardProps) {
  const activities = day.items.filter((item: any) => item.type === 'activity')
  const meals = day.items.filter((item: any) => item.type === 'meal')
  const travel = day.items.filter((item: any) => item.type === 'travel')
  const formatted = formatLocationDisplay(day.location)

  const dayCost = day.items.reduce((sum: number, item: any) => sum + (item.costEstimate || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative pl-16"
    >
      {/* Timeline dot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 + 0.2, type: 'spring', bounce: 0.5 }}
        className="absolute left-4 top-8 w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg border-4 border-white z-10"
      />

      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="luxury-card rounded-2xl overflow-hidden cursor-pointer"
        onClick={onToggle}
      >
        {/* Card Header */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {day.day}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Day {day.day}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-medium">{formatted.main}</span>
                    {formatted.secondary && (
                      <span className="text-gray-400">• {formatted.secondary}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{day.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  {activities.length > 0 && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {activities.length} activities
                    </span>
                  )}
                  {meals.length > 0 && (
                    <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {meals.length} meals
                    </span>
                  )}
                  {dayCost > 0 && (
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      ${dayCost}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </motion.div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
                <div className="space-y-4">
                  {/* Activities */}
                  {activities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Activities & Sightseeing
                      </h4>
                      <div className="space-y-2">
                        {activities.map((item: any, idx: number) => (
                          <ActivityItem key={idx} item={item} index={idx} color="blue" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meals */}
                  {meals.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Dining & Restaurants
                      </h4>
                      <div className="space-y-2">
                        {meals.map((item: any, idx: number) => (
                          <ActivityItem key={idx} item={item} index={idx} color="orange" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}