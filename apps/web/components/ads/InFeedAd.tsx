'use client'

import { GoogleAd } from './GoogleAd'
import { useAuth } from '@/hooks/useAuth'
import { shouldShowAds, isAdSenseConfigured } from '@/lib/utils/adHelpers'
import { Card, CardContent } from '@/components/ui/Card'

/**
 * In-Feed Ad Component
 *
 * Native ad format that blends with location cards, trip cards, etc.
 * Matches the styling of content cards for seamless integration.
 *
 * Usage in LocationsGrid:
 * {shouldShowInFeedAd(index) && <InFeedAd slot="1234567890" page="locations" />}
 */

interface InFeedAdProps {
  /**
   * Ad slot ID from Google AdSense
   */
  slot: string

  /**
   * In-feed layout key (from AdSense UI)
   * Example: "-61+cm+4h-16-10"
   */
  layoutKey?: string

  /**
   * Page identifier for analytics
   */
  page?: string

  /**
   * Additional CSS classes
   */
  className?: string
}

export function InFeedAd({
  slot,
  layoutKey,
  page = 'unknown',
  className = '',
}: InFeedAdProps) {
  // Check if AdSense is configured first (can be checked on server)
  if (!isAdSenseConfigured()) {
    return null
  }

  const { user } = useAuth()

  // Don't show ads to Pro subscribers
  if (!shouldShowAds(user)) {
    return null
  }

  return (
    <Card className={`
      card-elevated
      overflow-hidden
      ${className}
    `}>
      <CardContent className="p-0">
        {/* Sponsored Label - Subtle, top-left */}
        <div className="p-4 pb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
                       </span>
        </div>

        {/* Ad Content */}
        <div className="px-4 pb-4">
          <GoogleAd
            slot={slot}
            format="fluid"
            layoutKey={layoutKey}
            width="auto"
            height="auto"
            page={page}
            showLabel={false} // We show our own label above
          />
        </div>
      </CardContent>
    </Card>
  )
}

