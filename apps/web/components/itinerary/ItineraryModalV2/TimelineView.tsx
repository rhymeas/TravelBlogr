'use client'

import { motion } from 'framer-motion'
import { DayCard } from './DayCard'

interface TimelineViewProps {
  plan: any
  locationGroups: any[]
  expandedDays: Set<number>
  onToggleDay: (dayNumber: number) => void
}

export function TimelineView({ plan, locationGroups, expandedDays, onToggleDay }: TimelineViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 md:p-12"
    >
      {/* Timeline Container */}
      <div className="relative max-w-5xl mx-auto">
        {/* Vertical gradient line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 via-purple-400 to-pink-400 rounded-full opacity-30" />

        {/* Days */}
        <div className="space-y-8">
          {plan.days.map((day: any, index: number) => (
            <DayCard
              key={day.day}
              day={day}
              index={index}
              isExpanded={expandedDays.has(day.day)}
              onToggle={() => onToggleDay(day.day)}
            />
          ))}
        </div>

        {/* Travel Tips */}
        {plan.tips && plan.tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 glass-premium rounded-2xl p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Travel Tips
            </h3>
            <ul className="space-y-3">
              {plan.tips.map((tip: string, idx: number) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="text-sm text-gray-700 leading-relaxed flex gap-3"
                >
                  <span className="text-teal-500 font-bold flex-shrink-0">•</span>
                  <span>{tip}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}