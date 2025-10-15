'use client'

/**
 * Mini Map for Location Steps in Itinerary Modal
 * Shows a small interactive map for each location
 */

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface LocationMiniMapProps {
  locationName: string
  latitude?: number
  longitude?: number
  className?: string
}

export function LocationMiniMap({ locationName, latitude, longitude, className = '' }: LocationMiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    if (!latitude || !longitude) return

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
                attribution: '&copy; OpenStreetMap &copy; CARTO'
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
          center: [longitude, latitude],
          zoom: 12,
          interactive: true,
          attributionControl: false
        })

        // Add marker
        const el = document.createElement('div')
        el.className = 'w-8 h-8 bg-rausch-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer'
        el.innerHTML = '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>'

        marker.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`<div class="font-semibold text-sm">${locationName}</div>`)
          )
          .addTo(map.current)

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

      } catch (error) {
        console.error('Error initializing mini map:', error)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      marker.current?.remove()
      map.current?.remove()
      map.current = null
    }
  }, [latitude, longitude, locationName])

  // If no coordinates, show placeholder
  if (!latitude || !longitude) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 text-sm p-4">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <div>Map unavailable</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={mapContainer} className={`rounded-lg overflow-hidden ${className}`} />
  )
}

