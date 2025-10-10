// @ts-nocheck
'use client'

import { useState, useCallback, useMemo } from 'react'
import Map, { 
  Marker, 
  Popup, 
  NavigationControl, 
  GeolocateControl,
  ScaleControl,
  Source,
  Layer
} from 'react-map-gl'
import type { MapRef, ViewState } from 'react-map-gl'
import { MapPin, Navigation } from 'lucide-react'
// import 'mapbox-gl/dist/mapbox-gl.css' // Using shim instead

interface Location {
  id: string
  name: string
  coordinates: [number, number] // [longitude, latitude]
  description?: string
  date?: string
  photos?: string[]
}

interface ReactMapGLProps {
  locations: Location[]
  onLocationClick?: (location: Location) => void
  onMapClick?: (coordinates: [number, number]) => void
  showRoute?: boolean
  interactive?: boolean
  height?: string
  className?: string
  initialViewState?: Partial<ViewState>
}

export function ReactMapGL({
  locations = [],
  onLocationClick,
  onMapClick,
  showRoute = true,
  interactive = true,
  height = '400px',
  className = '',
  initialViewState
}: ReactMapGLProps) {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: locations.length > 0 ? locations[0].coordinates[0] : -74.5,
    latitude: locations.length > 0 ? locations[0].coordinates[1] : 40,
    zoom: locations.length > 0 ? 10 : 2,
    ...initialViewState
  })
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/outdoors-v12')

  // Memoized route data for performance
  const routeData = useMemo(() => {
    if (!showRoute || locations.length < 2) return null

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: locations.map(loc => loc.coordinates)
      }
    }
  }, [locations, showRoute])

  // Route layer style
  const routeLayer = {
    id: 'route',
    type: 'line' as const,
    paint: {
      'line-color': '#3b82f6',
      'line-width': 3,
      'line-opacity': 0.8
    }
  }

  const handleMapClick = useCallback((event: any) => {
    if (onMapClick) {
      const { lng, lat } = event.lngLat
      onMapClick([lng, lat])
    }
  }, [onMapClick])

  const handleMarkerClick = useCallback((location: Location) => {
    setSelectedLocation(location)
    onLocationClick?.(location)
  }, [onLocationClick])

  const toggleMapStyle = () => {
    setMapStyle(current => 
      current === 'mapbox://styles/mapbox/outdoors-v12'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/outdoors-v12'
    )
  }

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Map requires Mapbox access token</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={mapStyle}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        interactive={interactive}
        attributionControl={false}
      >
        {/* Route line */}
        {routeData && (
          <Source id="route" type="geojson" data={routeData}>
            <Layer {...routeLayer} />
          </Source>
        )}

        {/* Location markers */}
        {locations.map((location, index) => (
          <Marker
            key={location.id}
            longitude={location.coordinates[0]}
            latitude={location.coordinates[1]}
            anchor="bottom"
          >
            <button
              className="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm hover:bg-blue-700 transition-colors"
              onClick={() => handleMarkerClick(location)}
            >
              {index + 1}
            </button>
          </Marker>
        ))}

        {/* Popup for selected location */}
        {selectedLocation && (
          <Popup
            longitude={selectedLocation.coordinates[0]}
            latitude={selectedLocation.coordinates[1]}
            anchor="top"
            onClose={() => setSelectedLocation(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedLocation.name}
              </h3>
              {selectedLocation.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {selectedLocation.description}
                </p>
              )}
              {selectedLocation.date && (
                <p className="text-xs text-gray-500">
                  {new Date(selectedLocation.date).toLocaleDateString()}
                </p>
              )}
              {selectedLocation.photos && selectedLocation.photos.length > 0 && (
                <div className="mt-2">
                  <img
                    src={selectedLocation.photos[0]}
                    alt={selectedLocation.name}
                    className="w-full h-20 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </Popup>
        )}

        {/* Map controls */}
        {interactive && (
          <>
            <NavigationControl position="top-right" />
            <GeolocateControl
              position="top-right"
              trackUserLocation={true}
              showUserHeading={true}
            />
            <ScaleControl position="bottom-left" />
          </>
        )}
      </Map>

      {/* Custom controls */}
      {interactive && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <button
            onClick={toggleMapStyle}
            className="bg-white/90 hover:bg-white p-2 rounded shadow-lg transition-colors"
            title="Toggle map style"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Location counter */}
      {locations.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-2 text-sm font-medium">
          {locations.length} location{locations.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// Hook for managing map state
export function useMapState(initialLocations: Location[] = []) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const addLocation = useCallback((location: Location) => {
    setLocations(prev => [...prev, location])
  }, [])

  const removeLocation = useCallback((locationId: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== locationId))
    setSelectedLocation(prev => prev?.id === locationId ? null : prev)
  }, [])

  const updateLocation = useCallback((locationId: string, updates: Partial<Location>) => {
    setLocations(prev => prev.map(loc => 
      loc.id === locationId ? { ...loc, ...updates } : loc
    ))
    
    setSelectedLocation(prev => 
      prev?.id === locationId ? { ...prev, ...updates } : prev
    )
  }, [])

  const clearLocations = useCallback(() => {
    setLocations([])
    setSelectedLocation(null)
  }, [])

  return {
    locations,
    selectedLocation,
    setSelectedLocation,
    addLocation,
    removeLocation,
    updateLocation,
    clearLocations,
  }
}

// Utility functions for map operations
export const mapUtils = {
  // Calculate bounds for multiple locations
  getBounds: (locations: Location[]) => {
    if (locations.length === 0) return null

    let minLng = locations[0].coordinates[0]
    let maxLng = locations[0].coordinates[0]
    let minLat = locations[0].coordinates[1]
    let maxLat = locations[0].coordinates[1]

    locations.forEach(location => {
      const [lng, lat] = location.coordinates
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    })

    return {
      west: minLng,
      east: maxLng,
      south: minLat,
      north: maxLat
    }
  },

  // Calculate center point
  getCenter: (locations: Location[]): [number, number] => {
    if (locations.length === 0) return [0, 0]

    const totalLng = locations.reduce((sum, loc) => sum + loc.coordinates[0], 0)
    const totalLat = locations.reduce((sum, loc) => sum + loc.coordinates[1], 0)

    return [totalLng / locations.length, totalLat / locations.length]
  },

  // Calculate distance between two points (in km)
  getDistance: (coord1: [number, number], coord2: [number, number]) => {
    const R = 6371 // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180
    const dLng = (coord2[0] - coord1[0]) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}
