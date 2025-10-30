"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

import { X, MapPin, Loader2, Plus } from "lucide-react"

export interface RoutePopupProps {
  distanceKm: number
  durationH?: number
  elevationM?: number
  inclinePct?: number
  roadType?: "paved" | "unpaved" | "mixed" | "unknown"
  onAddNote?: (text: string) => void
  onAddChecklist?: (text: string) => void
  onAddWaypoint?: () => void
  onClose?: () => void
  // New props for smart POI discovery
  coordinates?: { lat: number; lng: number }
  routeLength?: number // Total route length in km
  tripType?: string
  transportMode?: string
  // Position for portal rendering
  position?: { x: number; y: number }
  onAddToSchedule?: (poi: POI) => void
}

interface POI {
  name: string
  type: string
  description: string
  distance: number
  coordinates: { lat: number; lng: number }
  image?: string
  rating?: number
}

export function RoutePopup({
  distanceKm,
  durationH,
  elevationM,
  inclinePct,
  roadType = "unknown",
  onAddNote,
  onAddChecklist,
  onAddWaypoint,
  onClose,
  coordinates,
  routeLength,
  tripType,
  transportMode,
  position,
  onAddToSchedule
}: RoutePopupProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [checkText, setCheckText] = useState("")

  // POI discovery state
  const [pois, setPois] = useState<POI[]>([])
  const [loadingPOIs, setLoadingPOIs] = useState(false)
  const [radius, setRadius] = useState<number>(0)
  const [showPOIs, setShowPOIs] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Fetch nearby POIs when popup opens - ONLY ONCE per popup instance
  useEffect(() => {
    if (!coordinates || !routeLength || hasFetched) return

    const fetchPOIs = async () => {
      setLoadingPOIs(true)
      setHasFetched(true) // Prevent duplicate fetches

      try {
        const params = new URLSearchParams({
          lat: coordinates.lat.toString(),
          lng: coordinates.lng.toString(),
          routeLength: routeLength.toString(),
          tripType: tripType || 'leisure',
          transportMode: transportMode || 'car'
        })

        const response = await fetch(`/api/route-pois/discover?${params}`)
        const data = await response.json()

        if (data.success) {
          // Limit to 3 POIs max to prevent overwhelming UI and API
          setPois((data.pois || []).slice(0, 3))
          setRadius(data.radius || 0)
        }
      } catch (error) {
        console.error('Failed to fetch POIs:', error)
      } finally {
        setLoadingPOIs(false)
      }
    }

    fetchPOIs()
  }, [coordinates?.lat, coordinates?.lng, routeLength, tripType, transportMode, hasFetched])

  const submitNote = () => {
    if (!onAddNote) return
    const t = noteText.trim()
    if (!t) return
    onAddNote(t)
    setNoteText("")
    setNoteOpen(false)
  }

  const submitCheck = () => {
    if (!onAddChecklist) return
    const t = checkText.trim()
    if (!t) return
    onAddChecklist(t)
    setCheckText("")
    setCheckOpen(false)
  }
  const formatDuration = (hours?: number) => {
    if (!hours || hours <= 0) return "—"
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, "0")} h`
  }

  // Render as portal to avoid overflow issues
  const popupContent = (
    <div
      className="fixed bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-300 w-[420px] max-h-[70vh] overflow-hidden flex flex-col z-[9999]"
      style={position ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-12px)'
      } : undefined}
    >
      {/* Header - Compact */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <div className="text-sm font-semibold text-gray-900">Route Point</div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Route Info - Compact Grid */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Distance</span>
            <span className="font-semibold text-gray-900">{Math.round(distanceKm)} km</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Duration</span>
            <span className="font-semibold text-gray-900">{formatDuration(durationH)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Elevation</span>
            <span className="font-semibold text-gray-900">{elevationM != null ? `${Math.round(elevationM)} m` : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Incline</span>
            <span className={`font-semibold ${inclinePct && inclinePct > 5 ? 'text-orange-600' : 'text-gray-900'}`}>
              {inclinePct != null ? `${inclinePct.toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Nearby POIs Section - Sleeker */}
      {coordinates && routeLength && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Nearby ({radius}km)
              </h3>
              {loadingPOIs && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
              )}
            </div>

            {loadingPOIs ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                Discovering attractions...
              </div>
            ) : pois.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                No attractions found
              </div>
            ) : (
              <div className="space-y-2">
                {pois.map((poi, index) => (
                  <div
                    key={index}
                    className="group bg-white hover:bg-emerald-50 rounded-lg p-2.5 transition-all border border-gray-200 hover:border-emerald-300 hover:shadow-sm"
                  >
                    <div className="flex gap-2.5">
                      {poi.image && (
                        <div className="flex-shrink-0 w-14 h-14 rounded-md overflow-hidden bg-gray-100">
                          <img
                            src={poi.image}
                            alt={poi.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-xs font-semibold text-gray-900 truncate leading-tight">
                            {poi.name}
                          </h4>
                          <span className="flex-shrink-0 text-[10px] text-gray-500 font-medium">
                            {poi.distance.toFixed(1)}km
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            {poi.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug line-clamp-1 mb-1.5">
                          {poi.description}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onAddToSchedule) {
                              onAddToSchedule(poi)
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-medium rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add to Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pb-4 space-y-2 border-t border-gray-200 pt-3">
        {/* Actions */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => { setNoteOpen(v => !v); setCheckOpen(false) }}
            className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-2 py-1 rounded-full"
          >
            + Note
          </button>
          <button
            type="button"
            onClick={() => { setCheckOpen(v => !v); setNoteOpen(false) }}
            className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-2 py-1 rounded-full"
          >
            + Check
          </button>
          <button
            type="button"
            onClick={onAddWaypoint}
            className="text-[11px] bg-gray-900 hover:bg-black text-white font-medium px-2 py-1 rounded-full"
          >
            Add
          </button>
        </div>

        {/* Inline note input */}
        {noteOpen && (
          <div className="flex items-center gap-1.5">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitNote() }}
              placeholder="Quick note..."
              className="flex-1 text-xs px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <button
              type="button"
              onClick={submitNote}
              className="text-[11px] px-3 py-2 rounded-full bg-gray-900 text-white hover:bg-black"
            >
              Save
            </button>
          </div>
        )}

        {/* Inline checklist input */}
        {checkOpen && (
          <div className="flex items-center gap-1.5">
            <input
              value={checkText}
              onChange={(e) => setCheckText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCheck() }}
              placeholder="Add checkpoint..."
              className="flex-1 text-xs px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <button
              type="button"
              onClick={submitCheck}
              className="text-[11px] px-3 py-2 rounded-full bg-gray-900 text-white hover:bg-black"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // Render as portal to avoid overflow
  if (typeof window === 'undefined') return null
  return createPortal(popupContent, document.body)
}

