'use client'

/**
 * Interactive Scenic Route Selector Map
 * 
 * Shows multiple scenic route options on a single map with:
 * - Different colored route overlays
 * - Hover to highlight route
 * - Click to select route
 * - POI markers along routes
 * - Distance/duration tooltips
 */

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface RouteOption {
  id: string
  name: string
  description: string
  tags: string[]
  route: {
    distance: number
    duration: number
    geometry: any
  }
  color: string
}

interface ScenicRouteSelectorProps {
  options: RouteOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  onHover?: (id: string | null) => void
  height?: string
}

export function ScenicRouteSelector({
  options,
  selectedId,
  onSelect,
  onHover,
  height = '600px'
}: ScenicRouteSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const boundsSetRef = useRef(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Prevent hover flickering
  const eventListenersRef = useRef<Map<string, any>>(new Map()) // Track event listeners

  useEffect(() => {
    if (!mapContainer.current || options.length === 0) return

    // Use same map style as /plan (CARTO Voyager)
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
      center: [-120, 50],
      zoom: 5,
      renderWorldCopies: false
    })

    // Add navigation controls (same as /plan)
    map.current.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true
      }),
      'top-right'
    )

    // Add fullscreen control (same as /plan)
    map.current.addControl(
      new maplibregl.FullscreenControl(),
      'top-right'
    )

    map.current.on('load', () => {
      if (!map.current) return
      setMapLoaded(true)
    })

    return () => {
      // Cleanup event listeners
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      eventListenersRef.current.clear()
      map.current?.remove()
      map.current = null
    }
  }, []) // Only initialize once

  // Add/update routes when options change or map loads
  useEffect(() => {
    if (!map.current || !mapLoaded || options.length === 0) return

    console.log('🗺️ Adding/updating routes on map...', options.length)

    // Remove existing route layers and sources
    options.forEach(option => {
      const sourceId = `route-${option.id}`
      const layerId = `route-layer-${option.id}`

      try {
        if (map.current!.getLayer(layerId)) map.current!.removeLayer(layerId)
        if (map.current!.getSource(sourceId)) map.current!.removeSource(sourceId)
      } catch (e) {
        // Ignore errors if layers/sources don't exist
      }
    })

    // Add route sources and layers for each option
    options.forEach((option, index) => {
      const sourceId = `route-${option.id}`
      const layerId = `route-layer-${option.id}`

      // Add source
      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: option.route.geometry
      })

      // Add main route layer (solid, no outline)
      map.current!.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#9ca3af',
          'line-width': 5,
          'line-opacity': 0.7
        }
      })

      // Add hover effect with debouncing to prevent flickering
      const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer'
          setHoveredId(option.id)
          onHover?.(option.id)
        }
      }

      const handleMouseLeave = () => {
        // Debounce mouseleave to prevent flickering when moving between layers
        hoverTimeoutRef.current = setTimeout(() => {
          if (map.current) {
            map.current.getCanvas().style.cursor = ''
            setHoveredId(null)
            onHover?.(null)
          }
        }, 50) // 50ms debounce
      }

      const handleClick = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
        onSelect(option.id)
      }

      // Store listeners for cleanup
      eventListenersRef.current.set(`${layerId}-enter`, handleMouseEnter)
      eventListenersRef.current.set(`${layerId}-leave`, handleMouseLeave)
      eventListenersRef.current.set(`${layerId}-click`, handleClick)

      map.current!.on('mouseenter', layerId, handleMouseEnter)
      map.current!.on('mouseleave', layerId, handleMouseLeave)
      map.current!.on('click', layerId, handleClick)
    })

    // Fit map to show all routes ONCE
    if (!boundsSetRef.current && options.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      options.forEach(option => {
        option.route.geometry.coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord as [number, number])
        })
      })
      map.current!.fitBounds(bounds, {
        padding: 80,
        duration: 1000
      })
      boundsSetRef.current = true
    }

    // Add start/end markers
    if (options[0]?.route.geometry.coordinates) {
      const coords = options[0].route.geometry.coordinates
      const start = coords[0]
      const end = coords[coords.length - 1]

      // Start marker (green)
      new maplibregl.Marker({ color: '#10b981' })
        .setLngLat(start as [number, number])
        .addTo(map.current!)

      // End marker (red)
      new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat(end as [number, number])
        .addTo(map.current!)
    }

    console.log('✅ Routes added to map')
  }, [options.length, mapLoaded, options.map(o => o.id).join(',')])

  // Update route styles based on hover/selection with smooth transitions
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    options.forEach(option => {
      const layerId = `route-layer-${option.id}`

      const isSelected = selectedId === option.id
      const isHovered = hoveredId === option.id

      try {
        if (map.current!.getLayer(layerId)) {
          // Direct paint property updates for smooth transitions
          if (isSelected) {
            map.current!.setPaintProperty(layerId, 'line-width', 6)
            map.current!.setPaintProperty(layerId, 'line-color', '#3b82f6')
            map.current!.setPaintProperty(layerId, 'line-opacity', 1)
          } else if (isHovered) {
            map.current!.setPaintProperty(layerId, 'line-width', 5.5)
            map.current!.setPaintProperty(layerId, 'line-color', '#60a5fa')
            map.current!.setPaintProperty(layerId, 'line-opacity', 0.9)
          } else {
            map.current!.setPaintProperty(layerId, 'line-width', 5)
            map.current!.setPaintProperty(layerId, 'line-color', '#9ca3af')
            map.current!.setPaintProperty(layerId, 'line-opacity', 0.7)
          }
        }
      } catch (error) {
        // Layer not ready yet, ignore
      }
    })
  }, [selectedId, hoveredId, mapLoaded])

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(0)} km`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Route Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-bold text-gray-900 mb-3">Scenic Route Options</h3>
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selectedId === option.id
            const isHovered = hoveredId === option.id

            return (
              <div
                key={option.id}
                onClick={() => onSelect(option.id)}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                  setHoveredId(option.id)
                }}
                onMouseLeave={() => {
                  hoverTimeoutRef.current = setTimeout(() => {
                    setHoveredId(null)
                  }, 50)
                }}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all duration-200
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  ${isHovered ? 'bg-blue-50' : 'bg-white'}
                  border-2
                `}
                style={{
                  borderColor: isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#e5e7eb'
                }}
              >
                {/* Route Color Indicator */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                    style={{
                      backgroundColor: isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#9ca3af'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.name}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {option.description}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>📏 {formatDistance(option.route.distance)}</span>
                      <span>⏱️ {formatDuration(option.route.duration)}</span>
                    </div>
                    {isSelected && (
                      <div className="mt-2 text-xs font-semibold text-blue-800">
                        ✓ Selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Instructions */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          💡 Hover over routes on the map or click a route to select it
        </div>
      </div>

      {/* Selected Route Info Tooltip */}
      {selectedId && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          {(() => {
            const selected = options.find(o => o.id === selectedId)
            if (!selected) return null

            return (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selected.color }}
                  />
                  <h4 className="font-bold text-gray-900">{selected.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{selected.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selected.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">Distance</div>
                    <div className="font-semibold text-gray-900">
                      {formatDistance(selected.route.distance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Duration</div>
                    <div className="font-semibold text-gray-900">
                      {formatDuration(selected.route.duration)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

