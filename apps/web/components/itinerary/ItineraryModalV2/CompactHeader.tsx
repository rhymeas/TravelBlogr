'use client'

import { MapPin, Calendar, DollarSign, Compass, Utensils, ArrowRight } from 'lucide-react'
import { formatLocationDisplay } from '@/lib/utils/locationFormatter'

interface CompactHeaderProps {
  plan: any
  locationGroups: any[]
  totalCost: number
}

export function CompactHeader({ plan, locationGroups, totalCost }: CompactHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <div className="px-5 py-3">
        {/* Title and Summary - Compact */}
        <div className="mb-2">
          <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">
            {plan.title}
          </h2>
          <p className="text-xs text-gray-600 leading-snug line-clamp-2">
            {plan.summary}
          </p>
        </div>

        {/* Route - Compact horizontal */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto scrollbar-hide pb-1">
          {locationGroups.map((group: any, index: number) => {
            const formatted = formatLocationDisplay(group.location)
            return (
              <div key={index} className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-md">
                  <MapPin className="h-3 w-3 text-teal-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-900">{formatted.main}</span>
                  <span className="text-[10px] text-gray-500 font-medium">{group.days.length}d</span>
                </div>
                {index < locationGroups.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Stats - Ultra compact */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1 text-gray-700">
            <Calendar className="h-3 w-3 text-blue-600" />
            <span className="font-medium">{plan.stats.totalDays}d</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700">
            <Compass className="h-3 w-3 text-purple-600" />
            <span className="font-medium">{plan.stats.totalActivities}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700">
            <Utensils className="h-3 w-3 text-orange-600" />
            <span className="font-medium">{plan.stats.totalMeals}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700">
            <DollarSign className="h-3 w-3 text-green-600" />
            <span className="font-semibold">${totalCost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}