'use client'

import { useEffect, useRef } from 'react'
import { getAdSenseClientId, isAdSenseConfigured, trackAdImpression } from '@/lib/utils/adHelpers'

/**
 * Base Google AdSense Component
 * 
 * Handles AdSense script loading and ad rendering.
 * Uses existing design system - no custom CSS.
 * 
 * Ad Sizes:
 * - Horizontal Banner: 728x90 (desktop), 320x50 (mobile)
 * - Large Leaderboard: 970x90 (desktop), 728x90 (tablet), 320x50 (mobile)
 * - Medium Rectangle: 300x250
 * - Large Rectangle: 336x280
 * - Responsive: Auto-adjusts to container
 */

interface GoogleAdProps {
  /**
   * Ad slot ID from Google AdSense
   * Format: 'XXXXXXXXXX' (10 digits)
   */
  slot: string
  
  /**
   * Ad format type
   */
  format?: 'horizontal' | 'rectangle' | 'auto'
  
  /**
   * Ad size (width x height)
   * Use 'auto' for responsive ads
   */
  width?: number | 'auto'
  height?: number | 'auto'
  
  /**
   * Page identifier for analytics
   */
  page?: string
  
  /**
   * Additional CSS classes
   */
  className?: string
  
  /**
   * Whether to show "ADVERTISEMENT" label
   */
  showLabel?: boolean
}

export function GoogleAd({
  slot,
  format = 'auto',
  width = 'auto',
  height = 'auto',
  page = 'unknown',
  className = '',
  showLabel = true,
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null)
  const clientId = getAdSenseClientId()

  useEffect(() => {
    // Only load ads if AdSense is configured
    if (!isAdSenseConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Google AdSense not configured. Set NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID in .env.local')
      }
      return
    }

    // Load AdSense script if not already loaded
    if (typeof window !== 'undefined') {
      const script = document.querySelector('script[src*="adsbygoogle.js"]')
      
      if (!script) {
        const newScript = document.createElement('script')
        newScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
        newScript.async = true
        newScript.crossOrigin = 'anonymous'
        document.head.appendChild(newScript)
      }

      // Push ad to AdSense queue
      try {
        if (adRef.current) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
          
          // Track impression
          trackAdImpression(slot, page)
        }
      } catch (error) {
        console.error('AdSense error:', error)
      }
    }
  }, [slot, clientId, page])

  // Don't render if AdSense not configured
  if (!isAdSenseConfigured()) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Advertisement Label - Subtle, Vogue-style */}
      {showLabel && (
        <div className="text-center mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Advertisement
          </span>
        </div>
      )}
      
      {/* Ad Container */}
      <div className="flex items-center justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: 'block',
            width: width === 'auto' ? '100%' : `${width}px`,
            height: height === 'auto' ? 'auto' : `${height}px`,
          }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={format === 'auto' ? 'true' : 'false'}
        />
      </div>
    </div>
  )
}

