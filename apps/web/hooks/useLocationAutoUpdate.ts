/**
 * Auto-update hook for location pages
 * Checks if location needs update and triggers background refresh
 */

'use client'

import { useEffect, useState } from 'react'

interface UpdateStatus {
  needsUpdate: boolean
  lastUpdate: Date | null
  daysOld: number
  missingData: string[]
}

interface UseLocationAutoUpdateOptions {
  locationId: string
  locationName: string
  enabled?: boolean
  onUpdateStart?: () => void
  onUpdateComplete?: () => void
}

export function useLocationAutoUpdate({
  locationId,
  locationName,
  enabled = true,
  onUpdateStart,
  onUpdateComplete
}: UseLocationAutoUpdateOptions) {
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !locationId) return

    let cancelled = false

    async function checkAndUpdate() {
      try {
        // Check if update is needed
        const checkResponse = await fetch(
          `/api/admin/update-location?locationId=${locationId}`
        )

        if (!checkResponse.ok) {
          throw new Error('Failed to check update status')
        }

        const checkData = await checkResponse.json()
        
        if (cancelled) return

        setStatus(checkData.status)

        // If update is needed, trigger background update
        if (checkData.status.needsUpdate) {
          console.log(`🔄 Auto-update triggered for ${locationName}`)
          
          setIsUpdating(true)
          onUpdateStart?.()

          // Trigger update in background (don't wait for it)
          fetch('/api/admin/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locationId, locationName })
          })
            .then(response => response.json())
            .then(data => {
              if (!cancelled) {
                console.log(`✅ Auto-update completed for ${locationName}`, data)
                setIsUpdating(false)
                onUpdateComplete?.()
                
                // Reload page after 2 seconds to show new data
                setTimeout(() => {
                  if (!cancelled) {
                    window.location.reload()
                  }
                }, 2000)
              }
            })
            .catch(err => {
              if (!cancelled) {
                console.error('Auto-update error:', err)
                setError(err.message)
                setIsUpdating(false)
              }
            })
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Check update error:', err)
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }

    // Check on mount (with small delay to not block initial render)
    const timer = setTimeout(checkAndUpdate, 1000)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [locationId, locationName, enabled, onUpdateStart, onUpdateComplete])

  return {
    status,
    isUpdating,
    error
  }
}

/**
 * Simple client-side check for missing data
 */
export function checkLocationDataQuality(location: any): {
  score: number
  issues: string[]
} {
  const issues: string[] = []
  let score = 100

  // Check images
  if (!location.gallery_images || location.gallery_images.length < 4) {
    issues.push('Missing gallery images')
    score -= 20
  }

  // Check description
  if (!location.description || location.description.length < 50) {
    issues.push('Missing or short description')
    score -= 20
  }

  // Check travel guide
  if (!location.travel_guide_url) {
    issues.push('Missing travel guide')
    score -= 15
  }

  // Check metadata
  if (!location.population || !location.timezone) {
    issues.push('Missing metadata')
    score -= 15
  }

  // Check restaurants
  if (!location.restaurants || location.restaurants.length < 10) {
    issues.push('Few restaurants')
    score -= 10
  }

  // Check activities
  if (!location.activities || location.activities.length < 5) {
    issues.push('Few activities')
    score -= 10
  }

  // Check activity descriptions
  if (location.activities) {
    const withoutDesc = location.activities.filter(
      (a: any) => !a.description || a.description.length < 20
    )
    if (withoutDesc.length > 0) {
      issues.push(`${withoutDesc.length} activities missing descriptions`)
      score -= 10
    }
  }

  return { score: Math.max(0, score), issues }
}

