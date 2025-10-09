'use client'

import { motion } from 'framer-motion'
import { Clock, DollarSign } from 'lucide-react'

interface ActivityItemProps {
  item: any
  index: number
  color: 'blue' | 'orange'
}

export function ActivityItem({ item, index, color }: ActivityItemProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50/50',
      border: 'border-blue-100',
      time: 'text-blue-600',
      dot: 'bg-blue-400'
    },
    orange: {
      bg: 'bg-orange-50/50',
      border: 'border-orange-100',
      time: 'text-orange-600',
      dot: 'bg-orange-400'
    }
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`${colors.bg} ${colors.border} border rounded-xl p-4 hover:shadow-md transition-all`}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 text-sm font-semibold ${colors.time} w-16`}>
          {item.time}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-gray-900 mb-1.5 text-sm">
            {item.title}
          </h5>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            {item.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.duration}h
            </span>
            {item.costEstimate > 0 && (
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <DollarSign className="h-3 w-3" />
                ${item.costEstimate}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}