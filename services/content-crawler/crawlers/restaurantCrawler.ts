/**
 * Restaurant Crawler
 * Crawls restaurant websites and extracts structured data
 */

import { CheerioCrawler, Dataset } from 'crawlee'
import type {
  RestaurantData,
  CrawlerResult,
  CrawlerConfig,
  CrawlerStats,
  CrawlerError,
  LocationRestaurantInsert,
} from '../types'
import {
  extractJsonLd,
  findRestaurantSchema,
  schemaToRestaurantData,
  extractRestaurantFromHtml,
  validateRestaurantData,
  normalizePriceRange,
} from './utils/schemaExtractor'

const DEFAULT_CONFIG: CrawlerConfig = {
  maxRequestsPerCrawl: 100,
  maxConcurrency: 5,
  requestTimeout: 30000,
  retryCount: 3,
  userAgent:
    'TravelBlogr-Bot/1.0 (+https://travelblogr.com/bot) - Content aggregation for travel information',
  respectRobotsTxt: true,
  rateLimit: 1, // 1 request per second
}

/**
 * Crawl restaurants from a list of URLs
 */
export async function crawlRestaurants(
  urls: string[],
  config: Partial<CrawlerConfig> = {}
): Promise<CrawlerResult<RestaurantData>> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const startTime = new Date().toISOString()
  const errors: CrawlerError[] = []
  const restaurants: RestaurantData[] = []

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: finalConfig.maxRequestsPerCrawl,
    maxConcurrency: finalConfig.maxConcurrency,
    requestHandlerTimeoutSecs: finalConfig.requestTimeout! / 1000,
    maxRequestRetries: finalConfig.retryCount,

    async requestHandler({ request, $, body }) {
      try {
        console.log(`Crawling: ${request.url}`)

        // Extract JSON-LD structured data
        const html = body.toString()
        const jsonLdData = extractJsonLd(html)
        const restaurantSchema = findRestaurantSchema(jsonLdData)

        let restaurantData: RestaurantData | null = null

        if (restaurantSchema) {
          // Convert Schema.org data to our format
          restaurantData = schemaToRestaurantData(restaurantSchema, request.url)
          console.log(`✅ Found structured data for: ${restaurantData.name}`)
        } else {
          // Fallback: try to extract from HTML
          restaurantData = extractRestaurantFromHtml(html, request.url)
          if (restaurantData) {
            console.log(`⚠️  Extracted from HTML (no structured data): ${restaurantData.name}`)
          }
        }

        if (restaurantData) {
          // Normalize data
          restaurantData.price_range = normalizePriceRange(restaurantData.price_range)

          // Validate data
          const validation = validateRestaurantData(restaurantData)
          if (validation.valid) {
            restaurants.push(restaurantData)
            await Dataset.pushData(restaurantData)
          } else {
            console.warn(`Validation failed for ${request.url}:`, validation.errors)
            errors.push({
              url: request.url,
              error: `Validation failed: ${validation.errors.join(', ')}`,
              timestamp: new Date().toISOString(),
            })
          }
        } else {
          console.warn(`No restaurant data found at: ${request.url}`)
          errors.push({
            url: request.url,
            error: 'No restaurant data found',
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error(`Error processing ${request.url}:`, error)
        errors.push({
          url: request.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      }
    },

    failedRequestHandler({ request }, error) {
      console.error(`Request failed: ${request.url}`, error)
      errors.push({
        url: request.url,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    },
  })

  // Run the crawler
  const crawlStart = Date.now()
  await crawler.run(urls)
  const crawlDuration = Date.now() - crawlStart

  const endTime = new Date().toISOString()

  const stats: CrawlerStats = {
    totalRequests: urls.length,
    successfulRequests: restaurants.length,
    failedRequests: errors.length,
    itemsExtracted: restaurants.length,
    duration: crawlDuration,
    startTime,
    endTime,
  }

  return {
    success: restaurants.length > 0,
    data: restaurants,
    errors,
    stats,
  }
}

/**
 * Save crawled restaurants to Supabase
 */
export async function saveRestaurantsToDatabase(
  locationId: string,
  restaurants: RestaurantData[]
): Promise<{ success: boolean; saved: number; errors: string[] }> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const errors: string[] = []
    let saved = 0

    for (const restaurant of restaurants) {
      try {
        const insert: LocationRestaurantInsert = {
          location_id: locationId,
          name: restaurant.name,
          description: restaurant.description,
          cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine[0] : restaurant.cuisine,
          price_range: restaurant.price_range,
          rating: restaurant.rating,
          review_count: restaurant.review_count,
          address: restaurant.address,
          phone: restaurant.phone,
          website: restaurant.website,
          menu_url: restaurant.menu_url,
          image_url: restaurant.image_url,
          specialties: restaurant.specialties,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          source_url: restaurant.source_url,
          is_verified: false, // Requires manual verification
        }

        // Check if restaurant already exists (by name and location)
        const { data: existing } = await supabase
          .from('location_restaurants')
          .select('id')
          .eq('location_id', locationId)
          .eq('name', restaurant.name)
          .single()

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('location_restaurants')
            .update({ ...insert, updated_at: new Date().toISOString() })
            .eq('id', existing.id)

          if (error) {
            errors.push(`Failed to update ${restaurant.name}: ${error.message}`)
          } else {
            saved++
            console.log(`✅ Updated: ${restaurant.name}`)
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('location_restaurants')
            .insert(insert)

          if (error) {
            errors.push(`Failed to insert ${restaurant.name}: ${error.message}`)
          } else {
            saved++
            console.log(`✅ Inserted: ${restaurant.name}`)
          }
        }
      } catch (error) {
        errors.push(
          `Error processing ${restaurant.name}: ${error instanceof Error ? error.message : 'Unknown'}`
        )
      }
    }

    return {
      success: saved > 0,
      saved,
      errors,
    }
  } catch (error) {
    console.error('Error saving restaurants:', error)
    return {
      success: false,
      saved: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

/**
 * Crawl and save restaurants for a location
 */
export async function crawlAndSaveRestaurants(
  locationId: string,
  urls: string[],
  config?: Partial<CrawlerConfig>
): Promise<{
  success: boolean
  crawled: number
  saved: number
  errors: string[]
}> {
  console.log(`🚀 Starting restaurant crawl for location: ${locationId}`)
  console.log(`URLs to crawl: ${urls.length}`)

  // Crawl restaurants
  const crawlResult = await crawlRestaurants(urls, config)

  console.log(`📊 Crawl complete:`)
  console.log(`  - Successful: ${crawlResult.stats.successfulRequests}`)
  console.log(`  - Failed: ${crawlResult.stats.failedRequests}`)
  console.log(`  - Duration: ${crawlResult.stats.duration}ms`)

  if (!crawlResult.data || crawlResult.data.length === 0) {
    return {
      success: false,
      crawled: 0,
      saved: 0,
      errors: ['No restaurants found'],
    }
  }

  // Save to database
  const saveResult = await saveRestaurantsToDatabase(locationId, crawlResult.data)

  console.log(`💾 Save complete:`)
  console.log(`  - Saved: ${saveResult.saved}`)
  console.log(`  - Errors: ${saveResult.errors.length}`)

  return {
    success: saveResult.success,
    crawled: crawlResult.data.length,
    saved: saveResult.saved,
    errors: [
      ...(crawlResult.errors || []).map((e) => `Crawl: ${e.error}`),
      ...saveResult.errors,
    ],
  }
}

