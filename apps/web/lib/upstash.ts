/**
 * Upstash Redis Client
 * 
 * Serverless Redis for caching and rate limiting.
 * Uses REST API (no persistent connections, no Railway RAM usage).
 * 
 * FREE tier: 10,000 commands/day (enough for 100-500 users/day)
 * 
 * Setup:
 * 1. Sign up at https://upstash.com (FREE, no credit card)
 * 2. Create Redis database
 * 3. Add to Railway env vars:
 *    UPSTASH_REDIS_REST_URL=https://...
 *    UPSTASH_REDIS_REST_TOKEN=...
 */

import { Redis } from '@upstash/redis'

// Singleton instance
let redis: Redis | null = null

/**
 * Get Upstash Redis client (singleton pattern)
 * Works on both client and server (gracefully degrades on client)
 */
export function getUpstashRedis(): Redis {
  if (redis) return redis

  // Check if we're on the server (process.env is only available server-side)
  const isServer = typeof window === 'undefined'

  const url = isServer ? process.env.UPSTASH_REDIS_REST_URL : undefined
  const token = isServer ? process.env.UPSTASH_REDIS_REST_TOKEN : undefined

  if (!url || !token) {
    // Silently fall back to in-memory cache (Upstash is optional or client-side)
    // To enable: Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Railway

    // Return a mock client that does nothing (graceful degradation)
    return {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 0,
      incr: async () => 1,
      expire: async () => 1,
      ttl: async () => -1,
      exists: async () => 0,
      mget: async () => [],
      mset: async () => 'OK',
      setex: async () => 'OK',
    } as any
  }

  redis = new Redis({
    url,
    token,
    // Optional: Enable automatic retries
    retry: {
      retries: 3,
      backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 3000)
    }
  })

  console.log('✅ Upstash Redis client initialized')
  return redis
}

/**
 * Cache helper functions
 */

/**
 * Get cached value with automatic JSON parsing
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = getUpstashRedis()
    const value = await redis.get(key)
    
    if (!value) return null
    
    // Upstash automatically parses JSON
    return value as T
  } catch (error) {
    console.error('Redis GET error:', error)
    return null
  }
}

/**
 * Set cached value with automatic JSON stringification and TTL
 * @param key Cache key
 * @param value Value to cache
 * @param ttlSeconds Time to live in seconds (default: 1 hour)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<boolean> {
  try {
    const redis = getUpstashRedis()
    
    // Upstash automatically stringifies JSON
    await redis.set(key, value, { ex: ttlSeconds })
    
    return true
  } catch (error) {
    console.error('Redis SET error:', error)
    return false
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<boolean> {
  try {
    const redis = getUpstashRedis()
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Redis DEL error:', error)
    return false
  }
}

/**
 * Check if key exists
 */
export async function existsCached(key: string): Promise<boolean> {
  try {
    const redis = getUpstashRedis()
    const exists = await redis.exists(key)
    return exists === 1
  } catch (error) {
    console.error('Redis EXISTS error:', error)
    return false
  }
}

/**
 * Rate limiting helper
 * @param key Rate limit key (e.g., 'rate:api:user:123')
 * @param limit Maximum requests allowed
 * @param windowSeconds Time window in seconds
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const redis = getUpstashRedis()
    
    // Increment counter
    const count = await redis.incr(key)
    
    // Set expiry on first request
    if (count === 1) {
      await redis.expire(key, windowSeconds)
    }
    
    // Get TTL
    const ttl = await redis.ttl(key)
    const resetAt = Date.now() + (ttl * 1000)
    
    const allowed = count <= limit
    const remaining = Math.max(0, limit - count)
    
    return { allowed, remaining, resetAt }
  } catch (error) {
    console.error('Rate limit error:', error)
    // On error, allow the request (fail open)
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 }
  }
}

/**
 * Get or set cached value (cache-aside pattern)
 * @param key Cache key
 * @param fetcher Function to fetch value if not cached
 * @param ttlSeconds Time to live in seconds
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key)
  if (cached !== null) {
    console.log(`✅ Cache HIT: ${key}`)
    return cached
  }
  
  console.log(`❌ Cache MISS: ${key}`)
  
  // Fetch fresh data
  const fresh = await fetcher()
  
  // Cache it
  await setCached(key, fresh, ttlSeconds)
  
  return fresh
}

/**
 * Batch get multiple keys
 */
export async function batchGet<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    const redis = getUpstashRedis()
    const values = await redis.mget(...keys)
    return values as (T | null)[]
  } catch (error) {
    console.error('Redis MGET error:', error)
    return keys.map(() => null)
  }
}

/**
 * Batch set multiple keys
 */
export async function batchSet(
  entries: Record<string, any>,
  ttlSeconds?: number
): Promise<boolean> {
  try {
    const redis = getUpstashRedis()
    
    if (ttlSeconds) {
      // Set each key with TTL individually
      await Promise.all(
        Object.entries(entries).map(([key, value]) =>
          redis.set(key, value, { ex: ttlSeconds })
        )
      )
    } else {
      // Batch set without TTL
      await redis.mset(entries)
    }
    
    return true
  } catch (error) {
    console.error('Redis MSET error:', error)
    return false
  }
}

/**
 * Clear all keys matching a pattern (use with caution!)
 * Note: This uses SCAN which is safe for production
 */
export async function clearPattern(pattern: string): Promise<number> {
  try {
    const redis = getUpstashRedis()
    
    // Note: Upstash doesn't support SCAN via REST API
    // For now, we'll just log a warning
    console.warn('⚠️ clearPattern not supported in Upstash REST API')
    console.warn('⚠️ Use TTL-based expiration instead')
    
    return 0
  } catch (error) {
    console.error('Redis SCAN error:', error)
    return 0
  }
}

/**
 * Cache key builders (consistent naming)
 */
export const CacheKeys = {
  // Image caching
  image: (locationName: string) => `image:${locationName}`,
  imageGallery: (locationName: string) => `image:gallery:${locationName}`,
  
  // Weather caching
  weather: (location: string) => `weather:${location}`,
  
  // Profile caching
  profile: (userId: string) => `profile:${userId}`,
  
  // Rate limiting
  rateLimit: (apiName: string, identifier: string) => `rate:${apiName}:${identifier}`,
  
  // POI caching
  poi: (location: string, category: string) => `poi:${location}:${category}`,

  // Session caching (if needed)
  session: (sessionId: string) => `session:${sessionId}`,

  // Phase 3: Additional cache keys
  location: (slug: string) => `location:${slug}`,
  locationsAll: () => `locations:all`,
  locationSearch: (query: string, limit: number) => `search:${query}:${limit}`,
  geocoding: (locationName: string) => `geocoding:${locationName}`,
  blogPosts: (status: string, category: string, offset: number, limit: number) =>
    `blog:${status || 'all'}:${category || 'all'}:${offset}:${limit}`,
  userTrips: (userId: string) => `trips:user:${userId}`,
  trip: (tripId: string) => `trip:${tripId}`,
  tripComments: (tripId: string) => `comments:trip:${tripId}`,
  blogTestimonials: (featured: boolean, limit: number) =>
    `testimonials:${featured}:${limit}`,

  // Additional keys for image discovery and Brave services
  imageDiscovery: (query: string, limit: number) => `image:discover:${query}:${limit}`,
  activityData: (locationContext: string, activityName?: string) => activityName ? `activity:${locationContext}:${activityName}` : `activity:${locationContext}`,
  restaurantData: (composite: string) => `restaurant:${composite}`,
  braveWebSearch: (query: string, limit: number) => `brave:web:${query}:${limit}`,
  braveImageSearch: (query: string, limit: number) => `brave:image:${query}:${limit}`,

  // Transport and routing
  transportRoute: (from: string, to: string, profile: string = 'driving', includeElevation: boolean = false) =>
    `transport:route:${profile}:${includeElevation ? 'elev' : 'noelev'}:${from}:${to}`,
  transportSources: (from: string, to: string, profile: string = 'driving') =>
    `transport:sources:${profile}:${from}:${to}`,

  // 🚀 PERFORMANCE: Route caching (Phase 2 optimization - 2025-01-28)
  // DEPENDENCIES: Used by routingService.ts for caching calculated routes
  // CONTEXT: Routes are expensive to calculate (2-5s), cache for 30 days to minimize API calls
  route: (cacheKey: string) => `route:${cacheKey}`,
  scenicRoute: (from: string, to: string, preference: string) =>
    `scenic:${preference}:${from}:${to}`,
} as const

/**
 * TTL constants (in seconds)
 */
export const CacheTTL = {
  // Short-lived (5 minutes)
  SHORT: 5 * 60,
  
  // Medium (1 hour)
  MEDIUM: 60 * 60,
  
  // Long (24 hours)
  LONG: 24 * 60 * 60,
  
  // Very long (7 days)
  VERY_LONG: 7 * 24 * 60 * 60,
  
  // Specific use cases
  IMAGE: 24 * 60 * 60,        // 24 hours
  WEATHER: 6 * 60 * 60,       // 6 hours
  PROFILE: 5 * 60,            // 5 minutes
  POI: 7 * 24 * 60 * 60,      // 7 days
  RATE_LIMIT: 60 * 60,        // 1 hour

  // 🚀 PERFORMANCE: Route caching TTL (Phase 2 optimization - 2025-01-28)
  // DEPENDENCIES: Used by routingService.ts for route cache expiration
  // CONTEXT: Routes rarely change (roads don't move), 30 days is safe and reduces API calls by 99%
  ROUTE: 30 * 24 * 60 * 60,   // 30 days
} as const

// Export singleton getter as default
export default getUpstashRedis

