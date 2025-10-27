/**
 * Upstash Redis Cache with Performance Tracking
 * 
 * High-performance caching layer with analytics
 */

import { Redis } from '@upstash/redis'
import { performanceTracker } from '@/lib/analytics/performanceTracker'

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/**
 * Cache key prefixes for organization
 */
export const CacheKeys = {
  location: (slug: string) => `location:${slug}`,
  locationSearch: (query: string, limit: number) => `location:search:${query}:${limit}`,
  trip: (tripId: string) => `trip:${tripId}`,
  userTrips: (userId: string) => `user:${userId}:trips`,
  itinerary: (params: string) => `itinerary:${params}`,
  poi: (locationId: string, type: string) => `poi:${locationId}:${type}`,
  weather: (locationId: string) => `weather:${locationId}`,
  images: (locationId: string) => `images:${locationId}`,
}

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 86400,     // 24 hours
  WEEK: 604800,    // 7 days
}

/**
 * Get or set cached value with performance tracking
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CacheTTL.LONG
): Promise<T> {
  const cacheStartTime = Date.now()

  try {
    // Try to get from cache
    const cached = await redis.get<T>(key)
    
    if (cached !== null) {
      const cacheDuration = Date.now() - cacheStartTime
      performanceTracker.trackCacheHit(key, cacheDuration)
      console.log(`✅ Cache HIT: ${key} (${cacheDuration}ms)`)
      return cached
    }

    // Cache miss - fetch fresh data
    const cacheMissDuration = Date.now() - cacheStartTime
    performanceTracker.trackCacheMiss(key, cacheMissDuration)
    console.log(`❌ Cache MISS: ${key} (${cacheMissDuration}ms)`)

    const fetchStartTime = Date.now()
    const data = await fetcher()
    const fetchDuration = Date.now() - fetchStartTime
    
    console.log(`🔍 Fetched fresh data: ${key} (${fetchDuration}ms)`)

    // Store in cache
    await redis.set(key, data, { ex: ttl })
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`)

    return data
  } catch (error) {
    console.error(`❌ Cache error for ${key}:`, error)
    performanceTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      { cacheKey: key }
    )
    
    // Fallback to fetcher on cache error
    return await fetcher()
  }
}

/**
 * Get cached value without fetcher
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const startTime = Date.now()
  
  try {
    const cached = await redis.get<T>(key)
    const duration = Date.now() - startTime
    
    if (cached !== null) {
      performanceTracker.trackCacheHit(key, duration)
      console.log(`✅ Cache HIT: ${key} (${duration}ms)`)
    } else {
      performanceTracker.trackCacheMiss(key, duration)
      console.log(`❌ Cache MISS: ${key} (${duration}ms)`)
    }
    
    return cached
  } catch (error) {
    console.error(`❌ Cache get error for ${key}:`, error)
    performanceTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      { cacheKey: key }
    )
    return null
  }
}

/**
 * Set cached value
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = CacheTTL.LONG
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl })
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`)
  } catch (error) {
    console.error(`❌ Cache set error for ${key}:`, error)
    performanceTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      { cacheKey: key }
    )
  }
}

/**
 * Delete cached value with performance tracking
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key)
    console.log(`🗑️ Deleted cache: ${key}`)
  } catch (error) {
    console.error(`❌ Cache delete error for ${key}:`, error)
    performanceTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      { cacheKey: key }
    )
  }
}

/**
 * Delete multiple cached values
 */
export async function deleteCachedMultiple(keys: string[]): Promise<void> {
  try {
    if (keys.length === 0) return
    await redis.del(...keys)
    console.log(`🗑️ Deleted ${keys.length} cache keys`)
  } catch (error) {
    console.error(`❌ Cache delete multiple error:`, error)
    performanceTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      { cacheKeys: keys }
    )
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number
  memoryUsage: string
}> {
  try {
    const info = await redis.dbsize()
    return {
      totalKeys: info,
      memoryUsage: 'N/A' // Upstash doesn't expose memory usage
    }
  } catch (error) {
    console.error('❌ Error getting cache stats:', error)
    return {
      totalKeys: 0,
      memoryUsage: 'Error'
    }
  }
}

/**
 * Clear all cache (use with caution!)
 */
export async function clearAllCache(): Promise<void> {
  try {
    await redis.flushdb()
    console.log('🗑️ Cleared all cache')
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
    performanceTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      { action: 'clearAllCache' }
    )
  }
}

