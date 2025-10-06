'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
// import 'mapbox-gl/dist/mapbox-gl.css' // Using shim instead
import { MapPin, Navigation, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

interface Location {
  id: string
  name: string
  coordinates: [number, number] // [longitude, latitude]
  description?: string
  date?: string
  photos?: string[]
}

interface TripMapProps {
  locations: Location[]
  onLocationClick?: (location: Location) => void
  onMapClick?: (coordinates: [number, longitude]) => void
  showRoute?: boolean
  interactive?: boolean
  height?: string
  className?: string
}

export function TripMap({
  locations = [],
  onLocationClick,
  onMapClick,
  showRoute = true,
  interactive = true,
  height = '400px',
  className = ''
}: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [trackingLocation, setTrackingLocation] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: locations.length > 0 ? locations[0].coordinates : [-74.5, 40],
      zoom: locations.length > 0 ? 10 : 2,
      interactive
    })

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    // Add click handler
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick([e.lngLat.lng, e.lngLat.lat])
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add markers when locations change
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker')
    existingMarkers.forEach(marker => marker.remove())

    // Add new markers
    locations.forEach((location, index) => {
      // Create custom marker element
      const markerElement = document.createElement('div')
      markerElement.className = 'custom-marker'
      markerElement.innerHTML = `
        <div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm">
          ${index + 1}
        </div>
      `

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">${location.name}</h3>
          ${location.description ? `<p class="text-sm text-gray-600 mt-1">${location.description}</p>` : ''}
          ${location.date ? `<p class="text-xs text-gray-500 mt-1">${new Date(location.date).toLocaleDateString()}</p>` : ''}
        </div>
      `)

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(location.coordinates)
        .setPopup(popup)
        .addTo(map.current!)

      // Add click handler
      markerElement.addEventListener('click', () => {
        onLocationClick?.(location)
      })
    })

    // Fit map to show all locations
    if (locations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      locations.forEach(location => {
        bounds.extend(location.coordinates)
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }, [locations, mapLoaded, onLocationClick])

  // Add route line
  useEffect(() => {
    if (!map.current || !mapLoaded || !showRoute || locations.length < 2) return

    const coordinates = locations.map(loc => loc.coordinates)

    // Add route source and layer
    if (map.current.getSource('route')) {
      map.current.removeLayer('route')
      map.current.removeSource('route')
    }

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
        'line-color': '#3b82f6',
        'line-width': 3,
        'line-opacity': 0.8
      }
    })
  }, [locations, mapLoaded, showRoute])

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    setTrackingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ]
        setUserLocation(coords)
        
        if (map.current) {
          map.current.flyTo({
            center: coords,
            zoom: 15
          })

          // Add user location marker
          const userMarker = document.createElement('div')
          userMarker.className = 'user-location-marker'
          userMarker.innerHTML = `
            <div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          `

          new mapboxgl.Marker(userMarker)
            .setLngLat(coords)
            .addTo(map.current)
        }
        
        setTrackingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to get your location. Please check your browser settings.')
        setTrackingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  // Toggle map style
  const toggleMapStyle = () => {
    if (!map.current) return

    const currentStyle = map.current.getStyle().name
    const newStyle = currentStyle === 'Mapbox Outdoors' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/outdoors-v12'
    
    map.current.setStyle(newStyle)
  }

  if (!mapboxgl.accessToken) {
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
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full"
        style={{ height }}
      />
      
      {/* Map Controls */}
      {interactive && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={getCurrentLocation}
            disabled={trackingLocation}
            className="bg-white/90 hover:bg-white"
          >
            <Navigation className={`h-4 w-4 ${trackingLocation ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMapStyle}
            className="bg-white/90 hover:bg-white"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Location Counter */}
      {locations.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-2 text-sm font-medium">
          {locations.length} location{locations.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
