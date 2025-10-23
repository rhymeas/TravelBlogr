'use client'

import { useState } from 'react'
import { Check, Clock, DollarSign, Mountain, Users, Utensils, Waves, Heart } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LocationActivity } from '@/lib/data/locationsData'

interface LocationActivitiesProps {
  locationSlug?: string
  activities: LocationActivity[]
  locationName: string
}

const categoryIcons = {
  outdoor: Mountain,
  cultural: Users,
  food: Utensils,
  adventure: Waves,
  relaxation: Heart
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
}

const costColors = {
  free: 'bg-green-100 text-green-800',
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

export function LocationActivities({ activities, locationName }: LocationActivitiesProps) {
  const [checkedActivities, setCheckedActivities] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  // Show only 6 activities by default
  const INITIAL_DISPLAY_COUNT = 6
  const displayedActivities = showAll ? activities : activities.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMore = activities.length > INITIAL_DISPLAY_COUNT

  const toggleActivity = (activityId: string) => {
    const newChecked = new Set(checkedActivities)
    if (newChecked.has(activityId)) {
      newChecked.delete(activityId)
    } else {
      newChecked.add(activityId)
    }
    setCheckedActivities(newChecked)
  }

  if (!activities || activities.length === 0) {
    return null
  }

  return (
    <Card className="card-elevated p-6 mb-8">
      <h3 className="text-title-medium font-semibold text-sleek-black mb-4">
        Things to Do in {locationName}
      </h3>
      <p className="text-body-medium text-sleek-gray mb-6">
        Check off activities as you complete them during your visit
      </p>
      
      <div className="space-y-4">
        {displayedActivities.map((activity) => {
          const IconComponent = categoryIcons[activity.category] || Mountain
          const isChecked = checkedActivities.has(activity.id)
          
          return (
            <div
              key={activity.id}
              className={`flex items-start gap-4 p-4 rounded-sleek-medium border transition-all duration-200 cursor-pointer hover:shadow-sleek-small ${
                isChecked 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-sleek-border hover:border-sleek-dark-gray'
              }`}
              onClick={() => toggleActivity(activity.id)}
            >
              {/* Checkbox */}
              <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                isChecked 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-sleek-border hover:border-green-400'
              }`}>
                {isChecked && <Check className="h-4 w-4 text-white" />}
              </div>

              {/* Activity Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-rausch-50 rounded-sleek-small flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-rausch-500" />
              </div>

              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h4 className={`text-body-large font-semibold transition-colors truncate ${
                    isChecked ? 'text-green-800 line-through' : 'text-sleek-black'
                  }`}>
                    {activity.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    {activity.duration && (
                      <Badge className="bg-gray-100 text-sleek-gray text-xs flex items-center gap-1 cursor-default select-none">
                        <Clock className="h-3 w-3 text-sleek-gray" />
                        {activity.duration}
                      </Badge>
                    )}
                    {activity.cost && (
                      <Badge className="bg-gray-100 text-sleek-gray text-xs flex items-center gap-1 cursor-default select-none">
                        <DollarSign className="h-3 w-3 text-sleek-gray" />
                        {activity.cost}
                      </Badge>
                    )}
                    {activity.difficulty && (
                      <Badge className="bg-gray-100 text-sleek-gray text-xs cursor-default select-none">
                        {activity.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-body-medium text-sleek-dark-gray">
                  {activity.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load More Button */}
      {hasMore && !showAll && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2 bg-white border-2 border-sleek-border rounded-sleek-small text-body-medium font-semibold text-sleek-black hover:border-sleek-dark-gray hover:shadow-sleek-small transition-all duration-200"
          >
            Load More Activities ({activities.length - INITIAL_DISPLAY_COUNT} more)
          </button>
        </div>
      )}

      {/* Show Less Button */}
      {showAll && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(false)}
            className="px-6 py-2 bg-white border-2 border-sleek-border rounded-sleek-small text-body-medium font-semibold text-sleek-black hover:border-sleek-dark-gray hover:shadow-sleek-small transition-all duration-200"
          >
            Show Less
          </button>
        </div>
      )}

      {/* Progress Summary */}
      <div className="mt-6 pt-4 border-t border-sleek-border">
        <div className="flex items-center justify-between text-body-small text-sleek-gray">
          <span>
            {checkedActivities.size} of {activities.length} activities completed
          </span>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(checkedActivities.size / activities.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
