"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"

interface POI {
  title: string
  url: string
  description?: string
  estimatedDistance?: number
  category?: string
  imageUrl?: string
}

interface RoutePOISuggestionsProps {
  center: { latitude: number; longitude: number }
  radiusKm?: number
  category?: "all" | "restaurant" | "attraction" | "hotel" | "gas-station"
  nearestLocationIndex?: number
  nearestLocationName?: string
  onInsertPOI?: (poi: POI, position: 'before' | 'after', index: number) => void
}

export function RoutePOISuggestions({ center, radiusKm = 25, category = "all", nearestLocationIndex, nearestLocationName, onInsertPOI }: RoutePOISuggestionsProps) {
  const [loading, setLoading] = useState(false)
  const [pois, setPois] = useState<POI[]>([])
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          lat: String(center.latitude),
          lng: String(center.longitude),
          radius: String(radiusKm),
        })
        if (category !== "all") params.set("category", category)
        const res = await fetch(`/api/pois/nearby?${params.toString()}`)
        const data = await res.json()
        const basePois: POI[] = data.pois || []
        // Fetch images for each POI (cached on server)
        const withImages = await Promise.all(basePois.slice(0, 12).map(async (poi: POI) => {
          try {
            const imgRes = await fetch(`/api/pois/image?name=${encodeURIComponent(poi.title)}&location=${encodeURIComponent(`${center.latitude},${center.longitude}`)}&category=${encodeURIComponent(poi.category || '')}`)
            const img = await imgRes.json()
            return { ...poi, imageUrl: img.url || undefined }
          } catch {
            return poi
          }
        }))
        if (!ignore) setPois(withImages)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [center.latitude, center.longitude, radiusKm, category])

  return (
    <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl p-3 w-80">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Nearby Points of Interest</div>
        <div className="text-[11px] text-gray-500">~ {radiusKm} km</div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" /> Loading...
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-auto">
          {pois.slice(0, 12).map((poi, idx) => (
            <div key={idx} className="relative">
              <a
                href={poi.url}
                target="_blank"
                rel="noreferrer"
                className="flex gap-2 border border-gray-200 rounded-xl p-2 hover:bg-gray-50"
              >
                {poi.imageUrl ? (
                  <img src={poi.imageUrl} alt="" className="w-14 h-14 rounded-md object-cover bg-gray-100" />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-gray-100" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-gray-500 mb-0.5 capitalize">{poi.category || "poi"}</div>
                  <div className="text-sm font-medium truncate">{poi.title}</div>
                  {poi.description ? (
                    <div className="text-xs text-gray-600 line-clamp-2 mt-0.5">{poi.description}</div>
                  ) : null}
                </div>
                {/* Quick add button */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setConfirmIdx(confirmIdx === idx ? null : idx) }}
                  className="self-center text-[11px] bg-gray-900 hover:bg-black text-white font-medium px-2 py-1 rounded-full"
                  aria-label="Add to itinerary"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </a>

              {/* Confirm popover */}
              {confirmIdx === idx && (
                <div className="absolute right-2 top-2 z-10 bg-white border border-gray-200 rounded-2xl shadow-lg p-2 w-64">
                  <div className="text-xs font-medium mb-2">Insert "{poi.title}" near {nearestLocationName || 'nearest stop'}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 text-xs px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200"
                      onClick={() => {
                        const idxToUse = typeof nearestLocationIndex === 'number' ? nearestLocationIndex : 0
                        if (onInsertPOI) onInsertPOI(poi, 'before', idxToUse)
                        else if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('plan-v2:insert-poi', { detail: { poi, position: 'before', index: idxToUse } }))
                        setConfirmIdx(null)
                      }}
                    >
                      Insert before {nearestLocationName || 'stop'}
                    </button>
                    <button
                      type="button"
                      className="flex-1 text-xs px-3 py-2 rounded-full bg-gray-900 text-white hover:bg-black"
                      onClick={() => {
                        const idxToUse = typeof nearestLocationIndex === 'number' ? nearestLocationIndex : 0
                        if (onInsertPOI) onInsertPOI(poi, 'after', idxToUse)
                        else if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('plan-v2:insert-poi', { detail: { poi, position: 'after', index: idxToUse } }))
                        setConfirmIdx(null)
                      }}
                    >
                      Insert after {nearestLocationName || 'stop'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {pois.length === 0 && (
            <div className="text-xs text-gray-600 py-4 text-center">No POIs found nearby.</div>
          )}
        </div>
      )}
    </div>
  )
}

