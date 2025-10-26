'use client'

import { useState, useEffect } from 'react'
import { Check, Clock, DollarSign, Mountain, Users, Utensils, Waves, Heart, ExternalLink, Globe, Phone, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LocationActivity } from '@/lib/data/locationsData'
import { useAuth } from '@/hooks/useAuth'

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
  const { isAuthenticated } = useAuth()
  const [checkedActivities, setCheckedActivities] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  // Show only 6 activities by default
  const INITIAL_DISPLAY_COUNT = 6
  const displayedActivities = showAll ? activities : activities.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMore = activities.length > INITIAL_DISPLAY_COUNT

  // V2 planner parity: enrichment for images/links via Brave endpoint
  const [enrichments, setEnrichments] = useState<Record<string, any>>({})
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    const toFetch = displayedActivities.filter(a => !enrichments[a.id])
    if (toFetch.length === 0) return

    ;(async () => {
      for (const a of toFetch) {
        try {
          setLoadingIds(prev => new Set(prev).add(a.id))
          const params = new URLSearchParams({
            name: a.name,
            location: locationName,
            type: 'activity',
            count: '1'
          })
          const res = await fetch(`/api/brave/activity-image?${params.toString()}`)
          const json = await res.json()
          const link = json?.data?.links?.[0] || null
          if (!cancelled) {
            setEnrichments(prev => ({ ...prev, [a.id]: link || {} }))
          }
        } catch (e) {
          // non-fatal
        } finally {
          setLoadingIds(prev => { const next = new Set(prev); next.delete(a.id); return next })
        }
      }
    })()

    return () => { cancelled = true }
  }, [locationName, displayedActivities.map(a => a.id).join(',')])

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
          
          const imgUrl = activity.image_url || (activity as any).image || enrichments[activity.id]?.thumbnail
          const linkHref = activity.link_url || activity.website || enrichments[activity.id]?.url
          const enrich = enrichments[activity.id] || {}

          return (
            <div
              key={activity.id}
              className={`flex items-start gap-4 p-4 rounded-sleek-medium border transition-all duration-200 ${
                isAuthenticated ? 'cursor-pointer' : 'cursor-default'
              } hover:shadow-sleek-small ${
                isChecked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-sleek-border hover:border-sleek-dark-gray'
              }`}
              onClick={() => isAuthenticated && toggleActivity(activity.id)}
            >
              {/* Checkbox (auth users only) */}
              {isAuthenticated && (
                <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  isChecked
                    ? 'bg-green-500 border-green-500'
                    : 'border-sleek-border hover:border-green-400'
                }`}>
                  {isChecked && <Check className="h-4 w-4 text-white" />}
                </div>
              )}

              {/* Activity Image or Icon (with V2 enrichment) */}
              {imgUrl ? (
                <div className="flex-shrink-0 w-16 h-16 rounded-sleek-small overflow-hidden bg-gray-100">
                  <img
                    src={imgUrl}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-rausch-50 flex items-center justify-center">
                          <svg class="h-6 w-6 text-rausch-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                      `
                    }}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-16 h-16 bg-rausch-50 rounded-sleek-small flex items-center justify-center">
                  <IconComponent className="h-6 w-6 text-rausch-500" />
                </div>
              )}

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
                <p className="text-body-medium text-sleek-dark-gray mb-2">
                  {activity.description}
                </p>

                {/* Activity Link (V2 parity: use enrichment + provider pills) */}
                {linkHref && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <a
                      href={linkHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-rausch-500 hover:text-rausch-600 font-medium transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Learn more
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <div className="inline-flex items-center gap-2 text-xs text-sleek-gray">
                      {enrich?.phone && (
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{enrich.phone}</span>
                      )}
                      {enrich?.website && (
                        <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />Website</span>
                      )}
                      {enrich?.directionsUrl && (
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />Directions</span>
                      )}
                    </div>
                  </div>
                )}
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
