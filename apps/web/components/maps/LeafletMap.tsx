// @ts-nocheck - Leaflet dynamic imports have complex type issues
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

interface Location {
  id: string
  name: string
  coordinates: [number, number] // [latitude, longitude] - Note: Leaflet uses lat,lng
  description?: string
  date?: string
  photos?: string[]
}

interface LeafletMapProps {
  locations: Location[]
  onLocationClick?: (location: Location) => void
  onMapClick?: (coordinates: [number, number]) => void
  showRoute?: boolean
  interactive?: boolean
  height?: string
  className?: string
}

export function LeafletMap({
  locations = [],
  onLocationClick,
  onMapClick,
  showRoute = true,
  interactive = true,
  height = '400px',
  className = ''
}: LeafletMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Load Leaflet CSS and create custom icons
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        const L = await import('leaflet')
        
        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        })
        
        setLeafletLoaded(true)
      }
    }
    
    loadLeaflet()
  }, [])

  // Calculate map center and bounds
  const getMapCenter = (): [number, number] => {
    if (locations.length === 0) return [40, -74.5] // Default to NYC
    
    if (locations.length === 1) return locations[0].coordinates
    
    const totalLat = locations.reduce((sum, loc) => sum + loc.coordinates[0], 0)
    const totalLng = locations.reduce((sum, loc) => sum + loc.coordinates[1], 0)
    
    return [totalLat / locations.length, totalLng / locations.length]
  }

  const getZoomLevel = () => {
    if (locations.length === 0) return 2
    if (locations.length === 1) return 13
    return 10
  }

  // Convert coordinates for route (Leaflet expects [lat, lng])
  const routeCoordinates = locations.map(loc => loc.coordinates)

  const handleMapClick = (e: any) => {
    if (onMapClick) {
      const { lat, lng } = e.latlng
      onMapClick([lat, lng])
    }
  }

  const handleMarkerClick = (location: Location) => {
    onLocationClick?.(location)
  }

  // Custom numbered marker component
  const NumberedMarker = ({ location, index }: { location: Location; index: number }) => {
    const [L, setL] = useState<any>(null)
    const [customIcon, setCustomIcon] = useState<any>(null)

    useEffect(() => {
      const loadIcon = async () => {
        const leaflet = await import('leaflet')
        
        const icon = leaflet.divIcon({
          html: `<div class="numbered-marker">${index + 1}</div>`,
          className: 'custom-div-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        })
        
        setL(leaflet)
        setCustomIcon(icon)
      }
      
      if (isClient) {
        loadIcon()
      }
    }, [index, isClient])

    if (!customIcon) return null

    return (
      <Marker
        position={location.coordinates}
        icon={customIcon}
        eventHandlers={{
          click: () => handleMarkerClick(location)
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold text-gray-900 mb-1">
              {location.name}
            </h3>
            {location.description && (
              <p className="text-sm text-gray-600 mb-2">
                {location.description}
              </p>
            )}
            {location.date && (
              <p className="text-xs text-gray-500">
                {new Date(location.date).toLocaleDateString()}
              </p>
            )}
            {location.photos && location.photos.length > 0 && (
              <div className="mt-2">
                <img
                  src={location.photos[0]}
                  alt={location.name}
                  className="w-full h-20 object-cover rounded"
                />
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    )
  }

  if (!isClient || !leafletLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Custom CSS for numbered markers */}
      <style jsx global>{`
        .numbered-marker {
          width: 30px;
          height: 30px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-container {
          border-radius: 0.5rem;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
        <MapContainer
          center={getMapCenter()}
          zoom={getZoomLevel()}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={interactive}
          dragging={interactive}
          touchZoom={interactive}
          doubleClickZoom={interactive}
          zoomControl={interactive}
          eventHandlers={{
            click: handleMapClick
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Route line */}
          {showRoute && routeCoordinates.length > 1 && (
            <Polyline
              positions={routeCoordinates}
              color="#3b82f6"
              weight={3}
              opacity={0.8}
            />
          )}
          
          {/* Location markers */}
          {locations.map((location, index) => (
            <NumberedMarker
              key={location.id}
              location={location}
              index={index}
            />
          ))}
        </MapContainer>

        {/* Location counter */}
        {locations.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-2 text-sm font-medium z-[1000]">
            {locations.length} location{locations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  )
}

// Utility hook for Leaflet-specific operations
export function useLeafletUtils() {
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        const leaflet = await import('leaflet')
        setL(leaflet)
      }
    }
    
    loadLeaflet()
  }, [])

  const calculateBounds = (locations: Location[]) => {
    if (!L || locations.length === 0) return null

    const bounds = L.latLngBounds()
    locations.forEach(location => {
      bounds.extend(location.coordinates)
    })
    
    return bounds
  }

  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    if (!L) return 0
    
    const latlng1 = L.latLng(coord1[0], coord1[1])
    const latlng2 = L.latLng(coord2[0], coord2[1])
    
    return latlng1.distanceTo(latlng2) / 1000 // Convert to km
  }

  return {
    L,
    calculateBounds,
    calculateDistance,
    isLoaded: !!L
  }
}

// Alternative map component that chooses between Mapbox and Leaflet
export function AdaptiveMap(props: LeafletMapProps & { preferMapbox?: boolean }) {
  const { preferMapbox = true, ...mapProps } = props
  const [useMapbox, setUseMapbox] = useState(preferMapbox)

  useEffect(() => {
    // Check if Mapbox token is available
    if (preferMapbox && !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      setUseMapbox(false)
    }
  }, [preferMapbox])

  if (useMapbox && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    // Dynamically import ReactMapGL to avoid bundle size issues
    const ReactMapGL = dynamic(() => import('./ReactMapGL').then(mod => mod.ReactMapGL), {
      ssr: false,
      loading: () => (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height: mapProps.height || '400px' }}>
          <MapPin className="h-12 w-12 text-gray-400" />
        </div>
      )
    })

    // Convert coordinates from [lat, lng] to [lng, lat] for Mapbox
    const mapboxLocations = mapProps.locations.map(loc => ({
      ...loc,
      coordinates: [loc.coordinates[1], loc.coordinates[0]] as [number, number]
    }))

    return <ReactMapGL {...mapProps} locations={mapboxLocations} />
  }

  return <LeafletMap {...mapProps} />
}
