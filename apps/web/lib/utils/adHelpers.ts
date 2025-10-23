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
 * Pattern: 5 items - ad - 4 items - ad - 5 items - ad - 4 items - ad (alternating)
 * Positions: After index 4, 8, 13, 17, 22, 26, etc.
 *
 * @param index - Current item index (0-based)
 * @returns boolean - true if ad should be shown at this position
 */
export function shouldShowInFeedAd(index: number): boolean {
  // Alternating pattern: 5-4-5-4-5-4...
  // Ad positions: 4, 8, 13, 17, 22, 26, 31, 35...

  // Calculate which "cycle" we're in (each cycle is 9 items: 5 + ad + 4 + ad)
  const cycleLength = 9 // 5 items + 4 items
  const positionInCycle = (index + 1) % cycleLength

  // Show ad after 5th item (position 5) or after 4th item in second half (position 9/0)
  return positionInCycle === 5 || positionInCycle === 0
}

/**
 * Generate deterministic random positions for in-feed ads.
 * Ensures a varied but stable layout per day and page.
 */
export function generateRandomInFeedPositions(
  total: number,
  seed: string,
  minGap = 4,
  maxGap = 7,
  maxAds?: number
): Set<number> {
  const positions = new Set<number>()
  if (total <= 0) return positions

  // FNV-1a hash -> uint32 (fast, stable)
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }

  // Simple LCG PRNG from hashed seed
  let s = h >>> 0
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }

  const gapRange = Math.max(0, maxGap - minGap)
  // First ad after 4-7 items (index 3-6), but we render ad after card index `index`
  let index = minGap + Math.floor(rand() * (gapRange + 1)) - 1
  const cap = maxAds ?? Math.max(1, Math.floor(total / 6))

  while (index < total && positions.size < cap) {
    positions.add(index)
    const gap = minGap + Math.floor(rand() * (gapRange + 1))
    index += gap
  }

  return positions
}

export function shouldShowInFeedAdRandom(index: number, positions: Set<number>): boolean {
  return positions.has(index)
}

/**
 * Check if an ad should be inserted at this index in trips library
 *
 * Pattern: 5-6-4-6-5-4-3-7-5-4 (custom pattern for trips library)
 * Positions: After index 4, 10, 14, 20, 24, 28, 31, 38, 43, 47, etc.
 *
 * @param index - Current item index (0-based)
 * @returns boolean - true if ad should be shown at this position
 */
export function shouldShowTripsLibraryAd(index: number): boolean {
  // Pattern: 5-6-4-6-5-4-3-7-5-4 (repeating)
  // Ad positions after: 5, 11, 15, 21, 26, 30, 33, 40, 45, 49...
  const pattern = [5, 6, 4, 6, 5, 4, 3, 7, 5, 4]

  let position = 0
  let patternIndex = 0

  while (position <= index) {
    position += pattern[patternIndex % pattern.length]
    if (position === index + 1) {
      return true
    }
    patternIndex++
  }

  return false
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

