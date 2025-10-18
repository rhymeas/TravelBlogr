/**
 * Credit Service - Client-side functions
 *
 * Manages user credits for AI itinerary generation.
 * Credits can be purchased or used as fallback when free tier limit is reached.
 *
 * For server-side functions, use creditService.server.ts
 */

import { getBrowserSupabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// Free tier limits per month
export const FREE_TIER_MONTHLY_LIMIT_UNAUTH = 3      // Unauthenticated: 3 free plannings
export const FREE_TIER_MONTHLY_LIMIT_AUTH = 20       // Authenticated: 20 free plannings
export const FREE_TIER_MONTHLY_LIMIT_PRO = 5         // Pro mode: 5 free plannings

// Cost per planning (in cents)
export const COST_PER_PLANNING_CENTS = 50             // $0.50 per planning
export const COST_PER_PLANNING_WITH_CREDITS_CENTS = 25 // $0.25 per planning with credits

export interface UserCredits {
  user_id: string
  credits_remaining: number
  credits_purchased: number
  credits_used: number
  last_purchase_date?: string
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'usage' | 'bonus' | 'refund'
  description: string
  stripe_payment_id?: string
  metadata?: Record<string, any>
  created_at: string
}

/**
 * Get user's credit balance (client-side)
 * @param userId - User ID
 */
export async function getUserCredits(userId: string): Promise<number> {
  const supabase = getBrowserSupabase()

  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_remaining')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user credits:', error)
    return 0
  }

  return data?.credits_remaining || 0
}

/**
 * Get full credit details for a user (client-side)
 */
export async function getUserCreditDetails(userId: string): Promise<UserCredits | null> {
  const supabase = getBrowserSupabase()

  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching credit details:', error)
    return null
  }

  return data as UserCredits
}

/**
 * Check if user has enough credits
 */
export async function hasCredits(userId: string, required: number = 1): Promise<boolean> {
  const credits = await getUserCredits(userId)
  return credits >= required
}

// NOTE: useCredit, addCredits, incrementAIUsage, and getCreditTransactions
// have been moved to creditService.server.ts for server-side use only

/**
 * Get user's monthly AI usage count (client-side)
 * @param userId - User ID
 */
export async function getMonthlyAIUsage(userId: string): Promise<number> {
  const supabase = getBrowserSupabase()
  
  try {
    const { data, error } = await supabase.rpc('get_current_month_usage', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Error fetching monthly usage:', error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error('Exception fetching monthly usage:', error)
    return 0
  }
}

/**
 * Check if user can generate AI itinerary
 * Returns { allowed: true } if user can generate
 * Returns { allowed: false, reason, needsCredits } if blocked
 *
 * Note: This only checks if generation is allowed.
 * The modal is only shown when user tries to SAVE the plan to their account.
 */
export async function canGenerateAI(userId: string, proMode: boolean = false): Promise<{
  allowed: boolean
  reason?: string
  needsCredits?: boolean
  remainingFree?: number
  credits?: number
  freeLimit?: number
}> {
  // Get monthly usage
  const monthlyUsage = await getMonthlyAIUsage(userId)

  // Determine free tier limit based on pro mode
  const freeLimit = proMode ? FREE_TIER_MONTHLY_LIMIT_PRO : FREE_TIER_MONTHLY_LIMIT_AUTH

  // Check if within free tier
  if (monthlyUsage < freeLimit) {
    return {
      allowed: true,
      remainingFree: freeLimit - monthlyUsage,
      freeLimit,
    }
  }

  // Free tier exhausted, check credits
  const credits = await getUserCredits(userId)

  if (credits < 1) {
    return {
      allowed: false,
      reason: `You've used all ${freeLimit} free AI generations this month. Purchase credits to continue!`,
      needsCredits: true,
      credits: 0,
      freeLimit,
    }
  }

  // Has credits
  return {
    allowed: true,
    credits,
    freeLimit,
  }
}

/**
 * Get credit usage statistics
 */
export async function getCreditStats(userId: string): Promise<{
  totalPurchased: number
  totalUsed: number
  remaining: number
  lastPurchaseDate?: string
  monthlyUsage: number
  remainingFree: number
}> {
  const [details, monthlyUsage] = await Promise.all([
    getUserCreditDetails(userId),
    getMonthlyAIUsage(userId),
  ])

  return {
    totalPurchased: details?.credits_purchased || 0,
    totalUsed: details?.credits_used || 0,
    remaining: details?.credits_remaining || 0,
    lastPurchaseDate: details?.last_purchase_date,
    monthlyUsage,
    remainingFree: Math.max(0, FREE_TIER_MONTHLY_LIMIT_AUTH - monthlyUsage),
  }
}

