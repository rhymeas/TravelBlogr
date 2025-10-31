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
const BRAVE_NEWS_SEARCH_URL = 'https://api.search.brave.com/res/v1/news/search'

// Debug: Only log presence/length in non-production (never log the key)
if (process.env.NODE_ENV !== 'production') {
  if (BRAVE_API_KEY) {
    console.log(`🔑 Brave API key configured: true (len=${BRAVE_API_KEY.length})`)
  } else {
    console.warn('⚠️ BRAVE_SEARCH_API_KEY not found in environment variables!')
  }
}

// Defensive micro-throttle to keep < 20 RPS for PAID plan (rate_limit: 20)
// Brave Paid Plan: 20 requests per second
let __braveRequestTimes: number[] = []
async function throttleBraveRPS(maxPerSec: number = 18) {
  while (true) {
    const now = Date.now()
    __braveRequestTimes = __braveRequestTimes.filter(t => now - t < 1000)
    if (__braveRequestTimes.length < maxPerSec) {
      __braveRequestTimes.push(now)
      return
    }
    await new Promise(res => setTimeout(res, 30))
  }
}

export interface BraveWebResult {
  title: string
  url: string
  description: string
  type: 'official' | 'booking' | 'guide' | 'affiliate' | 'restaurant' | 'unknown'
  favicon?: string
  age?: string
  phone?: string
  website?: string
  address?: string
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
    await throttleBraveRPS()
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
      const errorText = await response.text()
      console.error(`❌ Brave Web Search: ${response.status} for "${query}"`)
      console.error(`   Error details: ${errorText}`)
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
      phone: result.profile?.phone || result.phone,
      website: result.profile?.url || result.site?.url,
      address: result.profile?.address || result.address,
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
    await throttleBraveRPS()
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
      const errorText = await response.text()
      console.error(`❌ Brave Image Search: ${response.status} for "${query}"`)
      console.error(`   Error details: ${errorText}`)
      return []
    }

    const data = await response.json()
    const results: BraveImageResult[] = (data.results || [])
      .filter((result: any) => {
        // Filter out Alamy watermarked images
        const url = result.url || ''
        const thumbnail = result.thumbnail?.src || ''
        const source = result.source || ''

        if (url.includes('alamy.com') || url.includes('alamy')) return false
        if (thumbnail.includes('alamy.com') || thumbnail.includes('alamy')) return false
        if (source.includes('alamy.com') || source.includes('alamy')) return false

        return true
      })
      .map((result: any) => ({
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
 *
 * 🎯 OPTIMIZED QUERY STRATEGY (2025-01-27)
 * Uses same smart query builder as searchActivity()
 * Restaurants are treated as lesser-known POIs (need geographic context)
 *
 * 📚 Documentation: docs/BRAVE_QUERY_FINAL_STRATEGY.md
 *
 * 🔄 Query Flow:
 * 1. Build prioritized query list (restaurants rarely globally famous)
 * 2. Try each query with "restaurant food interior" modifiers
 * 3. Stop when ≥3 images found (lower threshold than activities)
 * 4. Fetch booking links using successful query
 *
 * @param restaurantName - Restaurant name
 * @param locationName - Location (e.g., "Paris, France", "Kamloops, BC")
 * @param options - Optional trip type and context for query modifiers
 * @returns Images and booking links
 */
export async function searchRestaurant(
  restaurantName: string,
  locationName: string,
  options?: { tripType?: string; context?: string }
): Promise<{ images: BraveImageResult[]; bookingLinks: BraveWebResult[] }> {
  const modifiers = buildVisionModifiers(options)

  // Build prioritized query list (restaurants are rarely "well-known" globally)
  const queries = buildBraveQuery(restaurantName, locationName, 'restaurant', false)

  // Try queries in order until we get sufficient images
  let images: BraveImageResult[] = []
  let successfulQuery = ''

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i]
    const queryWithModifiers = `${query} ${modifiers} restaurant food interior`.trim()

    try {
      images = await searchImages(queryWithModifiers, 10)

      if (images.length >= 3) {
        successfulQuery = query
        console.log(`✅ Brave Restaurant Query Success (attempt ${i + 1}/${queries.length}): "${query}" → ${images.length} images`)
        break
      }

      console.log(`⚠️ Brave Restaurant Query Insufficient (attempt ${i + 1}/${queries.length}): "${query}" → ${images.length} images, trying next...`)
    } catch (error) {
      console.error(`❌ Brave Restaurant Query Error (attempt ${i + 1}/${queries.length}): "${query}"`, error)
      continue
    }
  }

  // If no query succeeded, use fallback
  if (images.length === 0) {
    console.warn(`⚠️ All Brave restaurant queries failed for "${restaurantName}", using fallback`)
    const fallbackQuery = `${restaurantName} ${locationName} ${modifiers} restaurant food interior`.trim()
    images = await searchImages(fallbackQuery, 10)
  }

  // Fetch booking links using smart multi-query strategy
  // 📚 See docs/BRAVE_QUERY_FINAL_STRATEGY.md for query optimization details
  const allLinks = await fetchRestaurantLinksWithStrategy(
    restaurantName,
    locationName,
    successfulQuery,
    modifiers
  )

  // Filter booking links
  const bookingLinks = allLinks.filter(r =>
    r.type === 'booking' || r.type === 'restaurant'
  )

  return { images, bookingLinks }
}

/**
 * Build optimized Brave API query based on POI characteristics
 * Returns array of queries in priority order (try first → last)
 *
 * 🎯 OPTIMIZED QUERY STRATEGY (2025-01-27)
 * Based on 11 diverse POI test cases across 8 countries
 * Success rate: 85-90% (up from ~70%)
 *
 * 📚 Documentation:
 * - Full strategy: docs/BRAVE_QUERY_FINAL_STRATEGY.md
 * - Implementation: docs/BRAVE_QUERY_IMPLEMENTATION_SUMMARY.md
 * - Codebase rules: .augment/rules/imported/rules.md (lines 93-181)
 *
 * 🔑 Key Findings:
 * - Comma placement is CRITICAL: "Activity City, Province Type" works, "Activity City Type" fails
 * - Simplicity often wins: "Eiffel Tower" > "Eiffel Tower Paris, France landmark"
 * - Natural language works best: "Activity in City" > "Activity City"
 * - Province alone fails for lesser-known POIs
 * - Well-known POIs work best with name only
 *
 * @param activityName - POI/activity name (e.g., "Eiffel Tower", "Sun Peaks Resort")
 * @param location - Location string (e.g., "Paris, France", "Kamloops, BC")
 * @param type - Optional POI type (e.g., "ski resort", "restaurant", "landmark")
 * @param isWellKnown - Whether POI is globally famous (auto-detected if not specified)
 * @returns Array of queries in priority order (try first → last)
 */
function buildBraveQuery(
  activityName: string,
  location: string,
  type?: string,
  isWellKnown: boolean = false
): string[] {
  // Parse location components
  const parts = location.split(',').map(s => s.trim())
  const city = parts[0] || ''
  const province = parts[1] || ''

  // Tier 1: Primary strategies (highest success rate)
  const tier1 = [
    activityName,                                    // #1 🥇 Name only (best for famous POIs)
    `${activityName} in ${city}${province ? ', ' + province : ''}`, // #2 🥈 Natural language
    `${activityName} ${city}`,                      // #3 🥉 Simple + city
  ]

  // Tier 2: Enhanced strategies (good fallback)
  const tier2 = [
    `${activityName} near ${city}`,                 // #6 Natural proximity
    ...(type ? [`${activityName} ${type}`] : []),   // #7 Type only
    ...(type && province ? [`${activityName} ${city}, ${province} ${type}`] : []), // #5 Full location + type
  ]

  // Tier 3: Last resort (use only if tier1/tier2 fail)
  const tier3 = [
    ...(type && city ? [`${activityName} ${city} ${type}`] : []), // #4 City + type (risky without comma!)
  ]

  // NEVER USE: These fail frequently
  // ❌ `${activityName} ${province}` - Province alone
  // ❌ `${activityName} ${city}, ${country}` - Full location with country
  // ❌ `${type} ${city}` - Generic fallback

  // Return prioritized list
  if (isWellKnown) {
    // Famous POIs: Name only works best
    return [...tier1, ...tier2, ...tier3]
  } else {
    // Lesser-known POIs: Need geographic context
    return [tier1[1], tier1[2], tier1[0], ...tier2, ...tier3]
  }
}

/**
 * Detect if POI is well-known based on name patterns
 *
 * 🎯 PURPOSE: Determines query strategy priority
 * - Well-known POIs: Try "name only" first (e.g., "Eiffel Tower")
 * - Lesser-known POIs: Try "name in location" first (e.g., "Sun Peaks Resort in Kamloops, BC")
 *
 * 📊 Heuristic based on testing:
 * - Famous landmarks work best with simple queries
 * - Local attractions need geographic context
 *
 * @param activityName - POI/activity name to check
 * @returns true if POI is likely globally famous, false otherwise
 */
function isWellKnownPOI(activityName: string): boolean {
  const famousKeywords = [
    'tower', 'museum', 'palace', 'cathedral', 'temple', 'monument',
    'park', 'beach', 'mountain', 'lake', 'river', 'falls', 'waterfall',
    'national', 'world heritage', 'unesco', 'statue', 'bridge',
    'eiffel', 'louvre', 'taj mahal', 'colosseum', 'big ben',
    'burj', 'empire state', 'golden gate', 'sydney opera'
  ]

  const nameLower = activityName.toLowerCase()
  return famousKeywords.some(kw => nameLower.includes(kw))
}

/**
 * Search for activity/POI images and links
 *
 * 🎯 OPTIMIZED QUERY STRATEGY (2025-01-27)
 * Uses smart query builder with 7 prioritized strategies
 * Tries queries in order until sufficient images found (≥5 images)
 *
 * 📚 Documentation: docs/BRAVE_QUERY_FINAL_STRATEGY.md
 *
 * 🔄 Query Flow:
 * 1. Detect if POI is well-known (famous landmarks vs local attractions)
 * 2. Build prioritized query list (7 strategies)
 * 3. Try each query until ≥5 images found
 * 4. Fallback to simple query if all fail
 * 5. Fetch booking links using successful query
 *
 * 💡 Example:
 * - Famous: "Eiffel Tower" → "Eiffel Tower in Paris" → "Eiffel Tower Paris" → ...
 * - Local: "Sun Peaks Resort in Kamloops, BC" → "Sun Peaks Resort Kamloops" → ...
 *
 * @param activityName - POI/activity name
 * @param locationName - Location (e.g., "Paris, France", "Kamloops, BC")
 * @param options - Optional trip type and context for query modifiers
 * @returns Images and booking links
 */
export async function searchActivity(
  activityName: string,
  locationName: string,
  options?: { tripType?: string; context?: string }
): Promise<{ images: BraveImageResult[]; links: BraveWebResult[] }> {
  const modifiers = buildVisionModifiers(options)

  // Detect if POI is well-known
  const isWellKnown = isWellKnownPOI(activityName)

  // Build prioritized query list
  const queries = buildBraveQuery(activityName, locationName, undefined, isWellKnown)

  // Try queries in order until we get sufficient images
  let images: BraveImageResult[] = []
  let successfulQuery = ''

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i]
    const queryWithModifiers = `${query} ${modifiers}`.trim()

    try {
      images = await searchImages(queryWithModifiers, 15)

      if (images.length >= 5) {
        successfulQuery = query
        console.log(`✅ Brave Query Success (attempt ${i + 1}/${queries.length}): "${query}" → ${images.length} images`)
        break
      }

      console.log(`⚠️ Brave Query Insufficient (attempt ${i + 1}/${queries.length}): "${query}" → ${images.length} images, trying next...`)
    } catch (error) {
      console.error(`❌ Brave Query Error (attempt ${i + 1}/${queries.length}): "${query}"`, error)
      continue
    }
  }

  // If no query succeeded, use fallback (original simple query)
  if (images.length === 0) {
    console.warn(`⚠️ All Brave queries failed for "${activityName}", using fallback`)
    const fallbackQuery = `${activityName} ${locationName} ${modifiers}`.trim()
    images = await searchImages(fallbackQuery, 15)
  }

  // Fetch links using smart multi-query strategy
  // 📚 See docs/BRAVE_QUERY_FINAL_STRATEGY.md for query optimization details
  const links = await fetchActivityLinksWithStrategy(
    activityName,
    locationName,
    successfulQuery,
    isWellKnown,
    modifiers
  )

  return { images, links }
}

/**
 * Fetch restaurant links using smart multi-query strategy
 *
 * 🎯 OPTIMIZED RESTAURANT LINK STRATEGY (2025-01-30)
 * Focused on finding:
 * - Official restaurant websites
 * - Reservation platforms (OpenTable, Resy, etc.)
 * - Menu pages
 * - Review sites (TripAdvisor, Yelp)
 *
 * @param restaurantName - Restaurant name
 * @param locationName - Location string
 * @param successfulImageQuery - Query that worked for images (if any)
 * @param modifiers - Additional query modifiers
 * @returns Array of web results (links)
 */
async function fetchRestaurantLinksWithStrategy(
  restaurantName: string,
  locationName: string,
  successfulImageQuery: string,
  modifiers: string
): Promise<BraveWebResult[]> {
  // Build prioritized restaurant link query list
  const linkQueries = buildRestaurantLinkQueries(
    restaurantName,
    locationName,
    successfulImageQuery
  )

  // Try queries in order until we get good results
  let links: BraveWebResult[] = []
  let bestResults: BraveWebResult[] = []
  let bestScore = 0

  for (let i = 0; i < linkQueries.length; i++) {
    const query = linkQueries[i]
    const queryWithModifiers = `${query.query} ${modifiers}`.trim()

    try {
      const results = await searchWeb(queryWithModifiers, 5)

      // Score results based on link quality
      const score = scoreLinkResults(results)

      console.log(`🍽️ Restaurant Link Query (attempt ${i + 1}/${linkQueries.length}): "${query.query}" → ${results.length} links (score: ${score})`)

      // Keep best results
      if (score > bestScore) {
        bestScore = score
        bestResults = results
      }

      // If we found restaurant or booking links, we're done
      if (results.some(r => r.type === 'restaurant' || r.type === 'booking')) {
        console.log(`✅ Found restaurant/booking links on attempt ${i + 1}`)
        links = results
        break
      }

    } catch (error) {
      console.error(`❌ Restaurant Link Query Error (attempt ${i + 1}/${linkQueries.length}): "${query.query}"`, error)
      continue
    }
  }

  // Return best results found
  return links.length > 0 ? links : bestResults
}

/**
 * Build prioritized restaurant link query list
 *
 * Strategy:
 * 1. Use successful image query if available
 * 2. Try "reservation" / "booking" queries
 * 3. Try "menu" queries
 * 4. Try "official website" queries
 * 5. Fallback to simple queries
 */
function buildRestaurantLinkQueries(
  restaurantName: string,
  locationName: string,
  successfulImageQuery: string
): Array<{ query: string; type: string }> {
  const queries: Array<{ query: string; type: string }> = []

  // Parse location
  const parts = locationName.split(',').map(s => s.trim())
  const city = parts[0] || ''

  // Tier 1: Reservation/booking queries (highest priority for restaurants)
  if (successfulImageQuery) {
    queries.push({ query: `${successfulImageQuery} reservation`, type: 'booking' })
  }
  queries.push({ query: `${restaurantName} ${city} reservation`, type: 'booking' })
  queries.push({ query: `${restaurantName} ${city} book table`, type: 'booking' })
  queries.push({ query: `${restaurantName} OpenTable`, type: 'booking' })
  queries.push({ query: `${restaurantName} Resy`, type: 'booking' })

  // Tier 2: Menu queries
  queries.push({ query: `${restaurantName} ${city} menu`, type: 'menu' })
  queries.push({ query: `${restaurantName} menu prices`, type: 'menu' })

  // Tier 3: Official website queries
  if (successfulImageQuery) {
    queries.push({ query: `${successfulImageQuery} official website`, type: 'official' })
  }
  queries.push({ query: `${restaurantName} ${city} official website`, type: 'official' })

  // Tier 4: Review/info queries
  queries.push({ query: `${restaurantName} ${city} TripAdvisor`, type: 'review' })
  queries.push({ query: `${restaurantName} ${city} Yelp`, type: 'review' })

  // Tier 5: Fallback
  if (successfulImageQuery) {
    queries.push({ query: successfulImageQuery, type: 'fallback' })
  }
  queries.push({ query: `${restaurantName} ${locationName}`, type: 'fallback' })

  return queries
}

/**
 * Fetch activity links using smart multi-query strategy
 *
 * 🎯 OPTIMIZED LINK STRATEGY (2025-01-30)
 * Similar to image query optimization, but focused on finding:
 * - Official websites
 * - Booking/ticket pages
 * - Tour operator pages
 * - Information pages
 *
 * 📚 Documentation: docs/BRAVE_QUERY_FINAL_STRATEGY.md
 *
 * @param activityName - Activity/POI name
 * @param locationName - Location string
 * @param successfulImageQuery - Query that worked for images (if any)
 * @param isWellKnown - Whether POI is globally famous
 * @param modifiers - Additional query modifiers
 * @returns Array of web results (links)
 */
async function fetchActivityLinksWithStrategy(
  activityName: string,
  locationName: string,
  successfulImageQuery: string,
  isWellKnown: boolean,
  modifiers: string
): Promise<BraveWebResult[]> {
  // Build prioritized link query list
  const linkQueries = buildLinkQueries(
    activityName,
    locationName,
    successfulImageQuery,
    isWellKnown
  )

  // Try queries in order until we get good results
  let links: BraveWebResult[] = []
  let bestResults: BraveWebResult[] = []
  let bestScore = 0

  for (let i = 0; i < linkQueries.length; i++) {
    const query = linkQueries[i]
    const queryWithModifiers = `${query.query} ${modifiers}`.trim()

    try {
      const results = await searchWeb(queryWithModifiers, 5)

      // Score results based on link quality
      const score = scoreLinkResults(results)

      console.log(`🔗 Link Query (attempt ${i + 1}/${linkQueries.length}): "${query.query}" → ${results.length} links (score: ${score})`)

      // Keep best results
      if (score > bestScore) {
        bestScore = score
        bestResults = results
      }

      // If we found official or booking links, we're done
      if (results.some(r => r.type === 'official' || r.type === 'booking')) {
        console.log(`✅ Found high-quality links on attempt ${i + 1}`)
        links = results
        break
      }

    } catch (error) {
      console.error(`❌ Link Query Error (attempt ${i + 1}/${linkQueries.length}): "${query.query}"`, error)
      continue
    }
  }

  // Return best results found
  return links.length > 0 ? links : bestResults
}

/**
 * Build prioritized link query list
 *
 * Strategy:
 * 1. Use successful image query if available (proven to work)
 * 2. Try "official website" queries
 * 3. Try "tickets" / "booking" queries
 * 4. Try "visit" / "information" queries
 * 5. Fallback to simple queries
 */
function buildLinkQueries(
  activityName: string,
  locationName: string,
  successfulImageQuery: string,
  isWellKnown: boolean
): Array<{ query: string; type: string }> {
  const queries: Array<{ query: string; type: string }> = []

  // Parse location
  const parts = locationName.split(',').map(s => s.trim())
  const city = parts[0] || ''

  // Tier 1: Official website queries (highest priority)
  if (successfulImageQuery) {
    queries.push({ query: `${successfulImageQuery} official website`, type: 'official' })
  }
  queries.push({ query: `${activityName} official website`, type: 'official' })
  if (!isWellKnown && city) {
    queries.push({ query: `${activityName} ${city} official website`, type: 'official' })
  }

  // Tier 2: Booking/tickets queries
  if (successfulImageQuery) {
    queries.push({ query: `${successfulImageQuery} tickets booking`, type: 'booking' })
  }
  queries.push({ query: `${activityName} tickets`, type: 'booking' })
  queries.push({ query: `${activityName} book tickets`, type: 'booking' })
  if (!isWellKnown && city) {
    queries.push({ query: `${activityName} ${city} tickets`, type: 'booking' })
  }

  // Tier 3: Visit/information queries
  queries.push({ query: `visit ${activityName}`, type: 'info' })
  queries.push({ query: `${activityName} visitor information`, type: 'info' })

  // Tier 4: Tours/experiences queries
  queries.push({ query: `${activityName} tours`, type: 'tours' })
  if (!isWellKnown && city) {
    queries.push({ query: `${activityName} ${city} tours`, type: 'tours' })
  }

  // Tier 5: Fallback (simple queries)
  if (successfulImageQuery) {
    queries.push({ query: successfulImageQuery, type: 'fallback' })
  }
  queries.push({ query: `${activityName} ${locationName}`, type: 'fallback' })

  return queries
}

/**
 * Score link results based on quality
 *
 * Scoring:
 * - Official site: +10 points
 * - Booking site: +8 points
 * - Guide site: +5 points
 * - Restaurant site: +6 points
 * - Affiliate site: +3 points
 * - Unknown: +1 point
 */
function scoreLinkResults(results: BraveWebResult[]): number {
  const typeScores = {
    official: 10,
    booking: 8,
    restaurant: 6,
    guide: 5,
    affiliate: 3,
    unknown: 1
  }

  return results.reduce((score, result) => {
    return score + (typeScores[result.type] || 0)
  }, 0)
}

/**
 * Search for location-specific images
 *
 * ⚠️ NOTE: This function uses simple query (not optimized strategy)
 * For POI/activity images, use searchActivity() instead
 *
 * 📚 For optimized queries, see:
 * - searchActivity() - Uses smart query builder
 * - docs/BRAVE_QUERY_FINAL_STRATEGY.md
 *
 * @param locationName - Location name (e.g., "Paris", "Kamloops, BC")
 * @param specificPlace - Optional specific place within location
 * @returns Array of image results
 */
export async function searchLocationImages(
  locationName: string,
  specificPlace?: string
): Promise<BraveImageResult[]> {
  // Simple query for general location images
  // TODO: Consider applying optimized query strategy here too
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

/**
 * NEW: Search for POIs near a location
 * Uses Brave Web Search with location-based queries
 */
export interface BravePOIResult extends BraveWebResult {
  estimatedDistance?: number // km from query point
  category: 'restaurant' | 'attraction' | 'hotel' | 'gas-station' | 'viewpoint' | 'unknown'
  coordinates?: { latitude: number; longitude: number }
}

export async function searchPOIsNearLocation(
  latitude: number,
  longitude: number,
  radius: number = 10, // km
  category?: 'restaurant' | 'attraction' | 'hotel' | 'gas-station'
): Promise<BravePOIResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('⚠️ BRAVE_SEARCH_API_KEY not configured')
    return []
  }

  // Build location-aware query
  const categoryQuery = category || 'points of interest attractions restaurants'
  const query = `${categoryQuery} near ${latitude},${longitude} within ${radius}km`

  const cacheKey = `${CacheKeys.braveWebSearch(query, 20)}`

  // Check cache first (24 hours)
  const cached = await getCached<BravePOIResult[]>(cacheKey)
  if (cached) {
    console.log(`✅ Brave POI Cache HIT: ${query}`)
    return cached
  }

  try {
    const response = await fetch(
      `${BRAVE_WEB_SEARCH_URL}?q=${encodeURIComponent(query)}&count=20`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    )

    if (!response.ok) {
      console.error(`❌ Brave POI Search: ${response.status}`)
      return []
    }

    const data = await response.json()
    const results: BravePOIResult[] = (data.web?.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description || '',
      type: classifyLinkType(result.url, result.title),
      category: classifyPOICategory(result.title, result.description),
      favicon: result.profile?.img,
      age: result.age,
    }))

    // Cache for 24 hours
    await setCached(cacheKey, results, CacheTTL.LONG)

    console.log(`✅ Brave POI: Found ${results.length} POIs near ${latitude},${longitude}`)
    return results
  } catch (error) {
    console.error('Brave POI Search error:', error)
    return []
  }
}

/**
 * NEW: Search for location news and events
 * Uses Brave News Search API
 */
export interface BraveNewsResult {
  title: string
  url: string
  description: string
  source: string
  age: string
  thumbnail?: string
}

export async function searchLocationNews(
  locationName: string,
  limit: number = 5
): Promise<BraveNewsResult[]> {
  if (!BRAVE_API_KEY) {
    console.warn('⚠️ BRAVE_SEARCH_API_KEY not configured')
    return []
  }

  const query = `${locationName} travel events news`
  const cacheKey = `brave:news:${query}:${limit}`

  // Check cache first (6 hours for news)
  const cached = await getCached<BraveNewsResult[]>(cacheKey)
  if (cached) {
    console.log(`✅ Brave News Cache HIT: ${query}`)
    return cached
  }

  try {
    const response = await fetch(
      `${BRAVE_NEWS_SEARCH_URL}?q=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    )

    if (!response.ok) {
      console.error(`❌ Brave News Search: ${response.status}`)
      return []
    }

    const data = await response.json()
    const results: BraveNewsResult[] = (data.results || []).map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      description: result.description || '',
      source: result.source || '',
      age: result.age || '',
      thumbnail: result.thumbnail?.src,
    }))

    // Cache for 6 hours (news changes frequently)
    await setCached(cacheKey, results, CacheTTL.MEDIUM)

    console.log(`✅ Brave News: Found ${results.length} news items for "${locationName}"`)
    return results
  } catch (error) {
    console.error('Brave News Search error:', error)
    return []
  }
}

/**
 * Classify POI category based on title and description
 */
function classifyPOICategory(title: string, description: string): BravePOIResult['category'] {
  const text = `${title} ${description}`.toLowerCase()

  if (text.match(/restaurant|cafe|bistro|dining|food|eatery/)) return 'restaurant'
  if (text.match(/hotel|accommodation|lodge|resort|inn/)) return 'hotel'
  if (text.match(/museum|gallery|monument|landmark|attraction|park/)) return 'attraction'
  if (text.match(/gas station|fuel|petrol|service station/)) return 'gas-station'
  if (text.match(/viewpoint|scenic|overlook|vista|panorama/)) return 'viewpoint'

  return 'unknown'
}

