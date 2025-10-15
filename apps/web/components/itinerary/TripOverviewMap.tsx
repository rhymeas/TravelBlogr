'use client'

/**
 * Trip Overview Map - Shows the entire trip route with all locations
 * Used in the Review section of the itinerary modal
 */

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface TripOverviewMapProps {
  locations: Array<{
    name: string
    latitude: number
    longitude: number
  }>
  className?: string
}

export function TripOverviewMap({ locations, className = '' }: TripOverviewMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    if (locations.length === 0) return

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
          center: [locations[0].longitude, locations[0].latitude],
          zoom: 5
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

          // Add route line if multiple locations
          if (locations.length > 1) {
            const coordinates = locations.map(loc => [loc.longitude, loc.latitude])

            map.current!.addSource('route', {
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

            map.current!.addLayer({
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

  if (locations.length === 0) {
    return (
      <div className={`rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
        <p className="text-gray-500 text-sm">No location data available</p>
      </div>
    )
  }

  return (
    <div ref={mapContainer} className={`rounded-lg overflow-hidden ${className}`} />
  )
}

