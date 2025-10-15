'use client'

import { GoogleAd } from './GoogleAd'
import { useAuth } from '@/hooks/useAuth'
import { shouldShowAds } from '@/lib/utils/adHelpers'
import { Card, CardContent } from '@/components/ui/Card'

/**
 * Sidebar Ad Component
 * 
 * Displays a sidebar ad (300x250 or 336x280)
 * Styled to blend with sidebar widgets using existing Card component
 * 
 * Usage:
 * <SidebarAd slot="1234567890" page="location-detail" />
 */

interface SidebarAdProps {
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
   * - 'medium': 300x250
   * - 'large': 336x280
   */
  size?: 'medium' | 'large'
  
  /**
   * Whether to make the ad sticky on scroll
   */
  sticky?: boolean
  
  /**
   * Additional CSS classes
   */
  className?: string
}

export function SidebarAd({
  slot,
  page = 'unknown',
  size = 'medium',
  sticky = false,
  className = '',
}: SidebarAdProps) {
  const { user } = useAuth()

  // Don't show ads to Pro subscribers
  if (!shouldShowAds(user)) {
    return null
  }

  const width = size === 'medium' ? 300 : 336
  const height = size === 'medium' ? 250 : 280

  return (
    <Card className={`
      ${sticky ? 'sticky top-20' : ''}
      ${className}
    `}>
      <CardContent className="p-4">
        <GoogleAd
          slot={slot}
          format="rectangle"
          width={width}
          height={height}
          page={page}
          showLabel={true}
        />
      </CardContent>
    </Card>
  )
}

