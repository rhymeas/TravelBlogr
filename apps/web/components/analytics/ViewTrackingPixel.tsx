'use client'

import { useEffect, useRef } from 'react'
import { getBrowserSupabase } from '@/lib/supabase'

interface ViewTrackingPixelProps {
  tripId: string
  type?: 'trip' | 'location' | 'post'
  entityId?: string
}

/**
 * Invisible 1x1 pixel component that tracks views when loaded
 * Similar to marketing pixels (Facebook Pixel, Google Analytics)
 * 
 * Usage:
 * <ViewTrackingPixel tripId="123" />
 * <ViewTrackingPixel tripId="123" type="location" entityId="456" />
 */
export function ViewTrackingPixel({ tripId, type = 'trip', entityId }: ViewTrackingPixelProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return
    hasTracked.current = true

    async function trackView() {
      try {
        const supabase = getBrowserSupabase()
        
        // Get or create session ID (persists across page loads)
        let sessionId = localStorage.getItem('visitor_session_id')
        if (!sessionId) {
          sessionId = crypto.randomUUID()
          localStorage.setItem('visitor_session_id', sessionId)
        }

        // Track the view
        const { error } = await supabase.rpc('increment_trip_views', {
          p_trip_id: tripId,
          p_user_agent: navigator.userAgent,
          p_referrer: document.referrer || null,
          p_session_id: sessionId
        })

        if (error) {
          console.error('View tracking error:', error)
        } else {
          console.log('✅ View tracked:', { tripId, type, entityId })
        }
      } catch (error) {
        console.error('View tracking failed:', error)
      }
    }

    // Track after a small delay to ensure page is loaded
    const timer = setTimeout(trackView, 500)
    return () => clearTimeout(timer)
  }, [tripId, type, entityId])

  // Return invisible 1x1 pixel
  return (
    <img
      src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      alt=""
      width="1"
      height="1"
      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}

