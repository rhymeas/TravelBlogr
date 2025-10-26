/**
 * Brave Activity/POI/Restaurant Service
 *
 * Fetches high-quality 16:9 images and booking links for:
 * - Activities & POIs
 * - Restaurants
 * - Experiences
 *
 * Uses Brave Search API for fantastic images and official links
 */

import { searchImages, searchWeb, searchActivity, searchRestaurant } from './braveSearchService'
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/upstash'

// Simple concurrency limiter to prevent POI image bursts from exceeding RPS
async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let idx = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = idx++
      if (current >= items.length) break
      results[current] = await worker(items[current], current)
    }
  })
  await Promise.all(runners)
  return results
}

export interface BraveActivityData {
  images: Array<{
    url: string
    thumbnail: string // 16:9 optimized
    title: string
    source: string
    width: number
    height: number
  }>
  links: Array<{
    title: string
    url: string
    description: string
    type: 'official' | 'booking' | 'guide' | 'affiliate' | 'unknown'
    phone?: string
    website?: string
    address?: string
    directionsUrl?: string
  }>
}

/**
 * Fetch activity/POI images and links from Brave API
 * Returns 16:9 optimized images perfect for cards
 */
export async function fetchActivityData(
  activityName: string,
  locationName: string,
  imageCount: number = 5,
  options?: { tripType?: string; context?: string }
): Promise<BraveActivityData> {
  const ctxKey = options ? `:${(options.tripType || '').toLowerCase()}:${(options.context || '').toLowerCase().slice(0,50)}` : ''
  const cacheKey = CacheKeys.activityData(locationName + ctxKey, activityName)

  // Check cache first (24 hours)
  const cached = await getCached<BraveActivityData>(cacheKey)
  if (cached) {
    console.log(`✅ Brave Activity Cache HIT: ${activityName} in ${locationName}${ctxKey ? ' with context' : ''}`)
    return cached
  }

  try {
    // Use Brave's searchActivity function
    const { images: braveImages, links: braveLinks } = await searchActivity(
      activityName,
      locationName,
      options
    )

    // Transform to our format
    const images = braveImages.slice(0, imageCount).map(img => ({
      url: img.url,
      thumbnail: img.thumbnail, // 16:9 optimized!
      title: img.title,
      source: img.source,
      width: img.properties.width,
      height: img.properties.height
    }))

    const links = braveLinks.map(link => ({
      title: link.title,
      url: link.url,
      description: link.description,
      type: (link.type === 'restaurant' ? 'booking' : (['official','booking','guide','affiliate'].includes(link.type as any) ? (link.type as any) : 'unknown')),
      phone: (link as any).phone,
      website: (link as any).website || link.url,
      address: (link as any).address,
      directionsUrl: (link as any).address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((link as any).address)}` : undefined,
    }))

    const result: BraveActivityData = { images, links }

    // Cache for 24 hours
    await setCached(cacheKey, result, CacheTTL.LONG)

    console.log(`✅ Brave Activity: ${images.length} images, ${links.length} links for "${activityName}"`)
    return result

  } catch (error) {
    console.error(`❌ Brave Activity error for "${activityName}":`, error)
    return { images: [], links: [] }
  }
}

/**
 * Fetch restaurant images and booking links from Brave API
 * Returns 16:9 optimized images perfect for restaurant cards
 */
export async function fetchRestaurantData(
  restaurantName: string,
  locationName: string,
  imageCount: number = 5,
  options?: { tripType?: string; context?: string }
): Promise<BraveActivityData> {
  const ctxKey = options ? `:${(options.tripType || '').toLowerCase()}:${(options.context || '').toLowerCase().slice(0,50)}` : ''
  const cacheKey = CacheKeys.restaurantData(`${locationName}${ctxKey}:${restaurantName}`)

  // Check cache first (24 hours)
  const cached = await getCached<BraveActivityData>(cacheKey)
  if (cached) {
    console.log(`✅ Brave Restaurant Cache HIT: ${restaurantName} in ${locationName}${ctxKey ? ' with context' : ''}`)
    return cached
  }

  try {
    // Use Brave's searchRestaurant function
    const { images: braveImages, bookingLinks } = await searchRestaurant(
      restaurantName,
      locationName,
      options
    )

    // Transform to our format
    const images = braveImages.slice(0, imageCount).map(img => ({
      url: img.url,
      thumbnail: img.thumbnail, // 16:9 optimized!
      title: img.title,
      source: img.source,
      width: img.properties.width,
      height: img.properties.height
    }))

    const links = bookingLinks.map(link => ({
      title: link.title,
      url: link.url,
      description: link.description,
      type: (link.type === 'restaurant' ? 'booking' : (['official','booking','guide','affiliate'].includes(link.type as any) ? (link.type as any) : 'unknown')),
      phone: (link as any).phone,
      website: (link as any).website || link.url,
      address: (link as any).address,
      directionsUrl: (link as any).address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((link as any).address)}` : undefined,
    }))

    const result: BraveActivityData = { images, links }

    // Cache for 24 hours
    await setCached(cacheKey, result, CacheTTL.LONG)

    console.log(`✅ Brave Restaurant: ${images.length} images, ${links.length} links for "${restaurantName}"`)
    return result

  } catch (error) {
    console.error(`❌ Brave Restaurant error for "${restaurantName}":`, error)
    return { images: [], links: [] }
  }
}

/**
 * Fetch single best image for activity/POI (16:9 optimized)
 * Perfect for activity cards, trip itineraries, etc.
 */
export async function fetchActivityImage(
  activityName: string,
  locationName: string,
  options?: { tripType?: string; context?: string }
): Promise<string | null> {
  try {
    const data = await fetchActivityData(activityName, locationName, 1, options)
    return data.images[0]?.thumbnail || data.images[0]?.url || null
  } catch (error) {
    console.error(`❌ Brave Activity Image error:`, error)
    return null
  }
}

/**
 * Fetch single best image for restaurant (16:9 optimized)
 * Perfect for restaurant cards
 */
export async function fetchRestaurantImage(
  restaurantName: string,
  locationName: string,
  options?: { tripType?: string; context?: string }
): Promise<string | null> {
  try {
    const data = await fetchRestaurantData(restaurantName, locationName, 1, options)
    return data.images[0]?.thumbnail || data.images[0]?.url || null
  } catch (error) {
    console.error(`❌ Brave Restaurant Image error:`, error)
    return null
  }
}

/**
 * Fetch multiple images for gallery (16:9 optimized)
 * Returns array of thumbnail URLs
 */
export async function fetchActivityGallery(
  activityName: string,
  locationName: string,
  count: number = 10,
  options?: { tripType?: string; context?: string }
): Promise<string[]> {
  try {
    const data = await fetchActivityData(activityName, locationName, count, options)
    return data.images.map(img => img.thumbnail || img.url)
  } catch (error) {
    console.error(`❌ Brave Activity Gallery error:`, error)
    return []
  }
}

/**
 * Fetch booking/official links for activity
 * Returns array of links sorted by type (official first, then booking)
 */
export async function fetchActivityLinks(
  activityName: string,
  locationName: string,
  options?: { tripType?: string; context?: string }
): Promise<BraveActivityData['links']> {
  try {
    const data = await fetchActivityData(activityName, locationName, 1, options)

    // Sort: official → booking → guide → affiliate → unknown
    const typeOrder = { official: 0, booking: 1, guide: 2, affiliate: 3, unknown: 4 }
    return data.links.sort((a, b) => typeOrder[a.type] - typeOrder[b.type])
  } catch (error) {
    console.error(`❌ Brave Activity Links error:`, error)
    return []
  }
}

/**
 * Batch fetch images for multiple activities
 * Useful for loading all activity images at once
 */
export async function fetchMultipleActivityImages(
  activities: Array<{ name: string; locationName: string }>,
  imageCount: number = 1
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  const concurrency = 6 // extra defensive cap to avoid bursts
  await mapWithConcurrency(activities, concurrency, async ({ name, locationName }) => {
    const image = await fetchActivityImage(name, locationName)
    if (image) {
      results.set(name, image)
    }
    return image as any
  })

  return results
}

/**
 * Batch fetch images for multiple restaurants
 * Useful for loading all restaurant images at once
 */
export async function fetchMultipleRestaurantImages(
  restaurants: Array<{ name: string; locationName: string }>,
  imageCount: number = 1
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  const concurrency = 6 // extra defensive cap to avoid bursts
  await mapWithConcurrency(restaurants, concurrency, async ({ name, locationName }) => {
    const image = await fetchRestaurantImage(name, locationName)
    if (image) {
      results.set(name, image)
    }
    return image as any
  })

  return results
}

