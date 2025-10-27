"use client"

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MapPin, Navigation, Bike, Footprints, Mountain, LocateFixed, Car, Download, Printer, TrainFront, Plane } from 'lucide-react'
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'
import { suggestOriginsFor } from './_helpers/originSuggestions'

interface Props {
  locationName: string
  latitude?: number | null
  longitude?: number | null
  onRouteVisibleChange?: (visible: boolean) => void
}

interface TransportResponse {
  from: { label: string; lat: number; lon: number }
  to: { label: string; lat: number; lon: number }
  profile: string
  distanceKm: number
  durationHrs: number
  ascent?: number
  descent?: number
  difficulty: 'easy' | 'moderate' | 'hard'
  provider: string
  summary: string
  geometry: { type: 'LineString'; coordinates: number[][] }
  elevationProfile?: {
    elevations: number[]
    distances: number[]
    ascent: number
    descent: number
    maxElevation: number
    minElevation: number
  }
  sources?: Array<{ title: string; url: string; type: string }>
}

export function LocationTransport({ locationName, latitude, longitude, onRouteVisibleChange }: Props) {
  const [fromInput, setFromInput] = useState<string>("")
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [profile, setProfile] = useState<'driving-car' | 'cycling-regular' | 'foot-walking'>('driving-car')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TransportResponse | null>(null)
  const [routeGeo, setRouteGeo] = useState<{ type: 'LineString'; coordinates: number[][] } | null>(null)
  const [currentRouteGeo, setCurrentRouteGeo] = useState<{ type: 'LineString'; coordinates: number[][] } | null>(null)
  const [currentRoutePref, setCurrentRoutePref] = useState<'fastest'|'shortest'|'scenic'|'longest'|null>(null)
  const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: number; lon: number; type: string }>>([])
  const [showSaveToTrip, setShowSaveToTrip] = useState(false)
  const [trips, setTrips] = useState<Array<{ id: string; name: string }>>([])
  const [selectedTrip, setSelectedTrip] = useState<string>("")

  const hasToCoords = typeof latitude === 'number' && typeof longitude === 'number'

  // Load origin suggestions once (nearest hub/station heuristics)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!locationName) return
        const s = await suggestOriginsFor(locationName)
        if (mounted) setSuggestions(s)
      } catch {}
    })()
    return () => { mounted = false }
  }, [locationName])

  async function fetchRoute() {
    try {
      setLoading(true)
      setError(null)

      // 1) Resolve coordinates via lightweight transport endpoint (geocoding + caching)
      const params = new URLSearchParams()
      params.set('profile', profile)
      params.set('elevation', 'false')
      params.set('sources', 'false')
      if (fromCoords) params.set('from', `${fromCoords.lat},${fromCoords.lon}`)
      else if (fromInput.trim()) params.set('fromName', fromInput.trim())
      if (hasToCoords) params.set('to', `${latitude},${longitude}`)
      else params.set('toName', locationName)

      const geoRes = await fetch(`/api/transport?${params.toString()}`)
      const geoJson = await geoRes.json()
      if (!geoRes.ok || !geoJson?.success) throw new Error(geoJson?.error || 'Failed to resolve coordinates')
      const base = geoJson.data as TransportResponse

      // 2) Fetch REAL road route matching current mode (supports longest/shortest/scenic via overlay)
      const routeRes = await fetch('/api/routing/get-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: [
            { longitude: base.from.lon, latitude: base.from.lat },
            { longitude: base.to.lon, latitude: base.to.lat }
          ],
          profile
        })
      })
      if (!routeRes.ok) throw new Error('Failed to fetch real route')
      const route = await routeRes.json()

      setRouteGeo(route.geometry)
      // Notify parent that the transport map is now visible
      onRouteVisibleChange?.(true)

      // 3) Ask server for official sources (cached) without heavy elevation
      const srcParams = new URLSearchParams()
      srcParams.set('profile', profile)
      srcParams.set('elevation', 'false')
      srcParams.set('sources', 'true')
      srcParams.set('from', `${base.from.lat},${base.from.lon}`)
      srcParams.set('to', `${base.to.lat},${base.to.lon}`)
      const sRes = await fetch(`/api/transport?${srcParams.toString()}`)
      const sJson = await sRes.json()

      // 4) Build summary based on real route metrics
      const distanceKm = (route.distance / 1000).toFixed(2)
      const durationHrs = (route.duration / 3600).toFixed(2)
      const summary = `${profile.includes('cycle') ? 'Cycling' : profile.includes('foot') ? 'Walking' : 'Driving'} route from ${base.from.label} to ${base.to.label} — ${distanceKm} km · ${durationHrs} h`

      setData({
        ...base,
        provider: route.provider,
        geometry: route.geometry,
        distanceKm: Number(distanceKm),
        durationHrs: Number(durationHrs),
        summary,
        sources: sJson?.data?.sources || []
      } as TransportResponse)
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch route')
    } finally {
      setLoading(false)
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFromCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setFromInput('My location')
      },
      (err) => {
        setError(err.message || 'Unable to get your location')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function pickSuggestion(s: { label: string; lat: number; lon: number }) {
    setFromCoords({ lat: s.lat, lon: s.lon })
    setFromInput(s.label)
  }

  function exportGpx() {
    const g = currentRouteGeo || routeGeo
    if (!g) return
    const trkseg = g.coordinates.map(([lon, lat]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`).join('\n')
    const name = `${data?.from.label} to ${data?.to.label}${currentRoutePref ? ` (${currentRoutePref})` : ''}`
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="TravelBlogr" xmlns="http://www.topografix.com/GPX/1/1">\n  <trk>\n    <name>${name}</name>\n    <trkseg>\n${trkseg}\n    </trkseg>\n  </trk>\n</gpx>`
    const blob = new Blob([gpx], { type: 'application/gpx+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(data?.from.label || 'route').replace(/\s+/g,'_')}_to_${(data?.to.label || 'dest').replace(/\s+/g,'_')}${currentRoutePref?`_${currentRoutePref}`:''}.gpx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="card-elevated p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title-medium font-semibold text-sleek-black flex items-center gap-2">
          <Navigation className="w-5 h-5 text-teal-600" />
          Transport & Directions
        </h2>
        {/* Mode chips moved to header (right aligned) */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant={profile==='driving-car'?'default':'ghost'} size="sm" onClick={() => setProfile('driving-car')}>
            <Car className="w-4 h-4 mr-1"/>Car
          </Button>
          <Button variant={profile==='cycling-regular'?'default':'ghost'} size="sm" onClick={() => setProfile('cycling-regular')}>
            <Bike className="w-4 h-4 mr-1"/>Bike
          </Button>
          <Button variant={profile==='foot-walking'?'default':'ghost'} size="sm" onClick={() => setProfile('foot-walking')}>
            <Footprints className="w-4 h-4 mr-1"/>Walk
          </Button>
        </div>
      </div>

      {/* Mobile quick mode chips */}
      <div className="flex md:hidden items-center gap-1 mb-3">
        <Button variant={profile==='driving-car'?'default':'ghost'} size="sm" className="w-10 h-9 p-0" onClick={() => setProfile('driving-car')} aria-label="Car">
          <Car className="w-4 h-4"/>
        </Button>
        <Button variant={profile==='cycling-regular'?'default':'ghost'} size="sm" className="w-10 h-9 p-0" onClick={() => setProfile('cycling-regular')} aria-label="Bike">
          <Bike className="w-4 h-4"/>
        </Button>
        <Button variant={profile==='foot-walking'?'default':'ghost'} size="sm" className="w-10 h-9 p-0" onClick={() => setProfile('foot-walking')} aria-label="Walk">
          <Footprints className="w-4 h-4"/>
        </Button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="City, station, address..."
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"

            />
            <Button
              variant="outline"
              size="sm"
              className="w-9 h-9 p-0"
              onClick={useMyLocation}
              title="Use my location"
              aria-label="Use my location"
            >
              <LocateFixed className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <div className="flex items-center gap-2 text-sm text-gray-800 border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="truncate" title={locationName}>{locationName}</span>
          </div>
        </div>
      {suggestions.length > 0 && (
        <div className="mb-2 flex items-center flex-wrap gap-2 text-xs text-gray-600">
          <span className="text-gray-500">Quick start:</span>
          {suggestions.map((s, idx) => (
            <Button key={idx} variant="ghost" size="sm" onClick={() => pickSuggestion(s)} className="h-7">
              {s.type === 'station' ? <TrainFront className="w-3.5 h-3.5 mr-1"/> : s.type === 'airport' ? <Plane className="w-3.5 h-3.5 mr-1"/> : <MapPin className="w-3.5 h-3.5 mr-1"/>}
              {s.label}
            </Button>
          ))}
        </div>
      )}

      </div>

      <div className="flex items-center gap-3 mb-4">
        <Button onClick={fetchRoute} disabled={loading || (!fromCoords && fromInput.trim().length === 0)}>
          {loading ? 'Finding route…' : 'Get directions'}
        </Button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* Result */}
      {data && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-800">
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                setShowSaveToTrip(v => !v)
                if (!showSaveToTrip) {
                  const r = await fetch('/api/trips')
                  if (r.ok) {
                    const j = await r.json()
                    const items = Array.isArray(j?.trips) ? j.trips : (Array.isArray(j) ? j : [])
                    setTrips(items.map((t: any) => ({ id: t.id || t.trip_id || t.slug, name: t.name || t.title || t.slug })))
                  }
                }
              } catch {}
            }} disabled={!currentRouteGeo && !routeGeo}>
              Save to trip
            </Button>
            {showSaveToTrip && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <select value={selectedTrip} onChange={e => setSelectedTrip(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1">
                  <option value="">Select trip…</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <Button size="sm" variant="default" disabled={!selectedTrip || (!currentRouteGeo && !routeGeo)} onClick={async () => {
                  const payload = {
                    tripId: selectedTrip,
                    from: data?.from,
                    to: data?.to,
                    transportMode: profile,
                    preference: currentRoutePref,
                    geometry: (currentRouteGeo || routeGeo),
                    provider: data?.provider,
                    distanceKm: data?.distanceKm,
                    durationHrs: data?.durationHrs
                  }
                  try {
                    const res = await fetch('/api/trips/save-route', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    })
                    if (res.ok) {
                      setShowSaveToTrip(false)
                    }
                  } catch {}
                }}>
                  Save
                </Button>
              </div>
            )}

            <span className="font-semibold">{data.summary}</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-xs">{data.provider}</span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-xs">{data.difficulty}</span>
          </div>

          {/* Interactive Map + Elevation (TripOverviewMap) */}
          <TripOverviewMap
            className="h-64 md:h-80"
            locations={[
              { name: data.from.label, latitude: data.from.lat, longitude: data.from.lon },
              { name: data.to.label, latitude: data.to.lat, longitude: data.to.lon }
            ]}
            transportMode={profile === 'cycling-regular' ? 'bike' : (profile === 'foot-walking' ? 'foot' : 'car')}
            showRouteOptions
            onRouteChange={(geometry, _provider, preference) => {
              setCurrentRouteGeo(geometry as any)
              setCurrentRoutePref(preference)
            }}
          />

          {/* Actions: Export / Print */}
          <div className="flex items-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={exportGpx} disabled={!(currentRouteGeo || routeGeo)}>
              <Download className="w-4 h-4 mr-1"/>Export GPX
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1"/>Print
            </Button>
          </div>

          {/* Official sources */}
          {Array.isArray(data.sources) && data.sources.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Official sources</h3>
              <div className="flex flex-wrap gap-2">
                {data.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener nofollow" className="text-xs px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-50">
                    {s.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

