import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get coupon code from request
    const { code } = await request.json()
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Coupon code is required' },
        { status: 400 }
      )
    }
    
    // Call the redeem_coupon function
    const { data, error } = await supabase.rpc('redeem_coupon', {
      p_user_id: user.id,
      p_coupon_code: code.trim().toUpperCase()
    })
    
    if (error) {
      console.error('Error redeeming coupon:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to redeem coupon' },
        { status: 500 }
      )
    }
    
    // The function returns a JSON object
    const result = data as {
      success: boolean
      error?: string
      type?: string
      credits_granted?: number
      unlimited_until?: string
      description?: string
    }
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to redeem coupon' },
        { status: 400 }
      )
    }
    
    // Return success with details
    return NextResponse.json({
      success: true,
      type: result.type,
      creditsGranted: result.credits_granted,
      unlimitedUntil: result.unlimited_until,
      description: result.description
    })
    
  } catch (error) {
    console.error('Error in coupon redemption:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

