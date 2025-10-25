/**
 * Unified Image Discovery Service
 *
 * Combines ALL image sources for maximum variety and quality:
 * 1. Brave Image Search (16:9 thumbnails, high quality)
 * 2. Reddit Ultra Engine (authentic user photos) - EXISTING IMPLEMENTATION
 * 3. Existing sources (Pexels, Unsplash, Wikimedia, Wikipedia)
 *
 * Used for:
 * - Trip planning (location images)
 * - Activities/POIs (specific place images)
 * - Restaurants (food + interior images)
 * - Blog posts (contextual images)
 *
 * IMPORTANT: Reddit rate limiting is handled by existing implementation
 * DO NOT call Reddit APIs directly - use existing service
 */

import { searchImages as braveSearchImages } from './braveSearchService'
import { searchRedditLocationImages } from './socialImageScraperService'
import { fetchPexelsImage, fetchUnsplashImage, fetchWikimediaImage, fetchWikipediaImage } from './robustImageService'
import { getCached, setCached, CacheKeys, CacheTTL } from '@/lib/upstash'

export interface DiscoveredImage {
  url: string
  thumbnail: string
  title: string
  source: 'brave' | 'reddit' | 'pexels' | 'unsplash' | 'wikimedia' | 'wikipedia'
  attribution?: {
    author?: string
    sourceUrl?: string
    license?: string
  }
  score?: number // For Reddit images
  width?: number
  height?: number
}

/**
 * Discover images for a location (comprehensive search)
 */
export async function discoverLocationImages(
  locationName: string,
  specificPlace?: string,
  limit: number = 30
): Promise<DiscoveredImage[]> {
  const query = specificPlace ? `${specificPlace} ${locationName}` : locationName
  const cacheKey = CacheKeys.imageDiscovery(query, limit)

  // Check cache first (24 hours)
  const cached = await getCached<DiscoveredImage[]>(cacheKey)
  if (cached) {
    console.log(`✅ Image Discovery Cache HIT: ${query}`)
    return cached
  }

  console.log(`🔍 Discovering images for: ${query}`)

  // Parallel search across ALL sources
  // NOTE: Reddit search uses existing ultra-filtered implementation with rate limiting
  const [braveImages, redditImages, legacyImages] = await Promise.all([
    braveSearchImages(query, 15),
    searchRedditLocationImages(query, 15), // Uses existing Reddit Ultra Engine
    searchLegacySources(query, 10),
  ])

  // Convert to unified format
  const discovered: DiscoveredImage[] = [
    // Brave images (highest priority - best quality)
    ...braveImages.map(img => ({
      url: img.url,
      thumbnail: img.thumbnail,
      title: img.title,
      source: 'brave' as const,
      width: img.properties.width,
      height: img.properties.height,
    })),

    // Reddit images (authentic user photos) - already filtered by existing service
    ...redditImages.map(img => ({
      url: img.url,
      thumbnail: img.url, // Reddit images are direct URLs
      title: img.title || query,
      source: 'reddit' as const,
      attribution: {
        author: img.author,
        sourceUrl: img.permalink,
      },
      score: img.score,
    })),

    // Legacy sources (fallback)
    ...legacyImages,
  ]

  // Deduplicate by URL
  const unique = deduplicateImages(discovered)

  // Sort by quality (Brave first, then Reddit by score, then others)
  const sorted = unique.sort((a, b) => {
    if (a.source === 'brave' && b.source !== 'brave') return -1
    if (a.source !== 'brave' && b.source === 'brave') return 1
    if (a.source === 'reddit' && b.source === 'reddit') {
      return (b.score || 0) - (a.score || 0)
    }
    return 0
  })

  const final = sorted.slice(0, limit)

  // Cache for 24 hours
  await setCached(cacheKey, final, CacheTTL.LONG)

  console.log(`✅ Discovered ${final.length} images (Brave: ${braveImages.length}, Reddit: ${redditImages.length}, Legacy: ${legacyImages.length})`)

  return final
}

/**
 * Discover images for a restaurant
 */
export async function discoverRestaurantImages(
  restaurantName: string,
  locationName: string,
  limit: number = 20
): Promise<DiscoveredImage[]> {
  const query = `${restaurantName} ${locationName} restaurant food`

  // Parallel search - Reddit uses existing service with rate limiting
  const [braveImages, redditImages] = await Promise.all([
    braveSearchImages(query, 15),
    searchRedditLocationImages(`${restaurantName} ${locationName}`, 10),
  ])

  const discovered: DiscoveredImage[] = [
    ...braveImages.map(img => ({
      url: img.url,
      thumbnail: img.thumbnail,
      title: img.title,
      source: 'brave' as const,
      width: img.properties.width,
      height: img.properties.height,
    })),
    ...redditImages.map(img => ({
      url: img.url,
      thumbnail: img.url,
      title: img.title || query,
      source: 'reddit' as const,
      attribution: {
        author: img.author,
        sourceUrl: img.permalink,
      },
      score: img.score,
    })),
  ]

  return deduplicateImages(discovered).slice(0, limit)
}

/**
 * Discover images for an activity/POI
 */
export async function discoverActivityImages(
  activityName: string,
  locationName: string,
  limit: number = 20
): Promise<DiscoveredImage[]> {
  const query = `${activityName} ${locationName}`

  const [braveImages, redditImages] = await Promise.all([
    braveSearchImages(query, 15),
    searchRedditLocationImages(query, 10),
  ])

  const discovered: DiscoveredImage[] = [
    ...braveImages.map(img => ({
      url: img.url,
      thumbnail: img.thumbnail,
      title: img.title,
      source: 'brave' as const,
      width: img.properties.width,
      height: img.properties.height,
    })),
    ...redditImages.map(img => ({
      url: img.url,
      thumbnail: img.url,
      title: img.title || query,
      source: 'reddit' as const,
      attribution: {
        author: img.author,
        sourceUrl: img.permalink,
      },
      score: img.score,
    })),
  ]

  return deduplicateImages(discovered).slice(0, limit)
}

/**
 * Search legacy image sources (Pexels, Unsplash, Wikimedia, Wikipedia)
 */
async function searchLegacySources(query: string, limit: number): Promise<DiscoveredImage[]> {
  const images: DiscoveredImage[] = []

  // Try each source (non-blocking)
  const [pexels, unsplash, wikimedia, wikipedia] = await Promise.allSettled([
    fetchPexelsImage(query),
    fetchUnsplashImage(query),
    fetchWikimediaImage(query),
    fetchWikipediaImage(query),
  ])

  if (pexels.status === 'fulfilled' && pexels.value) {
    images.push({
      url: pexels.value,
      thumbnail: pexels.value,
      title: query,
      source: 'pexels',
    })
  }

  if (unsplash.status === 'fulfilled' && unsplash.value) {
    images.push({
      url: unsplash.value,
      thumbnail: unsplash.value,
      title: query,
      source: 'unsplash',
    })
  }

  if (wikimedia.status === 'fulfilled' && wikimedia.value) {
    images.push({
      url: wikimedia.value,
      thumbnail: wikimedia.value,
      title: query,
      source: 'wikimedia',
    })
  }

  if (wikipedia.status === 'fulfilled' && wikipedia.value) {
    images.push({
      url: wikipedia.value,
      thumbnail: wikipedia.value,
      title: query,
      source: 'wikipedia',
    })
  }

  return images.slice(0, limit)
}

/**
 * Deduplicate images by URL
 */
function deduplicateImages(images: DiscoveredImage[]): DiscoveredImage[] {
  const seen = new Set<string>()
  const unique: DiscoveredImage[] = []

  for (const image of images) {
    const normalizedUrl = image.url.split('?')[0] // Remove query params
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl)
      unique.push(image)
    }
  }

  return unique
}

