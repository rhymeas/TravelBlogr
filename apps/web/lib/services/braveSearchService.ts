/**
 * Brave Search API Service
 * 
 * FREE tier: 2,000 queries/month (66/day)
 * Provides:
 * - Web search results (official pages, booking sites, restaurants)
 * - Image search results (16:9 thumbnails from imgs.search.brave.com)
 * - News results (for trending activities)
 * 
 * Docs: https://brave.com/search/api/
 */

import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/upstash'

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY
const BRAVE_WEB_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search'
const BRAVE_IMAGE_SEARCH_URL = 'https://api.search.brave.com/res/v1/images/search'

export interface BraveWebResult {
  title: string
  url: string
  description: string
  type: 'official' | 'booking' | 'guide' | 'affiliate' | 'restaurant' | 'unknown'
  favicon?: string
  age?: string
}

export interface BraveImageResult {
  title: string
  url: string // Full-size image URL
  thumbnail: string // 16:9 thumbnail from imgs.search.brave.com
  source: string // Source website
  properties: {
    url: string // Source page URL
    width: number
    height: number
  }
}

/**
 * Search for web pages (activities, restaurants, booking sites)
 */
export async function searchWeb(
  query: string,
  limit: number = 10
): Promise<BraveWebResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('⚠️ BRAVE_SEARCH_API_KEY not configured')
    return []
  }

  const cacheKey = CacheKeys.braveWebSearch(query, limit)

  // Check cache first (24 hours)
  const cached = await getCached<BraveWebResult[]>(cacheKey)
  if (cached) {
    console.log(`✅ Brave Web Cache HIT: ${query}`)
    return cached
  }

  try {
    const response = await fetch(
      `${BRAVE_WEB_SEARCH_URL}?q=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    )

    if (!response.ok) {
      console.error(`❌ Brave Web Search: ${response.status} for "${query}"`)
      return []
    }

    const data = await response.json()
    const results: BraveWebResult[] = (data.web?.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description || '',
      type: classifyLinkType(result.url, result.title),
      favicon: result.profile?.img,
      age: result.age,
    }))

    // Cache for 24 hours
    await setCached(cacheKey, results, CacheTTL.LONG)

    console.log(`✅ Brave Web: Found ${results.length} results for "${query}"`)
    return results
  } catch (error) {
    console.error('Brave Web Search error:', error)
    return []
  }
}

/**
 * Search for images (16:9 thumbnails optimized for cards)
 */
export async function searchImages(
  query: string,
  limit: number = 20
): Promise<BraveImageResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('⚠️ BRAVE_SEARCH_API_KEY not configured')
    return []
  }

  const cacheKey = CacheKeys.braveImageSearch(query, limit)

  // Check cache first (24 hours)
  const cached = await getCached<BraveImageResult[]>(cacheKey)
  if (cached) {
    console.log(`✅ Brave Image Cache HIT: ${query}`)
    return cached
  }

  try {
    const response = await fetch(
      `${BRAVE_IMAGE_SEARCH_URL}?q=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    )

    if (!response.ok) {
      console.error(`❌ Brave Image Search: ${response.status} for "${query}"`)
      return []
    }

    const data = await response.json()
    const results: BraveImageResult[] = (data.results || []).map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      thumbnail: result.thumbnail?.src || result.url, // 16:9 thumbnail!
      source: result.source || '',
      properties: {
        url: result.properties?.url || '',
        width: result.properties?.width || 0,
        height: result.properties?.height || 0,
      },
    }))

    // Cache for 24 hours
    await setCached(cacheKey, results, CacheTTL.LONG)

    console.log(`✅ Brave Image: Found ${results.length} images for "${query}"`)
    return results
  } catch (error) {
    console.error('Brave Image Search error:', error)
    return []
  }
}

/**
 * Search for restaurant images and booking links
 */
export async function searchRestaurant(
  restaurantName: string,
  locationName: string,
  options?: { tripType?: string; context?: string }
): Promise<{ images: BraveImageResult[]; bookingLinks: BraveWebResult[] }> {
  const modifiers = buildVisionModifiers(options)
  const query = `${restaurantName} ${locationName} ${modifiers}`.trim()

  // Parallel search for images and booking links
  const [images, webResults] = await Promise.all([
    searchImages(`${query} restaurant food interior`, 10),
    searchWeb(`${query} restaurant booking reservation`, 5),
  ])

  // Filter booking links
  const bookingLinks = webResults.filter(r =>
    r.type === 'booking' || r.type === 'restaurant'
  )

  return { images, bookingLinks }
}

/**
 * Search for activity/POI images and links
 */
export async function searchActivity(
  activityName: string,
  locationName: string,
  options?: { tripType?: string; context?: string }
): Promise<{ images: BraveImageResult[]; links: BraveWebResult[] }> {
  const modifiers = buildVisionModifiers(options)
  const base = `${activityName} ${locationName}`
  const query = `${base} ${modifiers}`.trim()

  // Parallel search
  const [images, links] = await Promise.all([
    searchImages(query, 15),
    searchWeb(`${query} tickets tours booking`, 5),
  ])

  return { images, links }
}

/**
 * Search for location-specific images
 */
export async function searchLocationImages(
  locationName: string,
  specificPlace?: string
): Promise<BraveImageResult[]> {
  const query = specificPlace 
    ? `${specificPlace} ${locationName}` 
    : locationName

  return await searchImages(query, 20)
}

/**
 * Classify link type based on URL and title
 */
function buildVisionModifiers(options?: { tripType?: string; context?: string }): string {
  if (!options) return ''
  const parts: string[] = []
  const t = options.tripType
  if (t === 'family') parts.push('kid-friendly family')
  else if (t === 'luxury') parts.push('fine dining 5-star premium')
  else if (t === 'bike') parts.push('bike-friendly cyclist')
  else if (t === 'wellness') parts.push('spa wellness yoga')
  else if (t === 'solo') parts.push('safe social')
  else if (t === 'city') parts.push('museum gallery cultural neighborhoods')
  else if (t === 'adventure') parts.push('adventure hiking climbing outdoor')
  else if (t === 'road-trip') parts.push('scenic viewpoints parking roadside')
  else if (t === 'specific') parts.push('city resort neighborhood')
  else if (t === 'journey') parts.push('route A to B with stops')
  else if (t === 'multi-destination') parts.push('multi city itinerary')

  if (options.context) parts.push(options.context)
  return parts.join(' ')
}

function classifyLinkType(url: string, title: string): BraveWebResult['type'] {
  const urlLower = url.toLowerCase()
  const titleLower = title.toLowerCase()

  // Booking platforms
  const bookingDomains = [
    'booking.com', 'expedia.com', 'tripadvisor.com', 'viator.com',
    'getyourguide.com', 'klook.com', 'airbnb.com', 'vrbo.com',
    'opentable.com', 'resy.com', 'tock.com'
  ]
  if (bookingDomains.some(domain => urlLower.includes(domain))) {
    return 'booking'
  }

  // Restaurant sites
  const restaurantKeywords = ['restaurant', 'menu', 'dining', 'cafe', 'bistro']
  if (restaurantKeywords.some(kw => titleLower.includes(kw))) {
    return 'restaurant'
  }

  // Affiliate keywords
  const affiliateKeywords = ['book', 'reserve', 'tickets', 'tours', 'deals']
  if (affiliateKeywords.some(kw => titleLower.includes(kw))) {
    return 'affiliate'
  }

  // Travel guides
  const guideDomains = ['lonelyplanet.com', 'timeout.com', 'atlasobscura.com']
  if (guideDomains.some(domain => urlLower.includes(domain))) {
    return 'guide'
  }

  // Official sites
  if (urlLower.includes('.org') || urlLower.includes('.gov') || 
      titleLower.includes('official') || titleLower.includes('museum')) {
    return 'official'
  }

  return 'unknown'
}

