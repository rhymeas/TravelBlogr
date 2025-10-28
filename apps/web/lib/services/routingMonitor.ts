/**
 * Routing API Usage Monitor
 * 
 * Tracks Valhalla/Stadia Maps API usage to ensure we stay within free tier limits.
 * 
 * FREE TIER LIMITS:
 * - Stadia Maps: 10,000 routes/month (200,000 credits, 20 credits per route)
 * - Local Valhalla: Unlimited
 */

import { createClient } from '@/lib/supabase/server'

export interface RoutingUsageStats {
  month: string // YYYY-MM format
  total_requests: number
  valhalla_requests: number
  stadia_requests: number
  osrm_requests: number
  last_updated: string
}

const STADIA_MAPS_MONTHLY_LIMIT = 10000 // Free tier limit

/**
 * Track a routing API request
 */
export async function trackRoutingRequest(
  provider: 'valhalla' | 'stadia' | 'osrm' | 'ors',
  userId?: string
): Promise<void> {
  try {
    const supabase = createClient()
    const month = getCurrentMonth()

    // Increment usage counter
    const { error } = await supabase.rpc('increment_routing_usage', {
      p_month: month,
      p_provider: provider,
      p_user_id: userId
    })

    if (error) {
      console.error('Failed to track routing request:', error)
    }
  } catch (error) {
    console.error('Error tracking routing request:', error)
  }
}

/**
 * Get current month's usage stats
 */
export async function getRoutingUsage(): Promise<RoutingUsageStats | null> {
  try {
    const supabase = createClient()
    const month = getCurrentMonth()

    const { data, error } = await supabase
      .from('routing_usage')
      .select('*')
      .eq('month', month)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Failed to get routing usage:', error)
      return null
    }

    return data || {
      month,
      total_requests: 0,
      valhalla_requests: 0,
      stadia_requests: 0,
      osrm_requests: 0,
      last_updated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error getting routing usage:', error)
    return null
  }
}

/**
 * Check if we're within Stadia Maps free tier limit
 */
export async function isWithinStadiaLimit(): Promise<boolean> {
  const usage = await getRoutingUsage()
  if (!usage) return true // Allow if we can't check

  return usage.stadia_requests < STADIA_MAPS_MONTHLY_LIMIT
}

/**
 * Get remaining Stadia Maps requests for current month
 */
export async function getStadiaRemainingRequests(): Promise<number> {
  const usage = await getRoutingUsage()
  if (!usage) return STADIA_MAPS_MONTHLY_LIMIT

  return Math.max(0, STADIA_MAPS_MONTHLY_LIMIT - usage.stadia_requests)
}

/**
 * Get usage percentage for Stadia Maps
 */
export async function getStadiaUsagePercentage(): Promise<number> {
  const usage = await getRoutingUsage()
  if (!usage) return 0

  return Math.min(100, (usage.stadia_requests / STADIA_MAPS_MONTHLY_LIMIT) * 100)
}

/**
 * Get all-time routing usage stats
 */
export async function getAllRoutingUsage(): Promise<RoutingUsageStats[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('routing_usage')
      .select('*')
      .order('month', { ascending: false })
      .limit(12) // Last 12 months

    if (error) {
      console.error('Failed to get all routing usage:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting all routing usage:', error)
    return []
  }
}

/**
 * Helper: Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Helper: Check if we should use Stadia Maps or fallback to local Valhalla
 */
export async function shouldUseStadiaMaps(): Promise<boolean> {
  // If no Stadia API key, use local Valhalla
  if (!process.env.STADIA_MAPS_API_KEY) {
    return false
  }

  // Check if we're within free tier limit
  const withinLimit = await isWithinStadiaLimit()
  
  if (!withinLimit) {
    console.warn('⚠️ Stadia Maps monthly limit reached, falling back to local Valhalla')
  }

  return withinLimit
}

