'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import maplibregl from 'maplibre-gl'
// CSS imported globally in globals.css



interface Location {
  id: string
  name: string
  slug: string
  country: string
  region?: string
  latitude: number
  longitude: number
  description?: string
  image_url?: string
  featured_image?: string
  trip_count?: number
  post_count?: number
  visit_count?: number
  rating?: number
}

interface LocationsMapProps {
  locations: Location[]
  selectedLocation?: string
  onLocationSelect?: (locationId: string) => void
}

export function LocationsMap({
  locations,
  selectedLocation,
  onLocationSelect
}: LocationsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const [currentZoom, setCurrentZoom] = useState(2)
  const router = useRouter()

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      // Initialize map with OpenStreetMap tiles via CARTO
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
        center: [0, 20],
        zoom: 2
      })

      // Track zoom level for clustering
      map.current.on('zoom', () => {
        if (map.current) {
          setCurrentZoom(map.current.getZoom())
        }
      })

      // Wait for map to load
      map.current.on('load', () => {
        // Ensure proper sizing after load
        setTimeout(() => {
          try {
            map.current?.resize()
          } catch (e) {
            console.error('Error resizing map:', e)
          }
        }, 100)
      })

      // Handle errors
      map.current.on('error', (e) => {
        console.error('MapLibre GL error:', e)
      })

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right')
    } catch (error) {
      console.error('Error initializing map:', error)
    }

    return () => {
      markers.current.forEach(marker => marker.remove())
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Helper function to cluster nearby locations
  const clusterLocations = (locations: Location[], zoom: number) => {
    // At high zoom levels (>8), show individual markers
    if (zoom > 8) {
      return locations.map(loc => ({
        type: 'single' as const,
        location: loc,
        count: 1
      }))
    }

    // At medium zoom (5-8), cluster by country
    if (zoom > 5) {
      const countryGroups = new Map<string, Location[]>()
      locations.forEach(loc => {
        const key = loc.country
        if (!countryGroups.has(key)) {
          countryGroups.set(key, [])
        }
        countryGroups.get(key)!.push(loc)
      })

      return Array.from(countryGroups.entries()).map(([country, locs]) => {
        if (locs.length === 1) {
          return { type: 'single' as const, location: locs[0], count: 1 }
        }
        // Calculate center point
        const avgLat = locs.reduce((sum, l) => sum + l.latitude, 0) / locs.length
        const avgLng = locs.reduce((sum, l) => sum + l.longitude, 0) / locs.length
        return {
          type: 'cluster' as const,
          locations: locs,
          count: locs.length,
          center: [avgLng, avgLat] as [number, number],
          label: country
        }
      })
    }

    // At low zoom (<5), cluster by region/continent
    const regionGroups = new Map<string, Location[]>()
    locations.forEach(loc => {
      const key = loc.region || loc.country
      if (!regionGroups.has(key)) {
        regionGroups.set(key, [])
      }
      regionGroups.get(key)!.push(loc)
    })

    return Array.from(regionGroups.entries()).map(([region, locs]) => {
      if (locs.length === 1) {
        return { type: 'single' as const, location: locs[0], count: 1 }
      }
      const avgLat = locs.reduce((sum, l) => sum + l.latitude, 0) / locs.length
      const avgLng = locs.reduce((sum, l) => sum + l.longitude, 0) / locs.length
      return {
        type: 'cluster' as const,
        locations: locs,
        count: locs.length,
        center: [avgLng, avgLat] as [number, number],
        label: region
      }
    })
  }

  useEffect(() => {
    if (!map.current || locations.length === 0) return

    // Wait for map to be loaded before adding markers
    const addMarkers = () => {
      markers.current.forEach(marker => marker.remove())
      markers.current = []

      const clusters = clusterLocations(locations, currentZoom)

      console.log(`Zoom: ${currentZoom.toFixed(1)}, Clusters: ${clusters.length}, Singles: ${clusters.filter(c => c.type === 'single').length}`)

      clusters.forEach(cluster => {
        if (cluster.type === 'single') {
          const location = cluster.location
          if (!location.latitude || !location.longitude) return

          // Create modern custom marker element
          const el = document.createElement('div')
          el.className = 'location-marker-modern'

          // Create pin structure
          const pinContainer = document.createElement('div')
          pinContainer.style.cssText = `
            position: relative;
            width: 40px;
            height: 50px;
            cursor: pointer;
            user-select: none;
            transition: transform 0.2s ease;
          `

          // Pin head (circle with image)
          const pinHead = document.createElement('div')
          pinHead.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #FF385C 0%, #E31C5F 100%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(255, 56, 92, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          `

          // Location icon or image
          if (location.featured_image || location.image_url) {
            const img = document.createElement('img')
            img.src = location.featured_image || location.image_url || ''
            img.style.cssText = `
              width: 100%;
              height: 100%;
              object-fit: cover;
            `
            pinHead.appendChild(img)
          } else {
            pinHead.innerHTML = `
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `
          }

          // Pin tail (teardrop bottom)
          const pinTail = document.createElement('div')
          pinTail.style.cssText = `
            position: absolute;
            top: 32px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 12px solid #E31C5F;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          `

          pinContainer.appendChild(pinHead)
          pinContainer.appendChild(pinTail)
          el.appendChild(pinContainer)

          // Hover effect
          el.addEventListener('mouseenter', () => {
            pinContainer.style.transform = 'scale(1.15)'
            pinHead.style.boxShadow = '0 6px 16px rgba(255, 56, 92, 0.5), 0 3px 6px rgba(0, 0, 0, 0.15)'
          })

          el.addEventListener('mouseleave', () => {
            pinContainer.style.transform = 'scale(1)'
            pinHead.style.boxShadow = '0 4px 12px rgba(255, 56, 92, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)'
          })

          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'bottom'
          })
            .setLngLat([location.longitude, location.latitude])
            .addTo(map.current!)

          // Click pin to navigate to detail page
          el.addEventListener('click', () => {
            router.push(`/locations/${location.slug}`)
          })

          markers.current.push(marker)
        } else {
          // Modern cluster marker
          const size = Math.min(70, 45 + cluster.count * 2)
          const el = document.createElement('div')
          el.className = 'cluster-marker-modern'

          // Outer pulse ring
          const pulseRing = document.createElement('div')
          pulseRing.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size + 20}px;
            height: ${size + 20}px;
            border-radius: 50%;
            background: rgba(255, 56, 92, 0.2);
            animation: pulse 2s ease-in-out infinite;
          `

          // Main cluster circle
          const clusterCircle = document.createElement('div')
          clusterCircle.style.cssText = `
            position: relative;
            background: linear-gradient(135deg, #FF385C 0%, #E31C5F 100%);
            color: white;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            cursor: pointer;
            border: 4px solid white;
            box-shadow: 0 6px 20px rgba(255, 56, 92, 0.4), 0 3px 8px rgba(0, 0, 0, 0.15);
            user-select: none;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          `

          // Count number
          const countText = document.createElement('div')
          countText.style.cssText = `
            font-size: ${Math.min(24, 16 + Math.floor(cluster.count / 2))}px;
            line-height: 1;
          `
          countText.textContent = cluster.count.toString()

          // Label
          const labelText = document.createElement('div')
          labelText.style.cssText = `
            font-size: 10px;
            font-weight: 500;
            opacity: 0.9;
            margin-top: 2px;
          `
          labelText.textContent = 'locations'

          clusterCircle.appendChild(countText)
          clusterCircle.appendChild(labelText)

          el.appendChild(pulseRing)
          el.appendChild(clusterCircle)

          el.style.cssText = `
            position: relative;
            width: ${size + 20}px;
            height: ${size + 20}px;
          `

          // Hover effect
          el.addEventListener('mouseenter', () => {
            clusterCircle.style.transform = 'scale(1.1)'
            clusterCircle.style.boxShadow = '0 8px 24px rgba(255, 56, 92, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2)'
          })

          el.addEventListener('mouseleave', () => {
            clusterCircle.style.transform = 'scale(1)'
            clusterCircle.style.boxShadow = '0 6px 20px rgba(255, 56, 92, 0.4), 0 3px 8px rgba(0, 0, 0, 0.15)'
          })

          const popupContent = `
            <div class="p-3">
              <h3 class="font-bold text-base mb-2">${cluster.label}</h3>
              <p class="text-sm text-gray-600 mb-2">${cluster.count} location${cluster.count > 1 ? 's' : ''}</p>
              <div class="space-y-1 max-h-40 overflow-y-auto">
                ${cluster.locations.slice(0, 8).map(loc => `
                  <a
                    href="/locations/${loc.slug}"
                    class="block text-sm hover:bg-gray-100 p-2 rounded no-underline text-gray-700"
                  >
                    📍 ${loc.name}
                  </a>
                `).join('')}
                ${cluster.count > 8 ? `
                  <p class="text-xs text-gray-500 italic pt-1">
                    +${cluster.count - 8} more
                  </p>
                ` : ''}
              </div>
            </div>
          `

          const popup = new maplibregl.Popup({
            offset: 25,
            maxWidth: '280px',
            closeButton: true,
            closeOnClick: true
          }).setHTML(popupContent)

          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'center'
          })
            .setLngLat(cluster.center)
            .setPopup(popup)
            .addTo(map.current!)

          // Click to toggle popup
          el.addEventListener('click', () => {
            marker.togglePopup()
          })

          markers.current.push(marker)
        }
      })

      // Fit bounds on initial load
      if (locations.length > 0 && currentZoom === 2) {
        const bounds = new maplibregl.LngLatBounds()
        locations.forEach(loc => {
          if (loc.latitude && loc.longitude) bounds.extend([loc.longitude, loc.latitude])
        })
        try {
          map.current?.fitBounds(bounds, { padding: 50, maxZoom: 10 })
        } catch (e) {
          console.error('Error fitting bounds:', e)
        }
      }
    }

    // Check if map is already loaded
    if (map.current.loaded()) {
      addMarkers()
    } else {
      map.current.once('load', addMarkers)
    }
  }, [locations, onLocationSelect, currentZoom, router])

  return (
    <div className="relative rounded-airbnb-medium overflow-hidden" style={{ height: '600px', width: '100%' }}>
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 text-sm z-10 max-w-xs">
        <div className="font-semibold mb-3 text-base">Map Guide</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <span>Individual Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rausch-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              5
            </div>
            <span>Clustered Locations</span>
          </div>
          <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
            <p className="mb-1">
              <strong>Zoom Level:</strong> {currentZoom.toFixed(1)}
            </p>
            <p>
              <strong>Total:</strong> {locations.length} destinations
            </p>
            <p className="mt-2 text-gray-500">
              💡 Click markers to view details or zoom in to see more
            </p>
          </div>
        </div>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-xs z-10">
        {currentZoom <= 5 && (
          <span className="text-gray-700">🌍 World View - Showing regions</span>
        )}
        {currentZoom > 5 && currentZoom <= 8 && (
          <span className="text-gray-700">🗺️ Country View - Showing countries</span>
        )}
        {currentZoom > 8 && (
          <span className="text-gray-700">📍 Detail View - Showing all locations</span>
        )}
      </div>
    </div>
  )
}
