'use client'

import { useEffect, useRef } from 'react'

interface LocationViewTrackerProps {
  locationSlug: string
}

/**
 * Invisible pixel tracker for location page views
 * Automatically tracks views when component mounts
 */
export function LocationViewTracker({ locationSlug }: LocationViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return
    tracked.current = true

    // Track view after a short delay to ensure it's a real view
    const timer = setTimeout(() => {
      trackView()
    }, 2000) // 2 second delay

    return () => clearTimeout(timer)
  }, [locationSlug])

  const trackView = async () => {
    try {
      // Send tracking pixel request
      await fetch(`/api/locations/${locationSlug}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          referrer: document.referrer || null,
          userAgent: navigator.userAgent
        })
      })
    } catch (error) {
      // Silently fail - tracking shouldn't break the page
      console.debug('View tracking failed:', error)
    }
  }

  // Render invisible 1x1 pixel
  return (
    <img
      src={`/api/locations/${locationSlug}/pixel.gif`}
      alt=""
      width="1"
      height="1"
      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}

