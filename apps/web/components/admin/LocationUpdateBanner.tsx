/**
 * Location Update Banner
 * Shows when location is being updated in background
 */

'use client'

import { useLocationAutoUpdate, checkLocationDataQuality } from '@/hooks/useLocationAutoUpdate'
import { useState } from 'react'

interface LocationUpdateBannerProps {
  location: any
  enabled?: boolean
}

export function LocationUpdateBanner({ location, enabled = true }: LocationUpdateBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  
  const { status, isUpdating, error } = useLocationAutoUpdate({
    locationId: location.id,
    locationName: location.name,
    enabled: enabled && !dismissed
  })

  const quality = checkLocationDataQuality(location)

  // Don't show if dismissed or no issues
  if (dismissed || !status?.needsUpdate) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {isUpdating ? (
        // Updating banner
        <div className="bg-blue-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          <div className="flex-1">
            <p className="font-semibold">Updating location data...</p>
            <p className="text-sm text-blue-100">
              Fetching latest information for {location.name}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white hover:text-blue-100"
          >
            ✕
          </button>
        </div>
      ) : error ? (
        // Error banner
        <div className="bg-red-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold">Update failed</p>
            <p className="text-sm text-red-100">{error}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white hover:text-red-100"
          >
            ✕
          </button>
        </div>
      ) : status?.needsUpdate ? (
        // Needs update banner
        <div className="bg-yellow-500 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <p className="font-semibold">Location data is being updated</p>
              <p className="text-sm text-yellow-100 mt-1">
                {status.daysOld > 0 
                  ? `Last updated ${status.daysOld} days ago`
                  : 'Never updated'}
              </p>
              {status.missingData.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="text-yellow-100">Updating:</p>
                  <ul className="list-disc list-inside text-yellow-50">
                    {status.missingData.map(item => (
                      <li key={item}>{formatMissingData(item)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-yellow-100 mt-2">
                Page will refresh automatically when complete
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-white hover:text-yellow-100"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Data Quality Badge
 * Shows quality score for location data
 */
export function DataQualityBadge({ location }: { location: any }) {
  const quality = checkLocationDataQuality(location)
  
  const getColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 70) return 'bg-yellow-500'
    if (score >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Needs Update'
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
      <div className={`w-2 h-2 rounded-full ${getColor(quality.score)}`}></div>
      <span className="text-sm font-medium text-gray-700">
        {getLabel(quality.score)} ({quality.score}%)
      </span>
      {quality.issues.length > 0 && (
        <div className="group relative">
          <span className="text-gray-500 cursor-help">ℹ️</span>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
            <p className="font-semibold mb-1">Issues:</p>
            <ul className="list-disc list-inside space-y-1">
              {quality.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Manual Update Button (for admin)
 */
export function ManualUpdateButton({ location }: { location: any }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleUpdate = async () => {
    setIsUpdating(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: location.id,
          locationName: location.name,
          force: true
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult('✅ Update completed! Refreshing page...')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setResult(`❌ Update failed: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Update failed: ${error}`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleUpdate}
        disabled={isUpdating}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isUpdating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Updating...
          </>
        ) : (
          <>
            🔄 Update Location Data
          </>
        )}
      </button>
      {result && (
        <p className="text-sm text-gray-600">{result}</p>
      )}
    </div>
  )
}

// Helper function
function formatMissingData(item: string): string {
  const labels: Record<string, string> = {
    'description': 'Description',
    'images': 'Gallery images (4-6)',
    'travel_guide': 'Travel guide',
    'metadata': 'Population & timezone',
    'activity_descriptions': 'Activity descriptions'
  }
  return labels[item] || item
}

