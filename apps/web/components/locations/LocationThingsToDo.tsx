"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SmartImage as Image } from '@/components/ui/SmartImage'

type Activity = {
  id: string
  location_id: string
  activity_name: string
  description?: string | null
  category?: string | null
  duration_minutes?: number | null
  cost_level?: string | null
  tags?: string[] | null
  image_url?: string | null
  link_url?: string | null
  source?: string | null
  type?: string | null
}

interface Props {
  locationId: string
  locationName: string
  onAddPhoto?: () => void
}

export function LocationThingsToDo({ locationId, locationName, onAddPhoto }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/locations/activities?locationId=${locationId}&limit=12`)
        const json = await res.json()
        if (!cancelled && json?.success) {
          setActivities(json.activities || [])
        }
      } catch {}
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [locationId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title-medium font-semibold text-sleek-black">Things to do in {locationName}</h2>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-600">We're curating the best activities for this destination. Check back soon!</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((a) => (
            <li key={a.id} className="relative flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
              <div className="pr-4 min-w-0">
                <h3 className="text-sm font-semibold text-sleek-black truncate">{a.activity_name}</h3>
                {a.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">{a.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {a.category && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{a.category}</span>}
                  {a.duration_minutes && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{Math.round(a.duration_minutes/60)}h</span>}
                  {a.cost_level && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{a.cost_level}</span>}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    aria-label="Add a photo for this activity"
                    onClick={onAddPhoto}
                  >
                    + Add photo
                  </Button>
                  {a.link_url && (
                    <a
                      href={a.link_url}
                      target="_blank"
                      rel="noopener nofollow sponsored"
                      className="text-xs text-rausch-600 hover:underline"
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              </div>

              <div className="w-40 aspect-video relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                {a.image_url ? (
                  <Image src={a.image_url} alt="" fill className="object-cover" />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-gray-500">Disclosure: We may earn a commission from bookings. This helps keep TravelBlogr free.</p>
    </div>
  )
}

