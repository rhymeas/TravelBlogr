/**
 * Credit Service - Server-side only functions
 * 
 * These functions use createServerSupabase and can only be called from server components or API routes.
 */

import { createServerSupabase } from '@/lib/supabase-server'

/**
 * Get user's credit details (server-side only)
 */
export async function getUserCreditDetailsServer(userId: string) {
  const supabase = await createServerSupabase()
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user credit details:', error)
    return null
  }

  return data
}

/**
 * Use credits (server-side only)
 */
export async function useCreditServer(
  userId: string,
  amount: number = 1,
  description: string = 'AI itinerary generation'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase()
  
  try {
    const { data, error } = await supabase.rpc('use_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description
    })

    if (error) {
      console.error('Error using credits:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error using credits:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Add credits (server-side only)
 */
export async function addCreditsServer(
  userId: string,
  amount: number,
  type: 'purchase' | 'bonus' = 'purchase',
  stripePaymentId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase()
  
  try {
    const { error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_stripe_payment_id: stripePaymentId
    })

    if (error) {
      console.error('Error adding credits:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error adding credits:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Increment AI usage (server-side only)
 */
export async function incrementAIUsageServer(userId: string): Promise<number> {
  const supabase = await createServerSupabase()
  
  try {
    const { data, error } = await supabase.rpc('increment_monthly_usage', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Error incrementing AI usage:', error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error('Error incrementing AI usage:', error)
    return 0
  }
}

/**
 * Get credit transactions (server-side only)
 */
export async function getCreditTransactionsServer(
  userId: string,
  limit: number = 50
) {
  const supabase = await createServerSupabase()
  
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching credit transactions:', error)
    return []
  }

  return data || []
}

