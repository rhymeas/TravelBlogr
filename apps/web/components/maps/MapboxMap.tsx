'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Map, { Marker, Popup, Source, Layer, NavigationControl, GeolocateControl, ScaleControl } from 'react-map-gl'
import { MapPin, Navigation, Route, Layers, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import * as turf from '@turf/turf'
// import 'mapbox-gl/dist/mapbox-gl.css' // Using shim instead

interface LocationPoint {
  id: string
  lat: number
  lng: number
  title?: string
  description?: string
  timestamp?: string
  type?: 'waypoint' | 'photo' | 'accommodation' | 'restaurant' | 'attraction'
  metadata?: any
}

interface MapboxMapProps {
  locations?: LocationPoint[]
  center?: [number, number]
  zoom?: number
  height?: string
  showRoute?: boolean
  showControls?: boolean
  allowAddPoints?: boolean
  onLocationAdd?: (location: LocationPoint) => void
  onLocationUpdate?: (location: LocationPoint) => void
  onLocationDelete?: (locationId: string) => void
  className?: string
  mapboxToken?: string
}

export function MapboxMap({
  locations = [],
  center = [-74.0060, 40.7128], // Default to NYC (lng, lat for Mapbox)
  zoom = 13,
  height = '400px',
  showRoute = true,
  showControls = true,
  allowAddPoints = false,
  onLocationAdd,
  onLocationUpdate,
  onLocationDelete,
  className = '',
  mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
}: MapboxMapProps) {
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom: zoom
  })
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12')
  const [showPopup, setShowPopup] = useState<{ location: LocationPoint; show: boolean } | null>(null)
  const mapRef = useRef<any>(null)

  // Map style options
  const mapStyles = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11'
  }

  // Create route GeoJSON from locations
  const createRouteGeoJSON = useCallback(() => {
    if (locations.length < 2) return null

    // Sort locations by timestamp if available
    const sortedLocations = [...locations].sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      }
      return 0
    })

    const coordinates = sortedLocations.map(loc => [loc.lng, loc.lat])

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates
      }
    }
  }, [locations])

  // Route layer style
  const routeLayerStyle = {
    id: 'route',
    type: 'line' as const,
    paint: {
      'line-color': '#3b82f6',
      'line-width': 4,
      'line-opacity': 0.8
    }
  }

  // Handle map click for adding points
  const handleMapClick = useCallback((event: any) => {
    if (allowAddPoints && onLocationAdd) {
      const { lng, lat } = event.lngLat
      const newLocation: LocationPoint = {
        id: `location-${Date.now()}`,
        lat,
        lng,
        title: 'New Location',
        type: 'waypoint',
        timestamp: new Date().toISOString()
      }
      onLocationAdd(newLocation)
    }
  }, [allowAddPoints, onLocationAdd])

  // Handle search/geocoding
  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapboxToken) return

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&limit=1`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        setViewState(prev => ({
          ...prev,
          longitude: lng,
          latitude: lat,
          zoom: 15
        }))
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  // Get marker color based on location type
  const getMarkerColor = (type: string) => {
    const colorMap = {
      waypoint: '#3b82f6',
      photo: '#10b981',
      accommodation: '#f59e0b',
      restaurant: '#ef4444',
      attraction: '#8b5cf6'
    }
    return colorMap[type as keyof typeof colorMap] || '#3b82f6'
  }

  // Get marker emoji based on location type
  const getMarkerEmoji = (type: string) => {
    const emojiMap = {
      waypoint: '📍',
      photo: '📷',
      accommodation: '🏨',
      restaurant: '🍽️',
      attraction: '🎯'
    }
    return emojiMap[type as keyof typeof emojiMap] || '📍'
  }

  // Fit map to show all locations
  const fitToLocations = useCallback(() => {
    if (locations.length === 0 || !mapRef.current) return

    const bounds = locations.reduce((bounds, location) => {
      return bounds.extend([location.lng, location.lat])
    }, new mapboxgl.LngLatBounds())

    mapRef.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    })
  }, [locations])

  // Calculate route statistics
  const routeStats = useCallback(() => {
    if (locations.length < 2) return null

    const sortedLocations = [...locations].sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      }
      return 0
    })

    let totalDistance = 0
    for (let i = 0; i < sortedLocations.length - 1; i++) {
      const from = turf.point([sortedLocations[i].lng, sortedLocations[i].lat])
      const to = turf.point([sortedLocations[i + 1].lng, sortedLocations[i + 1].lat])
      totalDistance += turf.distance(from, to, { units: 'kilometers' })
    }

    return {
      distance: totalDistance,
      points: sortedLocations.length,
      duration: sortedLocations[0].timestamp && sortedLocations[sortedLocations.length - 1].timestamp
        ? new Date(sortedLocations[sortedLocations.length - 1].timestamp!).getTime() - 
          new Date(sortedLocations[0].timestamp!).getTime()
        : null
    }
  }, [locations])

  const stats = routeStats()

  if (!mapboxToken) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ height }}>
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Mapbox Token Required</h3>
          <p className="text-gray-600">
            Please add your Mapbox token to environment variables to use this map component.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-10 space-y-2">
          {/* Search */}
          <div className="flex bg-white rounded-lg shadow-lg">
            <Input
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="border-0 rounded-r-none"
            />
            <Button
              onClick={handleSearch}
              variant="ghost"
              size="sm"
              className="rounded-l-none"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Map Style Selector */}
          <Select value={mapStyle} onValueChange={setMapStyle}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={mapStyles.streets}>Streets</SelectItem>
              <SelectItem value={mapStyles.satellite}>Satellite</SelectItem>
              <SelectItem value={mapStyles.outdoors}>Outdoors</SelectItem>
              <SelectItem value={mapStyles.light}>Light</SelectItem>
              <SelectItem value={mapStyles.dark}>Dark</SelectItem>
            </SelectContent>
          </Select>

          {/* Fit to Locations Button */}
          {locations.length > 0 && (
            <Button
              onClick={fitToLocations}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <Route className="h-4 w-4 mr-2" />
              Fit Route
            </Button>
          )}
        </div>
      )}

      {/* Route Statistics */}
      {stats && showRoute && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-10">
          <div className="text-sm space-y-1">
            <div className="font-medium">Route Statistics</div>
            <div>Distance: {stats.distance.toFixed(2)} km</div>
            <div>Points: {stats.points}</div>
            {stats.duration && (
              <div>Duration: {Math.round(stats.duration / (1000 * 60 * 60))}h</div>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />
        <ScaleControl position="bottom-left" />

        {/* Route Line */}
        {showRoute && createRouteGeoJSON() && (
          <Source id="route" type="geojson" data={createRouteGeoJSON()}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {/* Location Markers */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            longitude={location.lng}
            latitude={location.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setShowPopup({ location, show: true })
            }}
          >
            <div
              className="cursor-pointer transform hover:scale-110 transition-transform"
              style={{ color: getMarkerColor(location.type || 'waypoint') }}
            >
              <div className="text-2xl">{getMarkerEmoji(location.type || 'waypoint')}</div>
            </div>
          </Marker>
        ))}

        {/* Popup */}
        {showPopup && showPopup.show && (
          <Popup
            longitude={showPopup.location.lng}
            latitude={showPopup.location.lat}
            anchor="top"
            onClose={() => setShowPopup(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getMarkerEmoji(showPopup.location.type || 'waypoint')}</span>
                <h3 className="font-semibold">{showPopup.location.title}</h3>
              </div>
              {showPopup.location.description && (
                <p className="text-sm text-gray-600 mb-2">{showPopup.location.description}</p>
              )}
              <div className="text-xs text-gray-500 mb-2">
                <div>Coordinates: {showPopup.location.lat.toFixed(6)}, {showPopup.location.lng.toFixed(6)}</div>
                {showPopup.location.timestamp && (
                  <div>Time: {new Date(showPopup.location.timestamp).toLocaleString()}</div>
                )}
              </div>
              <div className="flex gap-2">
                {onLocationUpdate && (
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                )}
                {onLocationDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onLocationDelete(showPopup.location.id)
                      setShowPopup(null)
                    }}
                    className="text-red-600"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Add Point Instructions */}
      {allowAddPoints && (
        <div className="absolute bottom-4 right-4 bg-blue-100 text-blue-800 p-2 rounded text-sm z-10">
          Click on the map to add a location
        </div>
      )}
    </div>
  )
}
