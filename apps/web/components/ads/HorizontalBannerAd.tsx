'use client'

import { GoogleAd } from './GoogleAd'
import { useAuth } from '@/hooks/useAuth'
import { shouldShowAds, isAdSenseConfigured } from '@/lib/utils/adHelpers'

/**
 * Horizontal Banner Ad Component
 *
 * Displays a horizontal banner ad (728x90 or 970x90)
 * Responsive: Shows appropriate size based on screen width
 *
 * Usage:
 * <HorizontalBannerAd slot="1234567890" page="homepage" />
 */

interface HorizontalBannerAdProps {
  /**
   * Ad slot ID from Google AdSense
   */
  slot: string

  /**
   * Page identifier for analytics
   */
  page?: string

  /**
   * Size variant
   * - 'standard': 728x90 (desktop), 320x50 (mobile)
   * - 'large': 970x90 (desktop), 728x90 (tablet), 320x50 (mobile)
   */
  size?: 'standard' | 'large'

  /**
   * Additional CSS classes
   */
  className?: string
}

export function HorizontalBannerAd({
  slot,
  page = 'unknown',
  size = 'standard',
  className = '',
}: HorizontalBannerAdProps) {
  const { user } = useAuth()

  // Don't show ads to Pro subscribers OR if AdSense not configured
  if (!shouldShowAds(user) || !isAdSenseConfigured()) {
    return null
  }

  return (
    <div className={`w-full py-6 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Responsive container */}
        <div className="flex items-center justify-center">
          <div className={`
            ${size === 'large' ? 'max-w-[970px]' : 'max-w-[728px]'}
            w-full
          `}>
            <GoogleAd
              slot={slot}
              format="horizontal"
              width="auto"
              height={90}
              page={page}
              showLabel={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

