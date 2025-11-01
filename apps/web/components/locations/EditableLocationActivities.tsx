'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Clock, DollarSign, Mountain, Users, Utensils, Waves, Heart, Image as ImageIcon, Link as LinkIcon, Edit, Plus, Loader2, ExternalLink, Globe, Phone, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { BraveImage } from '@/components/shared/BraveImage'
import { LocationActivity } from '@/lib/data/locationsData'
import { InlineLocationEditor } from './InlineLocationEditor'
import { ImageSelectionModal } from '@/components/shared/ImageSelectionModal'
import { AddActivityModal } from './AddActivityModal'
import toast from 'react-hot-toast'

interface EditableLocationActivitiesProps {
  locationId: string
  locationSlug: string
  activities: LocationActivity[]
  locationName: string
  country?: string
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
  country,
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
  const [hoveringImage, setHoveringImage] = useState<string | null>(null)
  const [editingImage, setEditingImage] = useState<string | null>(null)
  const [showAddActivityModal, setShowAddActivityModal] = useState(false)

  // V2 parity: enrichment + description expansion
  const [enrichments, setEnrichments] = useState<Record<string, any>>({})
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

  // Manual refetch trigger counter (to re-run enrichment effects)
  const [refetchCounter, setRefetchCounter] = useState(0)

  // Fetch-once guards to avoid repeated refetching while editing
  const hasFetchedImagesRef = useRef(false)
  const hasFetchedLinksRef = useRef(false)

  const handleSelectImage = async (activityId: string, imageUrl: string, source: string) => {
    try {
      // Update activity image in database
      const response = await fetch('/api/locations/update-activity-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          activityId,
          imageUrl
        })
      })

      if (response.ok) {
        toast.success(`Activity image updated from ${source}!`)
        // Update local state
        setActivityImages(prev => ({ ...prev, [activityId]: imageUrl }))
      } else {
        toast.error('Failed to update image')
      }
    } catch (error) {
      console.error('Error updating activity image:', error)
      toast.error('Failed to update image')
    }
  }


  // Auto-fetch images for ALL activities (Brave ➜ Reddit ➜ Pexels)
  // This runs for activities without image_url OR with potentially broken image_url
  useEffect(() => {
    // Only auto-enrich when editing to avoid extra network on public views
    if (!enabled) return
    if (!activities || activities.length === 0) return
    // Ensure we fetch only once per edit session
    if (hasFetchedImagesRef.current) return
    hasFetchedImagesRef.current = true

    const timers: Array<ReturnType<typeof setTimeout>> = []

    activities.forEach((a, idx) => {
      // Skip if we already have a fetched image in state
      if (activityImages[a.id] || loadingImage[a.id]) return

      // Fetch image for activities without image_url
      if (!(a as any).image_url) {
        const t = setTimeout(() => {
          handleFindImage(a, locationName)
        }, idx * 150) // stagger to avoid bursts
        timers.push(t)
      }
    })

    return () => {
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, locationName, enabled, refetchCounter])

  const handleFindImage = async (a: LocationActivity, locationName: string) => {
    setLoadingImage(prev => ({ ...prev, [a.id]: true }))
    try {
      // Primary: our unified image stack (Brave ➜ Reddit ➜ Pexels)
      const res = await fetch(`/api/activities/find-image?activityName=${encodeURIComponent(a.name)}&locationName=${encodeURIComponent(locationName)}`)
      const json = await res.json()
      console.log(`📸 Activity image fetch for "${a.name}":`, json)
      const chosenUrl = json?.thumbnail || json?.url
      if (json?.success && chosenUrl) {
        console.log(`✅ Setting image for ${a.name}: ${chosenUrl}`)
        setActivityImages(prev => ({ ...prev, [a.id]: chosenUrl }))

        // ✅ AUTO-PERSIST: Save image to database so it persists when exiting edit mode
        try {
          await fetch('/api/locations/update-activity-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              locationId,
              activityId: a.id,
              imageUrl: chosenUrl
            })
          })
          console.log(`💾 Auto-saved image for ${a.name} to database`)
        } catch (saveError) {
          console.error(`❌ Failed to auto-save image for ${a.name}:`, saveError)
        }
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

            // ✅ AUTO-PERSIST: Save image to database
            try {
              await fetch('/api/locations/update-activity-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  locationId,
                  activityId: a.id,
                  imageUrl: linkJson.image
                })
              })
              console.log(`💾 Auto-saved link image for ${a.name} to database`)
            } catch (saveError) {
              console.error(`❌ Failed to auto-save link image for ${a.name}:`, saveError)
            }
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

  const handleActivityAdded = (newActivity: any) => {
    setActivities([...activities, newActivity])
    setShowAddActivityModal(false)
  }

  // Enrich activities with Brave links (V2 parity)
  useEffect(() => {
    // Only fetch enrichment links in edit mode
    if (!enabled) return
    if (!activities || activities.length === 0) return
    // Ensure we fetch only once per edit session
    if (hasFetchedLinksRef.current) return
    hasFetchedLinksRef.current = true
    let cancelled = false
    const toFetch = (showAll ? activities : activities.slice(0, INITIAL_DISPLAY_COUNT)).filter(a => !enrichments[a.id])
    if (toFetch.length === 0) return

    ;(async () => {
      for (const a of toFetch) {
        try {
          setLoadingIds(prev => new Set(prev).add(a.id))
          const params = new URLSearchParams({ name: a.name, location: locationName, type: 'activity', count: '3' })
          const res = await fetch(`/api/brave/activity-image?${params.toString()}`)
          const json = await res.json()
          const firstImage = json?.data?.images?.[0]
          const thumbnail = firstImage?.thumbnail || firstImage?.url || null
          let link = json?.data?.links?.[0] || null

          // GROQ fallback if Brave returns no link
          if (!link) {
            try {
              const groqRes = await fetch('/api/groq/activity-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityName: a.name, location: locationName })
              })
              const groqJson = await groqRes.json()
              if (groqJson?.success) {
                link = { url: groqJson.url || null, description: groqJson.description || '' }
              }
            } catch {}
          }

          // Persist description if we obtained one and DB is missing/short
          try {
            const incomingDesc: string | undefined = link?.description
            const hasBetterDesc = incomingDesc && incomingDesc.trim().length > (a.description?.trim().length || 0)
            if (incomingDesc && hasBetterDesc) {
              await fetch('/api/locations/update-activity-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locationId, activityId: a.id, description: incomingDesc, slug: locationSlug })
              })
              // Optimistically update local value too
              a.description = incomingDesc
            }
          } catch {}

          if (!cancelled) setEnrichments(prev => ({ ...prev, [a.id]: { ...(link || {}), thumbnail } }))
        } catch {}
        finally {
          setLoadingIds(prev => { const next = new Set(prev); next.delete(a.id); return next })
        }
      }
    })()

    return () => { cancelled = true }
  }, [activities, locationName, showAll, enabled, refetchCounter])

  if (!activities || activities.length === 0) {
    return null
  }

  return (
    <Card className="card-elevated p-6 mb-8 relative group">
      <InlineLocationEditor
        locationId={locationId}
        locationSlug={locationSlug}
        locationCountry={country}
        field="activities"
        value={activities}
        onUpdate={setActivities}
        enabled={enabled}
      />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-title-medium font-semibold text-sleek-black">
            Things to Do in {locationName}
          </h3>
          <p className="text-body-medium text-sleek-gray mt-1">
            Check off activities as you complete them during your visit
          </p>
        </div>

        {enabled && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Reset guards and run enrichment again
                hasFetchedImagesRef.current = false
                hasFetchedLinksRef.current = false
                setEnrichments({})
                setRefetchCounter((c) => c + 1)
                toast.success('Refetching activities data…')
              }}
              className="px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              title="Refetch images and links"
            >
              Refetch
            </button>
            <button
              onClick={() => setShowAddActivityModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {displayedActivities.map((activity) => {
          const IconComponent = categoryIcons[activity.category] || Mountain
          const isChecked = checkedActivities.has(activity.id)

          // CRITICAL: Always use database-persisted fields first, then enrichment fallback
          const enrich = enrichments[activity.id] || {}
          const linkHref = (activity as any).link_url || (activity as any).website || enrich.url

          return (
            <div
              key={activity.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-sleek-small ${
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
                {(() => {
                  const enrich = enrichments[activity.id] || {}
                  // Prefer database description first, then enrichment; show a clean placeholder if missing
                  const baseDesc = (activity as any).description || ''
                  const enrichDesc = enrich?.description || ''
                  const finalDesc = baseDesc || enrichDesc
                  const isExpanded = expandedDescriptions.has(activity.id)
                  const cleanDesc = finalDesc.replace(/<[^>]*>/g, '').trim()
                  const needsShowMore = cleanDesc.length > 100
                  const displayDesc = needsShowMore && !isExpanded ? cleanDesc.slice(0, 100) + '...' : cleanDesc
                  const hasDesc = !!cleanDesc
                  const text = hasDesc ? displayDesc : 'Short description coming soon.'

                  return (
                    <div className="text-body-medium text-sleek-dark-gray mb-2">
                      <p className="inline">{text}</p>
                      {hasDesc && needsShowMore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedDescriptions(prev => {
                              const next = new Set(prev)
                              if (next.has(activity.id)) next.delete(activity.id)
                              else next.add(activity.id)
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

                {/* Link preview (enriched) */}
                {(() => {
                  const enrich = enrichments[activity.id] || {}
                  const linkHref = (activity as any).link_url || enrich.url
                  if (!linkHref) return null
                  return (
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <a
                        href={linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-rausch-500 hover:text-rausch-600 font-medium"
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
                  )
                })()}
              </div>

              {/* Smaller rounded thumbnail (bubbly) */}
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ml-auto group/image"
                onMouseEnter={() => setHoveringImage(activity.id)}
                onMouseLeave={() => setHoveringImage(null)}
              >
                {(() => {
                  const enrich = enrichments[activity.id] || {}
                  // CRITICAL: Database image_url first, then local state, then enrichment thumbnail
                  const imgSrc = (activity as any).image_url || activityImages[activity.id] || enrich.thumbnail
                  if (imgSrc) {
                    return (
                      <>
                        <Image
                          src={imgSrc}
                          alt={activity.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as any).style.display = 'none'
                            handleFindImage(activity, locationName)
                          }}
                        />
                        {hoveringImage === activity.id && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setEditingImage(activity.id)
                              }}
                              className="px-2 py-1 bg-white/90 hover:bg-white text-gray-900 rounded text-xs font-medium flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Change
                            </button>
                          </div>
                        )}
                      </>
                    )
                  }
                  if (loadingImage[activity.id] || loadingIds.has(activity.id)) {
                    return (
                      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      </div>
                    )
                  }
                  return (
                    <BraveImage
                      activityName={activity.name}
                      locationName={locationName}
                      type="activity"
                      size="sm"
                      className="absolute inset-0"
                    />
                  )
                })()}
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

      {/* Image Selection Modal */}
      {editingImage && (
        <ImageSelectionModal
          open={!!editingImage}
          onClose={() => setEditingImage(null)}
          onSelect={(url, source) => {
            handleSelectImage(editingImage, url, source)
            setEditingImage(null)
          }}
          defaultQuery={`${activities.find(a => a.id === editingImage)?.name} ${locationName}`}
          context="activity"
        />
      )}

      {/* Add Activity Modal */}
      <AddActivityModal
        locationId={locationId}
        locationSlug={locationSlug}
        locationName={locationName}
        open={showAddActivityModal}
        onClose={() => setShowAddActivityModal(false)}
        onActivityAdded={handleActivityAdded}
      />
    </Card>
  )
}

