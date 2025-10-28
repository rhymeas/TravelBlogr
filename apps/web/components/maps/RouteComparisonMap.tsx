'use client'

/**
 * Route Comparison Map - Small map for visualizing route geometry
 * Uses MapLibre GL with CARTO basemap
 */

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface RouteComparisonMapProps {
  geometry: {
    type: 'LineString'
    coordinates: number[][] // [lng, lat][]
  }
  color?: string
  height?: string
}

export function RouteComparisonMap({ 
  geometry, 
  color = '#3b82f6',
  height = '200px'
}: RouteComparisonMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
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
        center: [0, 0],
        zoom: 5,
        interactive: false,
        attributionControl: false
      })

      // Wait for map to load
      map.current.on('load', () => {
        if (!map.current) return

        // Add route source
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: geometry
          }
        })

        // Add route layer
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': 3,
            'line-opacity': 0.8
          }
        })

        // Fit bounds to route
        const bounds = new maplibregl.LngLatBounds()
        geometry.coordinates.forEach(coord => {
          bounds.extend(coord as [number, number])
        })
        map.current.fitBounds(bounds, { padding: 20, duration: 0 })
      })
    } catch (error) {
      console.error('Map initialization error:', error)
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update route when geometry or color changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    try {
      const source = map.current.getSource('route') as maplibregl.GeoJSONSource
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: geometry
        })

        // Update color
        if (map.current.getLayer('route')) {
          map.current.setPaintProperty('route', 'line-color', color)
        }

        // Fit bounds to new route
        const bounds = new maplibregl.LngLatBounds()
        geometry.coordinates.forEach(coord => {
          bounds.extend(coord as [number, number])
        })
        map.current.fitBounds(bounds, { padding: 20, duration: 0 })
      }
    } catch (error) {
      console.error('Route update error:', error)
    }
  }, [geometry, color])

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height }}
      className="rounded-t-lg"
    />
  )
}

