'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import { Icon, LatLng, Map as LeafletMap } from 'leaflet'
import { MapPin, Navigation, Route, Layers, Search, Plus, Minus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import * as turf from '@turf/turf'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

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

interface InteractiveMapProps {
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
}

// Custom hook for map events
function MapEvents({ onLocationAdd }: { onLocationAdd?: (location: LocationPoint) => void }) {
  useMapEvents({
    click: (e) => {
      if (onLocationAdd) {
        const newLocation: LocationPoint = {
          id: `location-${Date.now()}`,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          title: 'New Location',
          type: 'waypoint',
          timestamp: new Date().toISOString()
        }
        onLocationAdd(newLocation)
      }
    }
  })
  return null
}

// Custom hook for geolocation
function LocationMarker({ onLocationFound }: { onLocationFound?: (location: [number, number]) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const map = useMap()

  useEffect(() => {
    map.locate({ setView: false, maxZoom: 16 })
  }, [map])

  useMapEvents({
    locationfound: (e) => {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng]
      setPosition(newPosition)
      onLocationFound?.(newPosition)
    }
  })

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  )
}

// Route calculation component
function RouteDisplay({ locations }: { locations: LocationPoint[] }) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
  const [routeDistance, setRouteDistance] = useState<number>(0)

  useEffect(() => {
    if (locations.length >= 2) {
      // Sort locations by timestamp if available
      const sortedLocations = [...locations].sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        }
        return 0
      })

      const coordinates: [number, number][] = sortedLocations.map(loc => [loc.lat, loc.lng])
      setRouteCoordinates(coordinates)

      // Calculate total distance using Turf.js
      if (coordinates.length >= 2) {
        let totalDistance = 0
        for (let i = 0; i < coordinates.length - 1; i++) {
          const from = turf.point([coordinates[i][1], coordinates[i][0]])
          const to = turf.point([coordinates[i + 1][1], coordinates[i + 1][0]])
          totalDistance += turf.distance(from, to, { units: 'kilometers' })
        }
        setRouteDistance(totalDistance)
      }
    }
  }, [locations])

  if (routeCoordinates.length < 2) return null

  return (
    <>
      <Polyline
        positions={routeCoordinates}
        pathOptions={{
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10'
        }}
      />
      <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-lg z-[1000]">
        <div className="text-sm font-medium">
          Route Distance: {routeDistance.toFixed(2)} km
        </div>
      </div>
    </>
  )
}

export function InteractiveMap({
  locations = [],
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  height = '400px',
  showRoute = true,
  showControls = true,
  allowAddPoints = false,
  onLocationAdd,
  onLocationUpdate,
  onLocationDelete,
  className = ''
}: InteractiveMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center)
  const [mapZoom, setMapZoom] = useState(zoom)
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets')
  const [showUserLocation, setShowUserLocation] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const mapRef = useRef<LeafletMap>(null)

  // Get tile layer URL based on style
  const getTileLayerUrl = () => {
    switch (mapStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }

  // Get attribution based on style
  const getAttribution = () => {
    switch (mapStyle) {
      case 'satellite':
        return '&copy; <a href="https://www.esri.com/">Esri</a>'
      case 'terrain':
        return '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  }

  // Get marker icon based on location type
  const getMarkerIcon = (type: string) => {
    const iconMap = {
      waypoint: '📍',
      photo: '📷',
      accommodation: '🏨',
      restaurant: '🍽️',
      attraction: '🎯'
    }
    return iconMap[type as keyof typeof iconMap] || '📍'
  }

  // Handle search/geocoding
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      // Using Nominatim for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const results = await response.json()

      if (results.length > 0) {
        const result = results[0]
        const newCenter: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)]
        setMapCenter(newCenter)
        setMapZoom(15)

        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.setView(newCenter, 15)
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  // Handle user location
  const handleLocateUser = () => {
    setShowUserLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ]
          setUserLocation(newLocation)
          setMapCenter(newLocation)
          if (mapRef.current) {
            mapRef.current.setView(newLocation, 16)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          setShowUserLocation(false)
        }
      )
    }
  }

  // Reset map view
  const handleResetView = () => {
    if (locations.length > 0) {
      // Fit bounds to all locations
      const bounds = locations.map(loc => [loc.lat, loc.lng] as [number, number])
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds, { padding: [20, 20] })
      }
    } else {
      setMapCenter(center)
      setMapZoom(zoom)
      if (mapRef.current) {
        mapRef.current.setView(center, zoom)
      }
    }
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-[1000] space-y-2">
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
          <Select value={mapStyle} onValueChange={(value: any) => setMapStyle(value)}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="streets">Streets</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1">
            <Button
              onClick={handleLocateUser}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <Navigation className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleResetView}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
        <Button
          onClick={() => {
            const newZoom = mapZoom + 1
            setMapZoom(newZoom)
            if (mapRef.current) {
              mapRef.current.setZoom(newZoom)
            }
          }}
          variant="outline"
          size="sm"
          className="bg-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => {
            const newZoom = mapZoom - 1
            setMapZoom(newZoom)
            if (mapRef.current) {
              mapRef.current.setZoom(newZoom)
            }
          }}
          variant="outline"
          size="sm"
          className="bg-white"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url={getTileLayerUrl()}
          attribution={getAttribution()}
        />

        {/* Location Markers */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            eventHandlers={{
              click: () => setSelectedLocation(location)
            }}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getMarkerIcon(location.type || 'waypoint')}</span>
                  <h3 className="font-semibold">{location.title}</h3>
                </div>
                {location.description && (
                  <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                )}
                {location.timestamp && (
                  <p className="text-xs text-gray-500">
                    {new Date(location.timestamp).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {onLocationUpdate && (
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  )}
                  {onLocationDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onLocationDelete(location.id)}
                      className="text-red-600"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User Location */}
        {showUserLocation && (
          <LocationMarker onLocationFound={setUserLocation} />
        )}

        {/* Route Display */}
        {showRoute && locations.length >= 2 && (
          <RouteDisplay locations={locations} />
        )}

        {/* Map Events */}
        {allowAddPoints && onLocationAdd && (
          <MapEvents onLocationAdd={onLocationAdd} />
        )}
      </MapContainer>

      {/* Location Info Panel */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{getMarkerIcon(selectedLocation.type || 'waypoint')}</span>
                <h3 className="font-semibold text-lg">{selectedLocation.title}</h3>
              </div>
              {selectedLocation.description && (
                <p className="text-gray-600 mb-2">{selectedLocation.description}</p>
              )}
              <div className="text-sm text-gray-500">
                <p>Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                {selectedLocation.timestamp && (
                  <p>Time: {new Date(selectedLocation.timestamp).toLocaleString()}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLocation(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Add Point Instructions */}
      {allowAddPoints && (
        <div className="absolute bottom-4 right-4 bg-blue-100 text-blue-800 p-2 rounded text-sm z-[1000]">
          Click on the map to add a location
        </div>
      )}
    </div>
  )
}
