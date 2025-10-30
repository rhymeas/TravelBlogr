'use client'

/**
 * Elevation Profile Component
 *
 * Displays an elevation profile chart for a route
 * Shows ascent, descent, max/min elevation, and distance
 */

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Mountain } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface ElevationProfileProps {
  elevations: number[] // Elevation at each point
  distances: number[] // Cumulative distance (same unit across)
  ascent: number // Total ascent in meters
  descent: number // Total descent in meters
  maxElevation: number
  minElevation: number
  className?: string
  hoverKm?: number | null
  onHoverKm?: (km: number | null) => void
}

export function ElevationProfile({
  elevations,
  distances,
  ascent,
  descent,
  maxElevation,
  minElevation,
  className = '',
  hoverKm = null,
  onHoverKm
}: ElevationProfileProps) {
  // Calculate SVG path for elevation profile
  const { path, viewBox } = useMemo(() => {
    if (elevations.length === 0 || distances.length === 0) {
      return { path: '', viewBox: '0 0 100 100' }
    }

    const width = 600 // Compact width for overlay
    const height = 100 // Compact height for overlay
    const padding = 15

    // Normalize distances to width
    const maxDistance = distances[distances.length - 1]
    const normalizedDistances = distances.map(d =>
      padding + (d / maxDistance) * (width - 2 * padding)
    )

    // Normalize elevations to height (inverted for SVG)
    const elevationRange = maxElevation - minElevation || 1
    const normalizedElevations = elevations.map(e =>
      height - padding - ((e - minElevation) / elevationRange) * (height - 2 * padding)
    )

    // Create SVG path
    const pathData = normalizedDistances.map((x, i) => {
      const y = normalizedElevations[i]
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    }).join(' ')

    // Add area fill
    const areaPath = pathData +
      ` L ${normalizedDistances[normalizedDistances.length - 1]} ${height - padding}` +
      ` L ${normalizedDistances[0]} ${height - padding} Z`

    return {
      path: areaPath,
      viewBox: `0 0 ${width} ${height}`
    }
  }, [elevations, distances, maxElevation, minElevation])

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  // Format elevation
  const formatElevation = (meters: number) => {
    return `${Math.round(meters)} m`
  }

  if (elevations.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <Mountain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No elevation data available</p>
        </div>
      </Card>
    )
  }

  const totalDistance = distances[distances.length - 1]
  const currentElevationVal = useMemo(() => {
    if (typeof hoverKm !== 'number' || distances.length === 0) return null
    const maxDistance = distances[distances.length - 1]
    const target = Math.max(0, Math.min(maxDistance, hoverKm))
    let idx = 0
    let best = Infinity
    for (let i = 0; i < distances.length; i++) {
      const d = Math.abs(distances[i] - target)
      if (d < best) { best = d; idx = i }
    }
    return elevations[idx] ?? null
  }, [hoverKm, distances, elevations])


  return (
    <Card className={`p-3 rounded-2xl shadow-lg bg-white/95 backdrop-blur-sm ${className}`}>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
          <Mountain className="h-3.5 w-3.5 text-gray-900" />
          Elevation
        </h3>
        <span className="text-xs text-gray-900 font-semibold transition-colors">
          {currentElevationVal != null ? formatElevation(currentElevationVal) : formatDistance(totalDistance)}
        </span>
      </div>

      {/* Compact Elevation Chart */}
      <div className="mb-2 bg-white rounded-xl p-1.5 border border-gray-200">
        <svg
          viewBox={viewBox}
          className="w-full h-auto cursor-crosshair"
          style={{ maxHeight: '100px' }}
          onMouseMove={(e) => {
            if (!onHoverKm) return
            const svg = e.currentTarget as SVGSVGElement
            const rect = svg.getBoundingClientRect()
            const x = e.clientX - rect.left
            const vb = svg.viewBox.baseVal
            const svgWidth = rect.width
            const padding = 20
            const maxDistance = distances[distances.length - 1]
            // Direct pixel-to-SVG coordinate mapping (faster than matrix transform)
            const svgX = (x / svgWidth) * vb.width
            const clampedX = Math.max(padding, Math.min(vb.width - padding, svgX))
            const km = ((clampedX - padding) / (vb.width - 2 * padding)) * maxDistance
            onHoverKm(km)
          }}
          onMouseLeave={() => onHoverKm && onHoverKm(null)}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Elevation stroke - matches route line color (#14b8a6) and slightly thicker */}
          <path
            d={path}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Hover marker line */}
          {typeof hoverKm === 'number' && hoverKm >= 0 && (
            (() => {
              const width = 600 // Must match viewBox width used above
              const height = 100 // Compact overlay size
              const padding = 15
              const maxDistance = distances[distances.length - 1]
              const clampedKm = Math.min(Math.max(hoverKm, 0), maxDistance)
              const x = padding + (clampedKm / maxDistance) * (width - 2 * padding)
              return (
                <line x1={x} y1={padding} x2={x} y2={height - padding} stroke="#6b7280" strokeWidth="3" strokeDasharray="2 2" />
              )
            })()
          )}
        </svg>
      </div>

      {/* Compact Statistics - Bubbly pills */}
      <div className="flex flex-wrap gap-1">
        <div className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[10px] text-gray-700">
          ↑ <span className="font-semibold text-gray-900">{formatElevation(maxElevation)}</span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[10px] text-gray-700">
          ↓ <span className="font-semibold text-gray-900">{formatElevation(minElevation)}</span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700">
          ⬆ <span className="font-semibold text-emerald-900">{formatElevation(ascent)}</span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] text-blue-700">
          ⬇ <span className="font-semibold text-blue-900">{formatElevation(descent)}</span>
        </div>
      </div>
    </Card>
  )
}

