/**
 * Google AdSense Helper Utilities
 * 
 * Provides utilities for managing ad visibility, frequency, and user tier logic.
 * Follows TravelBlogr monetization strategy: Free tier sees ads, Pro tier doesn't.
 */

interface User {
  id: string
  subscription_tier?: 'free' | 'explorer' | 'professional' | null
}

/**
 * Determine if ads should be shown to the current user
 * 
 * Rules:
 * - Guest users (not logged in): Show ads
 * - Free tier users: Show ads
 * - Pro/Explorer/Professional subscribers: NO ads (premium benefit)
 * 
 * @param user - Current user object (null if not authenticated)
 * @returns boolean - true if ads should be displayed
 */
export function shouldShowAds(user: User | null): boolean {
  // Guest users see ads
  if (!user) return true
  
  // Pro subscribers don't see ads (premium benefit)
  if (user.subscription_tier === 'explorer' || 
      user.subscription_tier === 'professional') {
    return false
  }
  
  // Free tier users see ads
  return true
}

/**
 * Check if an ad should be inserted at this index in a list
 * 
 * Used for in-feed ads in location grids, trip lists, etc.
 * Default: Insert ad every 5th item (index 4, 9, 14, etc.)
 * 
 * @param index - Current item index (0-based)
 * @param frequency - How often to show ads (default: 5)
 * @returns boolean - true if ad should be shown at this position
 */
export function shouldShowInFeedAd(index: number, frequency: number = 5): boolean {
  // Show ad after every Nth item
  // Example: frequency=5 means ads at positions 4, 9, 14, 19, etc.
  return (index + 1) % frequency === 0
}

/**
 * Get ad slot ID based on page and position
 * 
 * Helps organize ad units in Google AdSense dashboard
 * 
 * @param page - Page identifier (e.g., 'homepage', 'location-detail')
 * @param position - Position on page (e.g., 'top', 'sidebar', 'mid-content')
 * @returns string - Ad slot identifier
 */
export function getAdSlot(page: string, position: string): string {
  return `${page}_${position}`
}

/**
 * Check if AdSense is properly configured
 * 
 * @returns boolean - true if AdSense client ID is set
 */
export function isAdSenseConfigured(): boolean {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID
  return !!clientId && clientId !== 'ca-pub-your_adsense_client_id_here'
}

/**
 * Get AdSense client ID
 * 
 * @returns string - AdSense client ID or empty string if not configured
 */
export function getAdSenseClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID || ''
}

/**
 * Track ad impression (Google Analytics)
 * 
 * @param adSlot - Ad slot identifier
 * @param page - Page where ad is shown
 */
export function trackAdImpression(adSlot: string, page: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'ad_impression', {
      ad_slot: adSlot,
      page: page,
      timestamp: new Date().toISOString(),
    })
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Ad Impression] ${adSlot} on ${page}`)
  }
}

/**
 * Track ad click (Google Analytics)
 * 
 * @param adSlot - Ad slot identifier
 * @param page - Page where ad was clicked
 */
export function trackAdClick(adSlot: string, page: string): void {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'ad_click', {
      ad_slot: adSlot,
      page: page,
      timestamp: new Date().toISOString(),
    })
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Ad Click] ${adSlot} on ${page}`)
  }
}

