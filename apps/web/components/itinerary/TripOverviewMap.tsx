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
}

function TripOverviewMapComponent({ locations, transportMode = 'car', className = '', previewLocations }: TripOverviewMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeProvider, setRouteProvider] = useState<string | null>(null)

  // CRITICAL FIX: Use stable location key to prevent re-initialization on hover
  // Only re-initialize if actual locations change (add/remove), not on every render
  const locationKey = locations.map(l => `${l.name}-${l.latitude}-${l.longitude}`).join('|')
  const previousLocationKey = useRef<string>('')

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
            fetchRealRoute(locations, transportMode)
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
      // Prevent unnecessary work if nothing changed
      if (previousLocationKey.current === locationKey) return
      previousLocationKey.current = locationKey

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
        fetchRealRoute(locations, transportMode)
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
  }, [locationKey, transportMode])

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
    fetchRealRoute(previewLocations, transportMode)
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
  }, [previewKey, transportMode])


  // DISABLED: No automatic animation on hover/scroll - too sensitive and annoying
  // Map stays static and users can manually pan/zoom if needed
  // This prevents the constant resetting and restarting of zoom animations

  return (
    <div className="relative">
      <div ref={mapContainer} className={`rounded-lg overflow-hidden ${className}`} />

      {/* Route provider badge */}
      {routeProvider && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-gray-700 z-10">
          {routeProvider === 'cache' && '⚡ Cached route'}
          {routeProvider === 'openrouteservice' && '🗺️ OpenRouteService'}
          {routeProvider === 'osrm' && '🌍 OSRM'}
        </div>
      )}

      {/* Loading indicator */}
      {routeLoading && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-xs font-medium text-gray-700 z-10">
          Loading route...
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
  transportMode: string
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
    body: JSON.stringify({ coordinates, profile })
  })

  if (!response.ok) {
    throw new Error('Routing API failed')
  }

  return response.json()
}

