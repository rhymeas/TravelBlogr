/**
 * Smart Data Handler
 * 
 * Intelligent data management for POI and trip data at scale:
 * 1. Smart caching - leverage already-requested data
 * 2. Batch processing - small batches to avoid API overheat
 * 3. Data compression - keep storage costs low
 * 4. Progressive loading - fast initial response
 * 5. Deduplication - avoid redundant API calls
 * 
 * RULES:
 * - NEVER fetch same data twice in same session
 * - ALWAYS check cache before external API
 * - ALWAYS compress before storing in database
 * - ALWAYS use small batches (max 10 items at a time)
 * - ALWAYS track API usage to avoid rate limits
 */

import { createServiceSupabase } from '@/lib/supabase-server'
import { getBrowserSupabase } from '@/lib/supabase'
import { getCached, setCached, checkRateLimit, CacheKeys } from '@/lib/upstash'

// DEPRECATED: Replaced with Upstash Redis for persistent caching
// const sessionCache = new Map<string, { data: any; timestamp: number }>()
// const apiUsage = new Map<string, { count: number; resetAt: number }>()

// Cache expiry times (in milliseconds)
const CACHE_EXPIRY = {
  pois: 7 * 24 * 60 * 60 * 1000,        // 7 days
  locations: 30 * 24 * 60 * 60 * 1000,  // 30 days
  images: 14 * 24 * 60 * 60 * 1000,     // 14 days
  groqValidation: 3 * 24 * 60 * 60 * 1000, // 3 days
  groqGapFill: 1 * 24 * 60 * 60 * 1000,  // 1 day
  groq_gaps: 1 * 24 * 60 * 60 * 1000,    // 1 day
  groq_gap_fill: 1 * 24 * 60 * 60 * 1000, // 1 day
  groq_strategy: 7 * 24 * 60 * 60 * 1000  // 7 days
}

// API rate limits (per hour)
const RATE_LIMITS = {
  opentripmap: 1000,
  foursquare: 950,
  yelp: 5000,
  groq: 6000,
  wikidata: 10000, // No official limit, be conservative
  nominatim: 3600  // 1 per second = 3600 per hour
}

export interface CacheOptions {
  type: keyof typeof CACHE_EXPIRY
  key: string
  useServerClient?: boolean
}

export interface BatchOptions {
  batchSize: number
  delayMs: number
  onProgress?: (current: number, total: number) => void
}

/**
 * LAYER 1: Upstash Redis Cache (persistent, fast < 10ms)
 */
export async function getFromUpstashCache<T>(key: string): Promise<T | null> {
  return await getCached<T>(key)
}

export async function setInUpstashCache<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
  await setCached(key, data, ttlSeconds)
}

// DEPRECATED: Replaced with Upstash Redis
// export function getFromSessionCache<T>(key: string): T | null {
//   const cached = sessionCache.get(key)
//   if (!cached) return null
//
//   // Check if expired (session cache expires after 5 minutes)
//   if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
//     sessionCache.delete(key)
//     return null
//   }
//
//   return cached.data as T
// }
//
// export function setInSessionCache<T>(key: string, data: T): void {
//   sessionCache.set(key, { data, timestamp: Date.now() })
// }

/**
 * LAYER 2: Database Cache (persistent, fast)
 */
export async function getFromDatabaseCache<T>(
  options: CacheOptions
): Promise<T | null> {
  const { type, key, useServerClient = false } = options
  const supabase = useServerClient ? createServiceSupabase() : getBrowserSupabase()
  
  // Check Upstash cache first (fast < 10ms)
  const upstashData = await getFromUpstashCache<T>(key)
  if (upstashData) {
    console.log(`✅ Upstash cache hit: ${key} (< 10ms)`)
    return upstashData
  }

  // Check database cache (slower 100-200ms)
  const { data, error } = await supabase
    .from('external_api_cache')
    .select('*')
    .eq('location_name', key)
    .eq('api_source', type)
    .single()

  if (error || !data) return null

  // Check if expired
  const age = Date.now() - new Date(data.updated_at).getTime()
  if (age > CACHE_EXPIRY[type]) {
    console.log(`⏰ Cache expired: ${key} (${Math.round(age / (24 * 60 * 60 * 1000))} days old)`)
    return null
  }

  console.log(`✅ Database cache hit: ${key}`)

  // Store in Upstash for faster subsequent access
  const ttl = CACHE_EXPIRY[type] / 1000 // Convert to seconds
  await setInUpstashCache(key, data.data, ttl)

  return data.data as T
}

export async function setInDatabaseCache<T>(
  options: CacheOptions,
  data: T
): Promise<void> {
  const { type, key, useServerClient = false } = options
  const supabase = useServerClient ? createServiceSupabase() : getBrowserSupabase()

  // Store in Upstash cache (fast future lookups)
  const ttl = CACHE_EXPIRY[type] / 1000 // Convert to seconds
  await setInUpstashCache(key, data, ttl)

  // Store in database cache (backup)
  await supabase
    .from('external_api_cache')
    .upsert({
      location_name: key,
      api_source: type,
      data: data as any,
      updated_at: new Date().toISOString()
    })
  
  console.log(`💾 Cached in database: ${key}`)
}

/**
 * LAYER 3: API Rate Limiting (using Upstash Redis)
 */
export async function checkApiRateLimit(apiName: keyof typeof RATE_LIMITS): Promise<boolean> {
  const limit = RATE_LIMITS[apiName]
  const windowSeconds = 3600 // 1 hour

  const { allowed, remaining } = await checkRateLimit(
    CacheKeys.rateLimit(apiName, 'global'),
    limit,
    windowSeconds
  )

  if (!allowed) {
    console.warn(`⚠️ Rate limit reached for ${apiName}: 0/${limit} remaining`)
    return false
  }

  console.log(`✅ Rate limit OK for ${apiName}: ${remaining}/${limit} remaining`)
  return true
}

// DEPRECATED: Replaced with Upstash Redis checkApiRateLimit
// export function incrementRateLimit(apiName: keyof typeof RATE_LIMITS): void {
//   const usage = apiUsage.get(apiName)
//   if (usage) {
//     usage.count++
//   }
// }

/**
 * LAYER 4: Batch Processing
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchOptions
): Promise<R[]> {
  const { batchSize, delayMs, onProgress } = options
  const results: R[] = []
  
  console.log(`📦 Processing ${items.length} items in batches of ${batchSize}`)
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    )
    
    results.push(...batchResults)
    
    // Report progress
    if (onProgress) {
      onProgress(i + batch.length, items.length)
    }
    
    // Delay between batches to avoid API overheat
    if (i + batchSize < items.length) {
      console.log(`⏸️ Waiting ${delayMs}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  console.log(`✅ Batch processing complete: ${results.length} items`)
  return results
}

/**
 * LAYER 5: Data Compression
 */
export function compressForStorage<T extends object>(
  data: T,
  maxFields: number = 10
): Partial<T> {
  // Keep only essential fields (first N fields)
  const entries = Object.entries(data).slice(0, maxFields)
  return Object.fromEntries(entries) as Partial<T>
}

export function compressArray<T>(
  array: T[],
  maxItems: number = 20,
  sortBy?: (a: T, b: T) => number
): T[] {
  if (sortBy) {
    return array.sort(sortBy).slice(0, maxItems)
  }
  return array.slice(0, maxItems)
}

/**
 * LAYER 6: Deduplication
 */
export function deduplicateByKey<T>(
  items: T[],
  keyExtractor: (item: T) => string
): T[] {
  const seen = new Set<string>()
  return items.filter(item => {
    const key = keyExtractor(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * LAYER 7: Smart Fetcher (combines all layers)
 */
export async function smartFetch<T>(
  key: string,
  cacheType: keyof typeof CACHE_EXPIRY,
  fetcher: () => Promise<T>,
  options: {
    useServerClient?: boolean
    skipCache?: boolean
    apiName?: keyof typeof RATE_LIMITS
  } = {}
): Promise<T> {
  const { useServerClient = false, skipCache = false, apiName } = options
  
  // STEP 1: Check cache (unless skipCache is true)
  if (!skipCache) {
    const cached = await getFromDatabaseCache<T>({
      type: cacheType,
      key,
      useServerClient
    })
    
    if (cached) return cached
  }
  
  // STEP 2: Check rate limit (if API name provided)
  if (apiName) {
    const allowed = await checkApiRateLimit(apiName)
    if (!allowed) {
      throw new Error(`Rate limit exceeded for ${apiName}`)
    }
  }

  // STEP 3: Fetch fresh data
  console.log(`📡 Fetching fresh data: ${key}`)
  const data = await fetcher()

  // STEP 4: Cache the result (database + Upstash)
  await setInDatabaseCache({ type: cacheType, key, useServerClient }, data)

  // Also cache in Upstash for fast future lookups
  const ttl = CACHE_EXPIRY[cacheType] / 1000 // Convert to seconds
  await setInUpstashCache(key, data, ttl)

  return data
}

/**
 * LAYER 8: Progressive Loading
 */
export interface ProgressiveData<T> {
  immediate: T[]      // Data available immediately (from cache)
  enhanced: T[]       // Data from external APIs (slower)
  validated: T[]      // Data validated by GROQ (slowest)
  loading: boolean
  progress: number    // 0-100
}

export async function loadProgressively<T>(
  key: string,
  loaders: {
    immediate: () => Promise<T[]>
    enhanced?: () => Promise<T[]>
    validated?: () => Promise<T[]>
  },
  onUpdate: (data: ProgressiveData<T>) => void
): Promise<void> {
  const result: ProgressiveData<T> = {
    immediate: [],
    enhanced: [],
    validated: [],
    loading: true,
    progress: 0
  }
  
  // STEP 1: Load immediate data (cache)
  result.immediate = await loaders.immediate()
  result.progress = 33
  onUpdate({ ...result })
  
  // STEP 2: Load enhanced data (external APIs)
  if (loaders.enhanced) {
    result.enhanced = await loaders.enhanced()
    result.progress = 66
    onUpdate({ ...result })
  }
  
  // STEP 3: Load validated data (GROQ)
  if (loaders.validated) {
    result.validated = await loaders.validated()
    result.progress = 100
    result.loading = false
    onUpdate({ ...result })
  } else {
    result.progress = 100
    result.loading = false
    onUpdate({ ...result })
  }
}

/**
 * LAYER 9: Storage Size Monitoring
 */
export async function getStorageStats(useServerClient = false): Promise<{
  totalSize: number
  itemCount: number
  oldestEntry: Date
  newestEntry: Date
}> {
  const supabase = useServerClient ? createServiceSupabase() : getBrowserSupabase()
  
  const { data, error } = await supabase
    .from('external_api_cache')
    .select('data, created_at, updated_at')
  
  if (error || !data) {
    return { totalSize: 0, itemCount: 0, oldestEntry: new Date(), newestEntry: new Date() }
  }
  
  const totalSize = data.reduce((sum, item) => {
    return sum + JSON.stringify(item.data).length
  }, 0)
  
  const dates = data.map(item => new Date(item.created_at))
  
  return {
    totalSize,
    itemCount: data.length,
    oldestEntry: new Date(Math.min(...dates.map(d => d.getTime()))),
    newestEntry: new Date(Math.max(...dates.map(d => d.getTime())))
  }
}

/**
 * LAYER 10: Cache Cleanup
 */
export async function cleanupExpiredCache(useServerClient = false): Promise<number> {
  const supabase = useServerClient ? createServiceSupabase() : getBrowserSupabase()
  
  const cutoffDate = new Date(Date.now() - Math.max(...Object.values(CACHE_EXPIRY)))
  
  const { data, error } = await supabase
    .from('external_api_cache')
    .delete()
    .lt('updated_at', cutoffDate.toISOString())
    .select()
  
  if (error) {
    console.error('Cache cleanup error:', error)
    return 0
  }
  
  console.log(`🧹 Cleaned up ${data?.length || 0} expired cache entries`)
  return data?.length || 0
}

