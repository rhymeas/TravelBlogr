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
  elevations: number[] // Elevation in meters at each point
  distances: number[] // Cumulative distance in meters
  ascent: number // Total ascent in meters
  descent: number // Total descent in meters
  maxElevation: number
  minElevation: number
  className?: string
}

export function ElevationProfile({
  elevations,
  distances,
  ascent,
  descent,
  maxElevation,
  minElevation,
  className = ''
}: ElevationProfileProps) {
  // Calculate SVG path for elevation profile
  const { path, viewBox } = useMemo(() => {
    if (elevations.length === 0 || distances.length === 0) {
      return { path: '', viewBox: '0 0 100 100' }
    }

    const width = 800
    const height = 200
    const padding = 20

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

  return (
    <Card className={`p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Mountain className="h-5 w-5 text-blue-600" />
          Elevation Profile
        </h3>
        <span className="text-sm text-gray-600">
          {formatDistance(totalDistance)}
        </span>
      </div>

      {/* Elevation Chart */}
      <div className="mb-4 bg-gradient-to-b from-blue-50 to-white rounded-lg p-4 border border-blue-100">
        <svg
          viewBox={viewBox}
          className="w-full h-auto"
          style={{ maxHeight: '200px' }}
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

          {/* Elevation area */}
          <path
            d={path}
            fill="url(#elevationGradient)"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Ascent */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Ascent</span>
          </div>
          <p className="text-lg font-bold text-green-900">
            {formatElevation(ascent)}
          </p>
        </div>

        {/* Total Descent */}
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">Descent</span>
          </div>
          <p className="text-lg font-bold text-red-900">
            {formatElevation(descent)}
          </p>
        </div>

        {/* Max Elevation */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Mountain className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Highest</span>
          </div>
          <p className="text-lg font-bold text-blue-900">
            {formatElevation(maxElevation)}
          </p>
        </div>

        {/* Min Elevation */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Mountain className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Lowest</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatElevation(minElevation)}
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Elevation gain: <span className="font-semibold text-gray-900">{formatElevation(ascent)}</span>
          {' • '}
          Elevation loss: <span className="font-semibold text-gray-900">{formatElevation(descent)}</span>
          {' • '}
          Range: <span className="font-semibold text-gray-900">{formatElevation(maxElevation - minElevation)}</span>
        </p>
      </div>
    </Card>
  )
}

