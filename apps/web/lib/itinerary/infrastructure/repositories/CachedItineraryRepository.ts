/**
 * Cached Itinerary Repository
 * Manages database-backed caching of Groq AI-generated itineraries
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Helper function to create Supabase client at runtime
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export interface CacheKey {
  fromLocation: string
  toLocation: string
  stops: string[]
  totalDays: number
  interests: string[]
  budget: string
}

export interface CachedItinerary {
  id: string
  cacheKey: string
  fromLocation: string
  toLocation: string
  stops: string[]
  totalDays: number
  interests: string[]
  budget: string
  planData: any
  createdAt: Date
  lastUsedAt: Date
  usageCount: number
}

export class CachedItineraryRepository {
  private supabase: SupabaseClient
  private readonly CACHE_EXPIRATION_DAYS = 30
  private readonly DATE_RANGE_TOLERANCE_DAYS = 2

  constructor() {
    // Initialize Supabase client at runtime (not at module level)
    this.supabase = getSupabaseClient()
  }

  /**
   * Generate a deterministic cache key from request parameters
   */
  generateCacheKey(params: CacheKey): string {
    // Normalize parameters for consistent hashing
    const normalized = {
      from: params.fromLocation.toLowerCase().trim(),
      to: params.toLocation.toLowerCase().trim(),
      stops: params.stops.map(s => s.toLowerCase().trim()).sort(),
      days: params.totalDays,
      interests: params.interests.map(i => i.toLowerCase().trim()).sort(),
      budget: params.budget.toLowerCase().trim()
    }

    // Create deterministic string
    const keyString = JSON.stringify(normalized)
    
    // Generate SHA-256 hash
    return crypto.createHash('sha256').update(keyString).digest('hex')
  }

  /**
   * Find cached itinerary by exact match
   */
  async findByExactMatch(params: CacheKey): Promise<CachedItinerary | null> {
    const cacheKey = this.generateCacheKey(params)
    
    console.log(`🔍 Looking for cached itinerary with key: ${cacheKey.substring(0, 16)}...`)

    const { data, error } = await this.supabase
      .from('cached_itineraries')
      .select('*')
      .eq('cache_key', cacheKey)
      .eq('is_active', true)
      .gte('created_at', new Date(Date.now() - this.CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - cache miss
        console.log('❌ Cache miss: No exact match found')
        return null
      }
      console.error('Error fetching cached itinerary:', error)
      return null
    }

    if (data) {
      console.log(`✅ Cache hit! Plan used ${data.usage_count} times, created ${new Date(data.created_at).toLocaleDateString()}`)
      
      // Update usage stats
      await this.incrementUsage(data.id)

      return this.mapToEntity(data)
    }

    return null
  }

  /**
   * Find similar cached itinerary (fuzzy match)
   * Allows ±2 days tolerance on date range
   */
  async findSimilar(params: CacheKey): Promise<CachedItinerary | null> {
    console.log(`🔍 Looking for similar cached itinerary...`)

    const minDays = params.totalDays - this.DATE_RANGE_TOLERANCE_DAYS
    const maxDays = params.totalDays + this.DATE_RANGE_TOLERANCE_DAYS

    const { data, error } = await this.supabase
      .from('cached_itineraries')
      .select('*')
      .eq('from_location', params.fromLocation)
      .eq('to_location', params.toLocation)
      .eq('budget', params.budget)
      .gte('total_days', minDays)
      .lte('total_days', maxDays)
      .eq('is_active', true)
      .gte('created_at', new Date(Date.now() - this.CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString())
      .order('usage_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error finding similar cached itinerary:', error)
      return null
    }

    if (data && data.length > 0) {
      const cached = data[0]
      
      // Check if interests match (at least 50% overlap)
      const cachedInterests = cached.interests || []
      const requestInterests = params.interests || []
      const matchingInterests = cachedInterests.filter((i: string) => 
        requestInterests.includes(i)
      ).length
      const interestMatchRatio = requestInterests.length > 0 
        ? matchingInterests / requestInterests.length 
        : 1

      if (interestMatchRatio >= 0.5) {
        console.log(`✅ Similar cache found! Days: ${cached.total_days} (requested: ${params.totalDays}), Interest match: ${Math.round(interestMatchRatio * 100)}%`)
        
        // Update usage stats
        await this.incrementUsage(cached.id)

        return this.mapToEntity(cached)
      }
    }

    console.log('❌ No similar cache found')
    return null
  }

  /**
   * Save new cached itinerary
   */
  async save(params: CacheKey, planData: any): Promise<CachedItinerary | null> {
    const cacheKey = this.generateCacheKey(params)
    
    console.log(`💾 Saving new cached itinerary with key: ${cacheKey.substring(0, 16)}...`)

    const { data, error } = await this.supabase
      .from('cached_itineraries')
      .insert({
        cache_key: cacheKey,
        from_location: params.fromLocation,
        to_location: params.toLocation,
        stops: params.stops,
        total_days: params.totalDays,
        interests: params.interests,
        budget: params.budget,
        plan_data: planData,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        usage_count: 1,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      // Check if it's a duplicate key error
      if (error.code === '23505') {
        console.log('⚠️ Cache entry already exists, fetching existing...')
        return await this.findByExactMatch(params)
      }
      console.error('Error saving cached itinerary:', error)
      return null
    }

    console.log(`✅ Cached itinerary saved successfully`)
    return this.mapToEntity(data)
  }

  /**
   * Increment usage count and update last_used_at
   */
  private async incrementUsage(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('cached_itineraries')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: this.supabase.rpc('increment', { row_id: id })
      })
      .eq('id', id)

    // Fallback: manual increment if RPC fails
    if (error) {
      const { data } = await this.supabase
        .from('cached_itineraries')
        .select('usage_count')
        .eq('id', id)
        .single()

      if (data) {
        await this.supabase
          .from('cached_itineraries')
          .update({
            last_used_at: new Date().toISOString(),
            usage_count: data.usage_count + 1
          })
          .eq('id', id)
      }
    }
  }

  /**
   * Invalidate (soft delete) a cached itinerary
   */
  async invalidate(cacheKey: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('cached_itineraries')
      .update({ is_active: false })
      .eq('cache_key', cacheKey)

    return !error
  }

  /**
   * Clean up old cache entries
   */
  async cleanupOldEntries(): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('cleanup_old_cached_itineraries')

    if (error) {
      console.error('Error cleaning up old cache entries:', error)
      return 0
    }

    console.log(`🧹 Cleaned up ${data} old cache entries`)
    return data
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    const { data, error } = await this.supabase
      .from('cached_itineraries_stats')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching cache stats:', error)
      return null
    }

    return data
  }

  /**
   * Map database row to entity
   */
  private mapToEntity(data: any): CachedItinerary {
    return {
      id: data.id,
      cacheKey: data.cache_key,
      fromLocation: data.from_location,
      toLocation: data.to_location,
      stops: data.stops || [],
      totalDays: data.total_days,
      interests: data.interests || [],
      budget: data.budget,
      planData: data.plan_data,
      createdAt: new Date(data.created_at),
      lastUsedAt: new Date(data.last_used_at),
      usageCount: data.usage_count
    }
  }
}

// Lazy singleton instance - only created when first accessed (runtime, not build time)
let _cachedItineraryRepositoryInstance: CachedItineraryRepository | null = null

export function getCachedItineraryRepository(): CachedItineraryRepository {
  if (!_cachedItineraryRepositoryInstance) {
    _cachedItineraryRepositoryInstance = new CachedItineraryRepository()
  }
  return _cachedItineraryRepositoryInstance
}

// For backwards compatibility, export as named export
// But this will now be a getter function, not a direct instance
export const cachedItineraryRepository = {
  get instance() {
    return getCachedItineraryRepository()
  }
}
