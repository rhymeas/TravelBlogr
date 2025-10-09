/**
 * Simple Location Map Component
 * Uses MapLibre GL with free CARTO basemap
 */

'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
// CSS imported globally in globals.css



interface SimpleLocationMapProps {
  latitude: number
  longitude: number
  name: string
  restaurants?: Array<{ name: string; latitude?: number; longitude?: number }>
  activities?: Array<{ name: string; latitude?: number; longitude?: number }>
}

export function SimpleLocationMap({ 
  latitude, 
  longitude, 
  name,
  restaurants = [],
  activities = []
}: SimpleLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

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
        center: [longitude, latitude],
        zoom: 13
      })

      // Wait for map to load before adding markers
      map.current.on('load', () => {
        if (!map.current) return

        // Add main location marker (red pin)
        new maplibregl.Marker({
          color: '#FF385C',
          scale: 1.2
        })
          .setLngLat([longitude, latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`<div class="p-2"><h3 class="font-bold">${name}</h3></div>`)
          )
          .addTo(map.current)

        // Add restaurant markers (orange)
        restaurants.slice(0, 10).forEach(restaurant => {
          if (restaurant.latitude && restaurant.longitude) {
            const el = document.createElement('div')
            el.className = 'marker-restaurant'
            el.innerHTML = '🍽️'
            el.style.fontSize = '20px'
            el.style.cursor = 'pointer'

            new maplibregl.Marker({ element: el })
              .setLngLat([restaurant.longitude, restaurant.latitude])
              .setPopup(
                new maplibregl.Popup({ offset: 25 })
                  .setHTML(`<div class="p-2"><strong>${restaurant.name}</strong><br/><span class="text-sm text-gray-600">Restaurant</span></div>`)
              )
              .addTo(map.current!)
          }
        })

        // Add activity markers (blue)
        activities.slice(0, 10).forEach(activity => {
          if (activity.latitude && activity.longitude) {
            const el = document.createElement('div')
            el.className = 'marker-activity'
            el.innerHTML = '🎯'
            el.style.fontSize = '20px'
            el.style.cursor = 'pointer'

            new maplibregl.Marker({ element: el })
              .setLngLat([activity.longitude, activity.latitude])
              .setPopup(
                new maplibregl.Popup({ offset: 25 })
                  .setHTML(`<div class="p-2"><strong>${activity.name}</strong><br/><span class="text-sm text-gray-600">Activity</span></div>`)
              )
              .addTo(map.current!)
          }
        })

        // Ensure correct sizing after render
        setTimeout(() => {
          try { map.current?.resize() } catch {}
        }, 100)
      })

      // Add navigation controls
      map.current.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true
        }),
        'top-right'
      )

      // Add fullscreen control
      map.current.addControl(
        new maplibregl.FullscreenControl(),
        'top-right'
      )

      // Handle errors
      map.current.on('error', (e) => {
        console.error('MapLibre GL error:', e)
      })

    } catch (error) {
      console.error('Error initializing map:', error)
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [latitude, longitude, name, restaurants, activities])

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="font-semibold mb-2">Map Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Main Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🍽️</span>
            <span>Restaurants</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span>Activities</span>
          </div>
        </div>
      </div>
    </div>
  )
}

