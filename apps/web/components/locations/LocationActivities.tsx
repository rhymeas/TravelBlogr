'use client'

import { useState, useEffect } from 'react'
import { Check, Clock, DollarSign, Mountain, Users, Utensils, Waves, Heart, ExternalLink, Globe, Phone, MapPin, Loader2 } from 'lucide-react'
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
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

  // Read contextual trip info from Plan V2 (if user just planned a trip in this session)
  // We mirror ResultsView ActivityEnrichment by passing tripType + a lightweight context string
  const [tripTypeCtx, setTripTypeCtx] = useState<string | undefined>(undefined)
  const [visionCtx, setVisionCtx] = useState<string | undefined>(undefined)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Try a few known keys used by planner UIs (best-effort; harmless if absent)
        const v2Ctx = localStorage.getItem('tb:plan-v2:tripVision') || localStorage.getItem('tb:tripVision')
        const v2Type = localStorage.getItem('tb:plan-v2:tripType') || localStorage.getItem('tb:tripType')
        setVisionCtx(v2Ctx ? v2Ctx.trim() : undefined)
        setTripTypeCtx(v2Type ? v2Type.trim() : undefined)
      }
    } catch {}
  }, [])

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
          if (tripTypeCtx) params.append('tripType', tripTypeCtx)
          if (visionCtx) params.append('context', visionCtx)

          const res = await fetch(`/api/brave/activity-image?${params.toString()}`)

          if (!res.ok) {
            console.warn(`⚠️ Activity image fetch failed for "${a.name}": ${res.status} ${res.statusText}`)
            setLoadingIds(prev => { const next = new Set(prev); next.delete(a.id); return next })
            continue
          }

          const json = await res.json()

          if (!json.success) {
            console.warn(`⚠️ Activity image API error for "${a.name}":`, json.error)
            setLoadingIds(prev => { const next = new Set(prev); next.delete(a.id); return next })
            continue
          }

          const images = Array.isArray(json?.data?.images) ? json.data.images : []
          const links = Array.isArray(json?.data?.links) ? json.data.links : []

          console.log(`📸 Activity "${a.name}" - Got ${images.length} images, ${links.length} links`)

          let bestLink = links.find((l: any) => !!l?.url) || links[0] || null

          // GROQ fallback if Brave returns no link
          if (!bestLink) {
            try {
              const groqRes = await fetch('/api/groq/activity-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityName: a.name, location: locationName, tripType: tripTypeCtx, context: visionCtx })
              })
              const groqJson = await groqRes.json()
              if (groqJson?.success) {
                bestLink = { url: groqJson.url || null, description: groqJson.description || '' }
              }
            } catch {}
          }

          // CRITICAL: Use thumbnail first (Brave CDN URL), then fallback to url
          const imageUrl = images?.[0]?.thumbnail || images?.[0]?.url || null

          const enrichment = {
            ...(bestLink || {}),
            thumbnail: imageUrl
          }

          console.log(`✅ Activity "${a.name}" enrichment:`, { thumbnail: imageUrl, link: bestLink?.url })

          if (!cancelled) {
            setEnrichments(prev => ({ ...prev, [a.id]: enrichment }))
          }
        } catch (e) {
          // non-fatal
        } finally {
          setLoadingIds(prev => { const next = new Set(prev); next.delete(a.id); return next })
        }
      }
    })()

    return () => { cancelled = true }
  }, [locationName, displayedActivities.map(a => a.id).join(','), tripTypeCtx, visionCtx])

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

          // Image priority: database image_url > enrichment thumbnail > fallback to icon
          const enrich = enrichments[activity.id] || {}
          const imgUrl = activity.image_url || (activity as any).image || enrich.thumbnail || null

          // Be robust: use any available link from enrichment or activity
          const linkHref = activity.link_url
            || activity.website
            || enrich.url
            || enrich.website
            || enrich.directionsUrl
            || null

          return (
            <div
              key={activity.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 ${
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

              {/* Activity Image or Icon (with V2 enrichment) - 20% smaller */}
              {imgUrl ? (
                <div className="flex-shrink-0 w-13 h-13 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={imgUrl}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                          <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                      `
                    }}
                  />
                </div>
              ) : loadingIds.has(activity.id) ? (
                <div className="flex-shrink-0 w-13 h-13 bg-gray-100 rounded-sleek-small flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-13 h-13 bg-gray-100 rounded-sleek-small flex items-center justify-center">
                  {/* Icon intentionally neutralized to remove red accent */}
                  <IconComponent className="h-5 w-5 text-gray-400" />
                </div>
              )}

              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h4 className={`text-body-large font-semibold transition-colors truncate ${
                    isChecked ? 'text-green-800 line-through' : 'text-sleek-black'
                  }`}>
                    {linkHref ? (
                      <a
                        href={linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-rausch-600 underline decoration-transparent hover:decoration-inherit"
                      >
                        {activity.name}
                      </a>
                    ) : (
                      activity.name
                    )}
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

                {/* Description with V2 enrichment and expand/collapse */}
                {(() => {
                  const baseDesc = activity.description || ''
                  const enrichDesc = enrich?.description || ''
                  const finalDesc = enrichDesc || baseDesc
                  const isExpanded = expandedDescriptions.has(activity.id)
                  const needsShowMore = finalDesc.length > 100

                  // Clean HTML tags from description
                  const cleanDesc = finalDesc.replace(/<[^>]*>/g, '').trim()
                  const displayDesc = needsShowMore && !isExpanded
                    ? cleanDesc.slice(0, 100) + '...'
                    : cleanDesc

                  return (
                    <div className="text-body-medium text-sleek-dark-gray mb-2">
                      <p className="inline">{displayDesc}</p>
                      {needsShowMore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedDescriptions(prev => {
                              const next = new Set(prev)
                              if (next.has(activity.id)) {
                                next.delete(activity.id)
                              } else {
                                next.add(activity.id)
                              }
                              return next
                            })
                          }}
                          className="ml-2 text-sm text-rausch-500 hover:text-rausch-600 font-medium"
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  )
                })()}

                {/* Activity Link (V2 parity): show any available link/pills; Learn more only if we have a primary URL */}
                {(linkHref || enrich?.website || enrich?.directionsUrl || enrich?.phone) && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {linkHref && (
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
                    )}
                    <div className="inline-flex items-center gap-2 text-xs text-sleek-gray">
                      {enrich?.phone && (
                        <a href={`tel:${enrich.phone}`} className="inline-flex items-center gap-1 hover:text-rausch-600" onClick={(e)=>e.stopPropagation()}>
                          <Phone className="h-3 w-3" />{enrich.phone}
                        </a>
                      )}
                      {enrich?.website && (
                        <a href={enrich.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-rausch-600" onClick={(e)=>e.stopPropagation()}>
                          <Globe className="h-3 w-3" />Website
                        </a>
                      )}
                      {enrich?.directionsUrl && (
                        <a href={enrich.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-rausch-600" onClick={(e)=>e.stopPropagation()}>
                          <MapPin className="h-3 w-3" />Directions
                        </a>
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
