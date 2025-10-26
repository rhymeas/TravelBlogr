'use client'

/**
 * Trip Overview Map - Shows the entire trip route with all locations
 * Used in the Review section of the itinerary modal
 *
 * Now with REAL ROAD ROUTING:
 * - Uses OpenRouteService (primary) for professional road routes
 * - Falls back to OSRM demo server if OpenRouteService unavailable
 * - Caches routes in database to minimize API calls
 */

import { useEffect, useRef, useState, memo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RoutePopup } from '@/components/maps/RoutePopup'
import { RoutePOISuggestions } from '@/components/maps/RoutePOISuggestions'
import { ElevationProfile } from '@/components/maps/ElevationProfile'

import { geocodeAddress } from '@/lib/services/nominatimService'

interface TripOverviewMapProps {
  locations: Array<{
    name: string
    latitude: number
    longitude: number
    isHighlighted?: boolean
  }>
  transportMode?: 'car' | 'bike' | 'foot' | 'train' | 'flight' | 'bus' | 'mixed'
  className?: string
  highlightedIndex?: number // Index of the location to highlight
  // Optional: preview an alternative route without changing primary route
  previewLocations?: Array<{ latitude: number; longitude: number }>
  tripId?: string
  showElevation?: boolean
  showProviderBadge?: boolean
}

function TripOverviewMapComponent({ locations, transportMode = 'car', className = '', previewLocations, tripId, showElevation = true, showProviderBadge = false }: TripOverviewMapProps) {

  const [routePreference, setRoutePreference] = useState<'fastest'|'scenic'|'longest' | null>(null)
  const [previewPreference, setPreviewPreference] = useState<'fastest'|'scenic'|'longest' | null>(null)
  const [hoverKm, setHoverKm] = useState<number | null>(null)

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null)

  const markers = useRef<maplibregl.Marker[]>([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeProvider, setRouteProvider] = useState<string | null>(null)
  const routeCoordsRef = useRef<[number, number][]>([])
  const [popupData, setPopupData] = useState<{ lng: number; lat: number; distanceKm: number; elevationM?: number } | null>(null)
  const [nearestStop, setNearestStop] = useState<{ index: number; name: string } | null>(null)
  const routeCumKmRef = useRef<number[]>([])
  const elevProfileRef = useRef<{ distances: number[]; elevations: number[] }>({ distances: [], elevations: [] })
  const [elevationProfile, setElevationProfile] = useState<{ distances: number[]; elevations: number[] } | null>(null)
  const isScrubbingRef = useRef(false)


  const addNoteAtCurrent = async (text?: string) => {
    if (!tripId || !popupData) return
    const noteText = (text ?? (typeof window !== 'undefined' ? window.prompt('Add note') : null)) || ''
    if (!noteText.trim()) return
    try {
      await fetch('/api/route-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          latitude: popupData.lat,
          longitude: popupData.lng,
          distanceKm: popupData.distanceKm,
          noteText: noteText.trim()
        })
      })
    } catch (e) { console.warn('add note failed', e) }
  }

  const addChecklistAtCurrent = async (text?: string) => {
    if (!tripId || !popupData) return
    const itemText = (text ?? (typeof window !== 'undefined' ? window.prompt('Add checkpoint') : null)) || ''
    if (!itemText.trim()) return
    try {
      await fetch('/api/route-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          latitude: popupData.lat,
          longitude: popupData.lng,
          distanceKm: popupData.distanceKm,
          itemText: itemText.trim()
        })
      })
    } catch (e) { console.warn('add checklist failed', e) }
  }

  // CRITICAL FIX: Use stable location key to prevent re-initialization on hover

// Haversine distance in km (module-scope helper)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
function nearestDistanceKmToRoute(lat: number, lng: number, coords: [number, number][]) {
  if (!coords || coords.length === 0) return Number.NaN
  let min = Number.POSITIVE_INFINITY
  for (let i = 0; i < coords.length; i++) {
    const d = haversine(lat, lng, coords[i][1], coords[i][0])
    if (d < min) min = d
  }
  return min
}


  // Only re-initialize if actual locations change (add/remove), not on every render
  const locationKey = locations.map(l => `${l.name}-${l.latitude}-${l.longitude}`).join('|')
  const previousLocationKey = useRef<string>('')

  const lastRoutePreferenceRef = useRef<'fastest'|'scenic'|'longest' | null>(null)

  useEffect(() => {
    // Only initialize if map doesn't exist and container is ready
    if (!mapContainer.current || map.current) return

    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      try {
        if (!mapContainer.current || map.current) return // Double-check map doesn't exist

        // Initialize map with CARTO basemap
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: [
                  'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                  'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                  'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              }
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 22
              }
            ]
          },
          center: locations.length > 0 ? [locations[0].longitude, locations[0].latitude] : [0, 20],
          zoom: locations.length > 0 ? 5 : 1.5
        })

        // Add navigation controls (same as trip planning page)
        map.current.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true
          }),
          'top-right'
        )

        // Add fullscreen control (same as trip planning page)
        map.current.addControl(
          new maplibregl.FullscreenControl(),
          'top-right'
        )

        // Wait for map to load before adding markers and route
        map.current.on('load', () => {
          if (!map.current) return

          // Add markers for each location with highlighting support
          locations.forEach((location, index) => {
            const el = document.createElement('div')
            // SIMPLIFIED: All pins are red, same size, no fly-in animation
            el.className = 'w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform'
            el.style.display = 'flex'
            el.style.alignItems = 'center'
            el.style.justifyContent = 'center'
            el.textContent = (index + 1).toString()

            const marker = new maplibregl.Marker({
              element: el,
              anchor: 'center'
            })
              .setLngLat([location.longitude, location.latitude])
              .setPopup(
                new maplibregl.Popup({
                  offset: 25,
                  maxWidth: '400px',
                  className: 'location-popup-custom',
                  closeButton: true,
                  closeOnClick: false
                })
                  .setHTML(`<div class="font-semibold text-base p-3 whitespace-normal break-words leading-relaxed">${location.name}</div>`)
              )
              .addTo(map.current!)

            markers.current.push(marker)
          })

          // Add REAL ROAD ROUTE if multiple locations
          if (locations.length > 1) {
            setRouteLoading(true)

            // Fetch real road route from API
            fetchRealRoute(locations, transportMode, routePreference || undefined)
              .then(routeData => {
                if (!map.current) return

                // Remove old route if exists
                if (map.current.getSource('route')) {
                  map.current.removeLayer('route')
                  map.current.removeSource('route')
                }

                // Add real road route
                map.current.addSource('route', {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: routeData.geometry
                  }
                })

                map.current.addLayer({
                  id: 'route',
                  type: 'line',
                  source: 'route',
                  layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                  },
                  paint: {
                    'line-color': '#14b8a6',
                    'line-width': 3,
                    'line-opacity': 0.8
                  }
                })

                // Save route coordinates for interaction (distance calculations)
                try {
                  // @ts-ignore
                  routeCoordsRef.current = (routeData.geometry?.coordinates || []) as [number, number][]
                  // Precompute cumulative distances along route (km)
                  const coords = routeCoordsRef.current
                  const cum: number[] = []
                  let total = 0
                  for (let i = 0; i < coords.length; i++) {
                    if (i === 0) cum.push(0)
                    else {
                      total += haversine(coords[i-1][1], coords[i-1][0], coords[i][1], coords[i][0])
                      cum.push(total)
                    }
                  }
                  routeCumKmRef.current = cum

                  // Prefetch elevation profile for the route (sampled)
                  try {
                    fetch('/api/elevation/profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ coordinates: coords })
                    }).then(async (res) => {
                      if (res.ok) {
                        const j = await res.json()
                        elevProfileRef.current = { distances: j.distances || [], elevations: j.elevations || [] }
                        setElevationProfile(elevProfileRef.current)
                      }
                    }).catch(() => {})
                  } catch {}
                } catch {}

                // Add hover dot source/layer once
                if (!map.current.getSource('route-hover-point')) {
                  map.current.addSource('route-hover-point', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                  })
                  map.current.addLayer({
                    id: 'route-hover-dot',
                    type: 'circle',
                    source: 'route-hover-point',
                    paint: {
                      'circle-radius': 8,
                      'circle-color': '#111827',
                      'circle-stroke-width': 2,
                      'circle-stroke-color': '#ffffff'
                    }
                  })
                }

                // Register sticky drag interactions on route (no always-on hover)
                if (!(map.current as any).__route_interactions__) {
                  const src = map.current.getSource('route-hover-point') as maplibregl.GeoJSONSource

                  const updateAtLngLat = async (lng: number, lat: number, openPopup: boolean = false) => {
                    if (!routeCoordsRef.current.length) return
                    // Show dot at current point
                    if (src) {
                      src.setData({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [lng, lat] },
                        properties: {}
                      } as any)
                    }

                    // Find nearest vertex index
                    const coords = routeCoordsRef.current
                    let nearestIdx = 0
                    let minDist = Number.POSITIVE_INFINITY
                    for (let i = 0; i < coords.length; i++) {
                      const d = haversine(coords[i][1], coords[i][0], lat, lng)
                      if (d < minDist) { minDist = d; nearestIdx = i }
                    }

                    // Distance from start using precomputed cumulative km
                    let distanceKm = 0
                    if (routeCumKmRef.current.length === coords.length) {
                      distanceKm = routeCumKmRef.current[nearestIdx]
                    } else {
                      // Fallback compute
                      for (let i = 1; i <= nearestIdx; i++) {
                        distanceKm += haversine(coords[i-1][1], coords[i-1][0], coords[i][1], coords[i][0])
                      }
                    }

                    // Elevation: prefer sampled profile map by distance
                    let elevationM: number | undefined = undefined
                    if (elevProfileRef.current.distances.length > 0) {
                      const dists = elevProfileRef.current.distances
                      const idx = Math.max(0, dists.findIndex(d => d >= distanceKm))
                      const bestIdx = idx <= 0 ? 0 : (idx >= dists.length ? dists.length - 1 : idx)
                      elevationM = elevProfileRef.current.elevations[bestIdx]
                    } else {
                      try {
                        const r = await fetch(`/api/elevation/point?lat=${lat}&lng=${lng}`)
                        const j = await r.json()
                        if (j && typeof j.elevation === 'number') elevationM = j.elevation
                      } catch {}
                    }

                    // Sync elevation profile hover marker with map dot
                    setHoverKm(distanceKm)

                    // Update popup only when explicitly opened via click
                    if (openPopup) setPopupData({ lng, lat, distanceKm, elevationM })

                    // Do not live-reposition popup while scrubbing; keep it click-only
                    if (openPopup && map.current && mapContainer.current) {
                      const pt = map.current.project([lng, lat]) as any
                      const cw = mapContainer.current.clientWidth
                      const ch = mapContainer.current.clientHeight
                      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
                      const zoom = typeof map.current?.getZoom === 'function' ? map.current!.getZoom() : 10
                      const base = 24
                      const offset = Math.max(10, base - zoom * 1.5)
                      const x = clamp(pt.x + offset, 8, cw - 320)
                      const y = clamp(pt.y - offset, 8, ch - 160)
                      setPopupPos({ x, y })
                    }

                    // Determine nearest itinerary stop (by geodesic distance)
                    if (locations && locations.length > 0) {
                      let best = 0
                      let bestD = Number.POSITIVE_INFINITY
                      for (let i = 0; i < locations.length; i++) {
                        const d = haversine(locations[i].latitude, locations[i].longitude, lat, lng)
                        if (d < bestD) { bestD = d; best = i }
                      }
                      setNearestStop({ index: best, name: locations[best]?.name || `Stop ${best + 1}` })
                    }
                  }

                  const onMouseDown = (e: any) => {
                    const p = e?.lngLat
                    if (!p) return
                    isScrubbingRef.current = true
                    updateAtLngLat(p.lng, p.lat, false)
                  }

                  const onMouseMove = (e: any) => {
                    const p = e?.lngLat
                    if (!p) return
                    // Sticky hover: when near the route, snap the dot even if not dragging
                    if (!isScrubbingRef.current && map.current && e?.point) {
                      const pt = e.point
                      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [[pt.x - 24, pt.y - 24] as any, [pt.x + 24, pt.y + 24] as any]
                      const feats = map.current.queryRenderedFeatures(bbox as any, { layers: ['route'] })
                      if (feats.length === 0) return
                    }
                    updateAtLngLat(p.lng, p.lat, false)
                  }

                  const onMouseUp = () => {
                    isScrubbingRef.current = false
                  }

                  map.current.on('mousedown', 'route', onMouseDown)
                  map.current.on('mousemove', onMouseMove)
                  map.current.on('mouseup', onMouseUp)
                  map.current.on('click', 'route', (e: any) => {
                    const p = e?.lngLat
                    if (!p) return
                    updateAtLngLat(p.lng, p.lat, true)
                  })

                  ;(map.current as any).__route_interactions__ = true
                }

                setRouteProvider(routeData.provider)
                setRouteLoading(false)
                console.log(`✅ Real road route loaded from ${routeData.provider}`)
              })
              .catch(error => {
                console.error('Failed to load real route, using straight line:', error)
                setRouteLoading(false)

                // Fallback to straight line if routing fails
                if (!map.current) return

                const coordinates = locations.map(loc => [loc.longitude, loc.latitude])

                map.current.addSource('route', {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates
                    }
                  }
                })

                map.current.addLayer({
                  id: 'route',
                  type: 'line',
                  source: 'route',
                  layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                  },
                  paint: {
                    'line-color': '#14b8a6',
                    'line-width': 3,
                    'line-opacity': 0.8,
                    'line-dasharray': [2, 2] // Dashed line to indicate fallback
                  }
                })
              })
          }

          // Fit bounds to show all markers
          if (locations.length > 0) {
            const bounds = new maplibregl.LngLatBounds()
            locations.forEach(loc => {
              bounds.extend([loc.longitude, loc.latitude])
            })
            map.current!.fitBounds(bounds, { padding: 50, maxZoom: 10 })
          }
        })

      } catch (error) {
        console.error('Error initializing trip overview map:', error)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      markers.current.forEach(marker => marker.remove())
      markers.current = []
      map.current?.remove()
      map.current = null
    }
  }, []) // CRITICAL FIX: Empty dependency array - map initializes ONCE and never re-renders

  // Update markers, route, and fit bounds when locations or transport mode change
  useEffect(() => {
    if (!map.current) return

    try {
      // Prevent unnecessary work if nothing relevant changed
      if (previousLocationKey.current === locationKey && lastRoutePreferenceRef.current === routePreference) return
      previousLocationKey.current = locationKey
      lastRoutePreferenceRef.current = routePreference

      const m = map.current

      // Remove old markers
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      // Add new markers
      locations.forEach((location, index) => {
        const el = document.createElement('div')
        el.className = 'w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm'
        el.textContent = (index + 1).toString()
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([location.longitude, location.latitude])
          .addTo(m!)
        markers.current.push(marker)
      })

      // Remove existing route
      if (m.getSource('route')) {
        if (m.getLayer('route')) m.removeLayer('route')
        m.removeSource('route')
      }

      // Update route
      if (locations.length > 1) {
        setRouteLoading(true)
        fetchRealRoute(locations, transportMode, routePreference || undefined)
          .then(routeData => {
            if (!map.current) return
            const mm = map.current
            if (mm.getSource('route')) {
              if (mm.getLayer('route')) mm.removeLayer('route')
              mm.removeSource('route')
            }
            mm.addSource('route', {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: routeData.geometry }
            })
            try {
              // @ts-ignore
              routeCoordsRef.current = (routeData.geometry?.coordinates || []) as [number, number][]
              // Precompute cumulative distances along route (km)
              const coords = routeCoordsRef.current
              const cum: number[] = []
              let total = 0
              for (let i = 0; i < coords.length; i++) {
                if (i === 0) cum.push(0)
                else {
                  total += haversine(coords[i-1][1], coords[i-1][0], coords[i][1], coords[i][0])
                  cum.push(total)
                }
              }
              routeCumKmRef.current = cum
              // Prefetch elevation profile for the route (sampled)
              fetch('/api/elevation/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coordinates: coords })
              }).then(async (res) => {
                if (res.ok) {
                  const j = await res.json()
                  elevProfileRef.current = { distances: j.distances || [], elevations: j.elevations || [] }
                  setElevationProfile(elevProfileRef.current)
                }
              }).catch(() => {})
            } catch {}
            mm.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#14b8a6', 'line-width': 3, 'line-opacity': 0.85 }
            })
            setRouteProvider(routeData.provider)
            setRouteLoading(false)
          })
          .catch(() => {
            // Fallback to straight line
            if (!map.current) return
            const mm = map.current
            const coordinates = locations.map(loc => [loc.longitude, loc.latitude])
            mm.addSource('route', {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }
            })
            routeCoordsRef.current = coordinates as [number, number][]
            // Precompute cumulative distances along route (km)
            const coords = routeCoordsRef.current
            const cum: number[] = []
            let total = 0
            for (let i = 0; i < coords.length; i++) {
              if (i === 0) cum.push(0)
              else {
                total += haversine(coords[i-1][1], coords[i-1][0], coords[i][1], coords[i][0])
                cum.push(total)
              }
            }
            routeCumKmRef.current = cum
            // Prefetch elevation profile for the route (sampled)
            fetch('/api/elevation/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coordinates: coords })
            }).then(async (res) => {
              if (res.ok) {
                const j = await res.json()
                elevProfileRef.current = { distances: j.distances || [], elevations: j.elevations || [] }
                setElevationProfile(elevProfileRef.current)
              }
            }).catch(() => {})
            mm.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#14b8a6', 'line-width': 3, 'line-opacity': 0.8, 'line-dasharray': [2, 2] }
            })
            setRouteProvider('osrm')
            setRouteLoading(false)


          })
      }

      // Fit bounds with animation
      if (locations.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        locations.forEach(loc => bounds.extend([loc.longitude, loc.latitude]))
        m.fitBounds(bounds, { padding: 50, maxZoom: 10, duration: 300 })
      }
    } catch (err) {
      console.warn('Map update failed:', err)
    }
  }, [locationKey, transportMode, routePreference])

  // Preview alternative route overlay (hover in Change Route modal)
  const previewKey = (previewLocations || []).map(l => `${l.latitude},${l.longitude}`).join('|')
  useEffect(() => {
    if (!map.current) return
    const m = map.current

    // Remove previous preview layer/source
    if (m.getSource('preview-route')) {
      if (m.getLayer('preview-route')) m.removeLayer('preview-route')
      m.removeSource('preview-route')
    }

    if (!previewLocations || previewLocations.length < 2) return

    // Fetch and render preview route
    fetchRealRoute(previewLocations, transportMode, previewPreference || routePreference || undefined)
      .then(routeData => {
        if (!map.current) return
        const mm = map.current
        // Safety: remove if still exists
        if (mm.getSource('preview-route')) {
          if (mm.getLayer('preview-route')) mm.removeLayer('preview-route')
          mm.removeSource('preview-route')
        }
        mm.addSource('preview-route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: routeData.geometry }
        })
        mm.addLayer({
          id: 'preview-route',
          type: 'line',
          source: 'preview-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
            'line-opacity': 0.65,
            'line-dasharray': [1, 2]
          }
        })
      })
      .catch(() => {
        // Silent fail for preview
      })
  }, [previewKey, transportMode, previewPreference, routePreference])


  // DISABLED: No automatic animation on hover/scroll - too sensitive and annoying
  // Map stays static and users can manually pan/zoom if needed
  // This prevents the constant resetting and restarting of zoom animations

  return (
    <div className="relative">
      {/* Map */}
      {/* Step 1 micro copy */}
      <div className="absolute top-2 left-4 z-20 text-[11px] text-gray-700 bg-white/80 rounded-full px-2 py-0.5 shadow-sm">
        Step 1: Choose Route
      </div>

      <div ref={mapContainer} className={`rounded-lg overflow-hidden ${className}`} />
      {/* Preview overlay label */}
      {previewPreference && (
        <div className="absolute top-12 left-4 z-20 text-[11px] text-gray-700 bg-white/90 rounded-full px-2 py-0.5 shadow-sm border border-gray-200">
          Preview: {previewPreference === 'fastest' ? 'Fastest' : previewPreference === 'scenic' ? 'Scenic' : 'Longest'}
        </div>
      )}

      {/* Route preference pills (wrapped) */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
          <div className="text-[11px] text-gray-600 font-medium mb-1">Route options</div>
          <div className="flex gap-2">
            {(['fastest','scenic','longest'] as const).map((p) => (
              <button
                key={p}
                onMouseEnter={() => setPreviewPreference(p)}
                onMouseLeave={() => setPreviewPreference(null)}
                onClick={() => {
                  setRoutePreference(p)
                  previousLocationKey.current = ''
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border transition-colors ${
                  routePreference === p
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                }`}
                aria-label={`Select ${p} route`}
                title={`Preview ${p} route`}
              >
                {p === 'fastest' ? 'Fastest' : p === 'scenic' ? 'Scenic' : 'Longest'}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Route provider badge (hidden by default) */}
      {showProviderBadge && routeProvider && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-gray-700 z-10">
          {routeProvider === 'cache' && '⚡ Cached route'}
          {routeProvider === 'openrouteservice' && '🗺️ OpenRouteService'}
          {routeProvider === 'osrm' && '🌍 OSRM'}
        </div>
      )}

      {/* Loading */}
      {routeLoading && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-gray-700 z-10">
          Loading route...
        </div>


      )}

      {/* Route popup (anchored near the dot, bounds-safe) */}
      {popupData && popupPos && (
        <div
          className="absolute z-20 pointer-events-auto max-w-xs"
          style={{ left: popupPos.x, top: popupPos.y }}
        >
          <div className="relative">
            {/* Curved arrow tail */}
            <svg className="absolute -left-2 top-3" width="12" height="10" viewBox="0 0 12 10" aria-hidden="true">
              <path d="M12 0 C 6 3, 6 7, 0 10 L 10 5 Z" fill="white" stroke="#e5e7eb" />
            </svg>
            <RoutePopup
              distanceKm={popupData.distanceKm}
              durationH={popupData.distanceKm / 80}
              elevationM={popupData.elevationM}
              onClose={() => { setPopupData(null); setPopupPos(null) }}
              onAddNote={(text: string) => addNoteAtCurrent(text)}
              onAddChecklist={(text: string) => addChecklistAtCurrent(text)}
              onAddWaypoint={() => {
                const detail = { lat: popupData.lat, lng: popupData.lng, nearestStop }
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('plan-v2:add-waypoint', { detail }))
              }}
            />
          </div>
        </div>
      )}

      {/* POI suggestions (contextual, right side) */}
      {popupData && (
        <div className="absolute top-4 right-4 z-20">
          <RoutePOISuggestions
            center={{ latitude: popupData.lat, longitude: popupData.lng }}
            radiusKm={25}
            nearestLocationIndex={nearestStop?.index}
            nearestLocationName={nearestStop?.name}
            onInsertPOI={async (poi, position, index) => {
              try {
                let enriched: any = { ...poi }
                // If distance missing, try to enrich with coordinates and compute true distance to route
                if ((enriched.estimatedDistance == null || Number.isNaN(enriched.estimatedDistance)) && routeCoordsRef.current.length) {
                  let lat: number | undefined
                  let lng: number | undefined
                  if (enriched.coordinates && typeof enriched.coordinates.latitude === 'number' && typeof enriched.coordinates.longitude === 'number') {
                    lat = enriched.coordinates.latitude
                    lng = enriched.coordinates.longitude
                  } else if (enriched.address && typeof enriched.address === 'string' && enriched.address.length > 3) {
                    try {
                      const geo = await geocodeAddress(enriched.address)
                      if (geo) { lat = geo.lat; lng = geo.lon }
                    } catch {}
                  }
                  if (typeof lat === 'number' && typeof lng === 'number') {
                    const dKm = nearestDistanceKmToRoute(lat, lng, routeCoordsRef.current)
                    if (Number.isFinite(dKm)) enriched.estimatedDistance = dKm
                  }
                }
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('plan-v2:insert-poi', { detail: { poi: enriched, position, index } }))
                }
              } catch {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('plan-v2:insert-poi', { detail: { poi, position, index } }))
                }
              }
            }}
          />
        </div>
      )}

      {/* Elevation Profile */}
      {showElevation && elevationProfile && elevationProfile.elevations.length > 0 && (
        <div className="mt-3">
          <ElevationProfile
            elevations={elevationProfile.elevations}
            distances={elevationProfile.distances}
            ascent={elevationProfile.elevations.reduce((acc, e, i, arr) => acc + (i>0 && e>arr[i-1] ? (e-arr[i-1]) : 0), 0)}
            descent={elevationProfile.elevations.reduce((acc, e, i, arr) => acc + (i>0 && e<arr[i-1] ? (arr[i-1]-e) : 0), 0)}
            maxElevation={Math.max(...elevationProfile.elevations)}
            minElevation={Math.min(...elevationProfile.elevations)}
            hoverKm={hoverKm}
            onHoverKm={(km) => {
              setHoverKm(km)
              if (!map.current || km == null) return
              // Find nearest index on profile by distance
              const distances = elevProfileRef.current.distances
              let idx = 0
              let best = Number.POSITIVE_INFINITY
              for (let i = 0; i < distances.length; i++) {
                const d = Math.abs(distances[i] - km)
                if (d < best) { best = d; idx = i }
              }
              const coord = routeCoordsRef.current[idx]
              if (!coord) return
              const src = map.current.getSource('route-hover-point') as maplibregl.GeoJSONSource
              if (src) {
                src.setData({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coord } })
              }
              // Do not live-reposition popup while hovering elevation; click-only behavior
              // Intentionally disabled to avoid confusing UI
              // if (popupData && map.current && mapContainer.current) {
              //   const lng = coord[0]
              //   const lat = coord[1]
              //   const elevationM = elevProfileRef.current.elevations[idx]
              //   setPopupData({ lng, lat, distanceKm: distances[idx], elevationM })
              //   const pt = map.current.project([lng, lat]) as any
              //   const cw = mapContainer.current.clientWidth
              //   const ch = mapContainer.current.clientHeight
              //   const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
              //   const x = clamp(pt.x + 12, 8, cw - 320)
              //   const y = clamp(pt.y - 12, 8, ch - 160)
              //   setPopupPos({ x, y })
              // }
            }}
          />
        </div>
      )}
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders when parent updates
export const TripOverviewMap = memo(TripOverviewMapComponent)

/**
 * Fetch real road route from routing API
 */
async function fetchRealRoute(
  locations: Array<{ latitude: number; longitude: number }>,
  transportMode: string,
  preference?: 'fastest' | 'scenic' | 'longest'
) {
  const coordinates = locations.map(loc => ({
    longitude: loc.longitude,
    latitude: loc.latitude
  }))

  // Map transport mode to routing profile
  let profile = 'driving-car'
  if (transportMode === 'bike') profile = 'cycling-regular'
  if (transportMode === 'foot') profile = 'foot-walking'
  if (transportMode === 'train' || transportMode === 'flight') profile = 'driving-car' // Use car for train/flight

  const response = await fetch('/api/routing/get-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates, profile, preference: preference === 'scenic' ? 'scenic' : preference })
  })

  if (!response.ok) {
    throw new Error('Routing API failed')
  }

  return response.json()
}

