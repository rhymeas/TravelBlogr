'use client'

/**
 * Direct Valhalla Test - Google Maps Style
 * 
 * Fresh approach - calls Valhalla API directly with Google Maps-style costing
 * No caching, no old routing service - pure Valhalla test
 */

import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const DESTINATIONS = [
  { name: 'Vancouver', latitude: 49.2827, longitude: -123.1207, emoji: '🏔️' },
  { name: 'Banff', latitude: 51.1784, longitude: -115.5708, emoji: '⛰️' },
  { name: 'Calgary', latitude: 51.0447, longitude: -114.0719, emoji: '🌆' },
  { name: 'Whistler', latitude: 50.1163, longitude: -122.9574, emoji: '⛷️' },
]

const ROUTE_TYPES = [
  { id: 'fastest', name: 'Fastest', color: '#3b82f6' },
  { id: 'shortest', name: 'Shortest', color: '#10b981' },
  { id: 'scenic', name: 'Scenic', color: '#f59e0b' },
  { id: 'longest', name: 'Longest', color: '#ef4444' },
]

export default function ValhallaDirectTest() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [start, setStart] = useState(DESTINATIONS[0])
  const [end, setEnd] = useState(DESTINATIONS[1])
  const [selectedRoute, setSelectedRoute] = useState('scenic')
  const [loading, setLoading] = useState(false)
  const [routeInfo, setRouteInfo] = useState<any>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [-119, 50.5],
      zoom: 5
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
  }, [])

  // Fetch route when selections change
  useEffect(() => {
    if (!map.current || !start || !end) return
    fetchRoute()
  }, [start, end, selectedRoute])

  const fetchRoute = async () => {
    if (!map.current) return
    
    setLoading(true)
    setRouteInfo(null)

    try {
      // Calculate distance for dynamic config
      const distance = calculateDistance(start, end)
      
      // Get Google Maps-style config
      const config = getValhallaConfig(selectedRoute, distance)
      
      console.log(`🎯 Fetching ${selectedRoute} route (${distance.toFixed(0)}km)`)
      console.log('📋 Config:', config)

      // Call Valhalla API directly
      const response = await fetch('/api/test/valhalla-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start,
          end,
          config
        })
      })

      if (!response.ok) throw new Error('Valhalla API failed')

      const data = await response.json()
      setRouteInfo(data)

      // Draw route on map
      drawRoute(data.geometry)

      console.log(`✅ Route: ${(data.distance / 1000).toFixed(1)}km, ${(data.duration / 60).toFixed(0)}min`)
    } catch (error) {
      console.error('❌ Route fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const drawRoute = (geometry: any) => {
    if (!map.current) return

    // Remove old route
    if (map.current.getSource('route')) {
      if (map.current.getLayer('route')) map.current.removeLayer('route')
      map.current.removeSource('route')
    }

    // Add new route
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry
      }
    })

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': ROUTE_TYPES.find(r => r.id === selectedRoute)?.color || '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.8
      }
    })

    // Fit bounds
    const coords = geometry.coordinates as [number, number][]
    const bounds = coords.reduce((bounds, coord) => {
      return bounds.extend(coord as [number, number])
    }, new maplibregl.LngLatBounds(coords[0], coords[0]))

    map.current.fitBounds(bounds, { padding: 50 })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Valhalla Direct Test</h1>
        <p className="text-sm text-gray-600 mt-1">Google Maps-style routing - Fresh approach</p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Start */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="text-xs font-medium text-gray-500 uppercase">Start</label>
              <select
                value={start.name}
                onChange={(e) => setStart(DESTINATIONS.find(d => d.name === e.target.value)!)}
                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {DESTINATIONS.map(d => (
                  <option key={d.name} value={d.name}>{d.emoji} {d.name}</option>
                ))}
              </select>
            </div>

            {/* End */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="text-xs font-medium text-gray-500 uppercase">End</label>
              <select
                value={end.name}
                onChange={(e) => setEnd(DESTINATIONS.find(d => d.name === e.target.value)!)}
                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {DESTINATIONS.map(d => (
                  <option key={d.name} value={d.name}>{d.emoji} {d.name}</option>
                ))}
              </select>
            </div>

            {/* Route Type */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Route Type</label>
              <div className="space-y-2">
                {ROUTE_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedRoute(type.id)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRoute === type.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Route Info */}
            {routeInfo && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-xs font-medium text-gray-500 uppercase mb-2">Route Info</div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Distance:</span>
                    <span className="ml-2 font-medium">{(routeInfo.distance / 1000).toFixed(1)} km</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{(routeInfo.duration / 60).toFixed(0)} min</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Provider:</span>
                    <span className="ml-2 font-medium">{routeInfo.provider}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
              <div ref={mapContainer} className="w-full h-[700px]" />
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-3"></div>
                    <p className="text-sm font-medium text-gray-700">Calculating route...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Calculate distance between two points (km)
function calculateDistance(start: any, end: any): number {
  const R = 6371
  const dLat = (end.latitude - start.latitude) * Math.PI / 180
  const dLon = (end.longitude - start.longitude) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Google Maps-style Valhalla config
function getValhallaConfig(routeType: string, distance_km: number) {
  const AVOID_BORDERS = {
    country_crossing_cost: 10000,
    country_crossing_penalty: 10000
  }

  if (routeType === 'scenic') {
    if (distance_km < 50) {
      return {
        use_highways: 0.0,
        use_tolls: 0.0,
        use_living_streets: 1.0,
        use_tracks: 0.0,
        use_ferry: 0.5,
        maneuver_penalty: 2,
        gate_penalty: 50,
        ...AVOID_BORDERS
      }
    } else if (distance_km < 200) {
      return {
        use_highways: 0.1,
        use_tolls: 0.0,
        use_living_streets: 0.9,
        use_tracks: 0.0,
        use_ferry: 0.6,
        maneuver_penalty: 3,
        gate_penalty: 75,
        ...AVOID_BORDERS
      }
    } else {
      return {
        use_highways: 0.2,
        use_tolls: 0.1,
        use_living_streets: 0.8,
        use_tracks: 0.0,
        use_ferry: 0.7,
        maneuver_penalty: 5,
        gate_penalty: 100,
        ...AVOID_BORDERS
      }
    }
  }

  // Add other route types as needed
  return {
    use_highways: 1.0,
    use_tolls: 1.0,
    maneuver_penalty: 15,
    ...AVOID_BORDERS
  }
}

