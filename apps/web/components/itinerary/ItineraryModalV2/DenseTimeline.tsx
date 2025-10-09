'use client'

import { DenseDayCard } from './DenseDayCard'

interface DenseTimelineProps {
  plan: any
  locationGroups: any[]
  expandedDays: Set<number>
  onToggleDay: (dayNumber: number) => void
}

export function DenseTimeline({ plan, locationGroups, expandedDays, onToggleDay }: DenseTimelineProps) {
  return (
    <div className="px-4 py-3">
      {/* Compact Timeline */}
      <div className="relative">
        {/* Thin timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-teal-300 via-purple-300 to-pink-300" />

        {/* Days - Compact spacing */}
        <div className="space-y-2">
          {plan.days.map((day: any, index: number) => (
            <DenseDayCard
              key={day.day}
              day={day}
              index={index}
              isExpanded={expandedDays.has(day.day)}
              onToggle={() => onToggleDay(day.day)}
            />
          ))}
        </div>

        {/* Travel Tips - Compact */}
        {plan.tips && plan.tips.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <span>💡</span>
              Travel Tips
            </h3>
            <ul className="space-y-1.5">
              {plan.tips.map((tip: string, idx: number) => (
                <li key={idx} className="text-[11px] text-gray-700 leading-snug flex gap-2">
                  <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}