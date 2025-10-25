'use client'

import { useState, useEffect } from 'react'
import { Check, Clock, DollarSign, Mountain, Users, Utensils, Waves, Heart, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { LocationActivity } from '@/lib/data/locationsData'
import { InlineLocationEditor } from './InlineLocationEditor'

interface EditableLocationActivitiesProps {
  locationId: string
  locationSlug: string
  activities: LocationActivity[]
  locationName: string
  enabled?: boolean
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

const costLabels = {
  free: 'Free',
  low: '$',
  medium: '$$',
  high: '$$$'
}

export function EditableLocationActivities({
  locationId,
  locationSlug,
  activities: initialActivities,
  locationName,
  enabled = false,
}: EditableLocationActivitiesProps) {
  const [activities, setActivities] = useState(initialActivities)
  const [checkedActivities, setCheckedActivities] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  // Enrichment state (per-activity)
  const [activityImages, setActivityImages] = useState<Record<string, string>>({})
  const [loadingImage, setLoadingImage] = useState<Record<string, boolean>>({})
  const [activityLinks, setActivityLinks] = useState<Record<string, { title: string; url: string; source: string }[]>>({})
  const [loadingLinks, setLoadingLinks] = useState<Record<string, boolean>>({})


  // Auto-fetch images for ALL activities (Brave ➜ Reddit ➜ Pexels)
  // This runs for activities without image_url OR with potentially broken image_url
  useEffect(() => {
    if (!activities || activities.length === 0) return

    const timers: Array<ReturnType<typeof setTimeout>> = []

    activities.forEach((a, idx) => {
      // Skip if we already have a fetched image in state
      if (activityImages[a.id] || loadingImage[a.id]) return

      // Fetch image for activities without image_url
      if (!(a as any).image_url) {
        const t = setTimeout(() => {
          console.log(`🎯 Auto-fetching image for "${a.name}" (no DB image)`)
          handleFindImage(a, locationName)
        }, idx * 150) // stagger to avoid bursts
        timers.push(t)
      }
    })

    return () => {
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, locationName])

  const handleFindImage = async (a: LocationActivity, locationName: string) => {
    setLoadingImage(prev => ({ ...prev, [a.id]: true }))
    try {
      // Primary: our unified image stack (Brave ➜ Reddit ➜ Pexels)
      const res = await fetch(`/api/activities/find-image?activityName=${encodeURIComponent(a.name)}&locationName=${encodeURIComponent(locationName)}`)
      const json = await res.json()
      console.log(`📸 Activity image fetch for "${a.name}":`, json)
      if (json?.success && json.url) {
        console.log(`✅ Setting image for ${a.name}: ${json.url}`)
        setActivityImages(prev => ({ ...prev, [a.id]: json.url }))
      } else if ((a as any).link_url) {
        // Fallback: try to extract OG/Twitter image from the linked page
        try {
          console.log(`🔗 Trying link preview for ${a.name}: ${(a as any).link_url}`)
          const linkRes = await fetch(`/api/activities/link-preview?url=${encodeURIComponent((a as any).link_url)}`)
          const linkJson = await linkRes.json()
          console.log(`🔗 Link preview result:`, linkJson)
          if (linkJson?.success && linkJson.image) {
            console.log(`✅ Setting image from link for ${a.name}: ${linkJson.image}`)
            setActivityImages(prev => ({ ...prev, [a.id]: linkJson.image }))
          }
        } catch (e) {
          console.error(`❌ Link preview error for ${a.name}:`, e)
        }
      }
    } catch (e) {
      console.error(`❌ Image fetch error for ${a.name}:`, e)
    }
    setLoadingImage(prev => ({ ...prev, [a.id]: false }))
  }

  const handleFindLinks = async (a: LocationActivity, locationName: string) => {
    setLoadingLinks(prev => ({ ...prev, [a.id]: true }))
    try {
      const res = await fetch(`/api/activities/find-links?activityName=${encodeURIComponent(a.name)}&locationName=${encodeURIComponent(locationName)}`)
      const json = await res.json()
      if (json?.success && Array.isArray(json.links)) {
        setActivityLinks(prev => ({ ...prev, [a.id]: json.links }))
      }
    } catch {}
    setLoadingLinks(prev => ({ ...prev, [a.id]: false }))
  }

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
    <Card className="card-elevated p-6 mb-8 relative group">
      <InlineLocationEditor
        locationId={locationId}
        locationSlug={locationSlug}
        field="activities"
        value={activities}
        onUpdate={setActivities}
        enabled={enabled}
      />

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

              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-sleek-small flex items-center justify-center">
                <IconComponent className="h-5 w-5 text-gray-600" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-body-large font-semibold text-sleek-black mb-1">
                  {activity.name}
                </h4>
                <p className="text-body-medium text-sleek-dark-gray mb-3">
                  {activity.description || 'No description yet — add one to help fellow travelers.'}
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activity.category}
                  </Badge>
                  {activity.difficulty && (
                    <Badge className={`text-xs ${difficultyColors[activity.difficulty]}`}>
                      {activity.difficulty}
                    </Badge>
                  )}
                  {activity.duration && (
                    <div className="flex items-center gap-1 text-body-small text-sleek-gray">
                      <Clock className="h-3 w-3" />
                      <span>{activity.duration}</span>
                    </div>
                  )}
                  {activity.cost && (
                    <div className="flex items-center gap-1 text-body-small text-sleek-gray">
                      <DollarSign className="h-3 w-3" />
                      <span>{costLabels[activity.cost]}</span>
                    </div>
                  )}
                </div>

                {/* Link preview */}
                <div className="mt-2 flex items-center gap-2">
                  {(activity as any).link_url ? (
                    <>
                      <a
                        href={(activity as any).link_url}
                        target="_blank"
                        rel="noopener nofollow"
                        className="text-xs text-rausch-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Learn more →
                      </a>
                      {(activity as any).link_source && (
                        <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 border border-gray-200 text-gray-700 capitalize">
                          {(activity as any).link_source}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Right 16:9 thumbnail */}
              <div className="w-40 aspect-video relative rounded overflow-hidden bg-gray-100 flex-shrink-0 ml-2">
                {((activity as any).image_url || activityImages[activity.id]) ? (
                  <Image
                    src={(activity as any).image_url || activityImages[activity.id]}
                    alt={activity.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // If image fails to load, try to fetch a new one
                      console.log(`❌ Image failed to load for "${activity.name}", fetching new one...`)
                      e.currentTarget.style.display = 'none'
                      handleFindImage(activity, locationName)
                    }}
                  />
                ) : loadingImage[activity.id] ? (
                  <div className="absolute inset-0 animate-pulse bg-gray-200" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Mountain className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-6 w-full py-3 text-body-medium font-semibold text-sleek-black border border-sleek-border rounded-sleek-medium hover:bg-gray-50 transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${activities.length} Activities`}
        </button>
      )}
    </Card>
  )
}

