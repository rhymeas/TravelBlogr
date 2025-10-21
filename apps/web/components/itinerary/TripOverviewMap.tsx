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

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface TripOverviewMapProps {
  locations: Array<{
    name: string
    latitude: number
    longitude: number
  }>
  transportMode?: 'car' | 'bike' | 'foot' | 'train' | 'flight' | 'bus' | 'mixed'
  className?: string
}

export function TripOverviewMap({ locations, transportMode = 'car', className = '' }: TripOverviewMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeProvider, setRouteProvider] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      try {
        if (!mapContainer.current) return

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

          // Add markers for each location
          locations.forEach((location, index) => {
            const el = document.createElement('div')
            el.className = 'w-8 h-8 bg-teal-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform'
            el.textContent = (index + 1).toString()

            const marker = new maplibregl.Marker({ element: el })
              .setLngLat([location.longitude, location.latitude])
              .setPopup(
                new maplibregl.Popup({ offset: 25 })
                  .setHTML(`<div class="font-semibold">${location.name}</div>`)
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
  }, [locations])

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

