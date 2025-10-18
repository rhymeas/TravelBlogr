import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { z } from 'zod'

const trackClickSchema = z.object({
  provider: z.string(),
  locationName: z.string(),
  context: z.string().optional(),
  postId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  referrer: z.string().nullable().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional()
})

/**
 * POST /api/affiliate/track-click
 * Track affiliate link clicks for revenue attribution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = trackClickSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()
    
    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    // Get IP address from request
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown'

    // Track the click
    const { data, error } = await supabase.rpc('track_affiliate_click', {
      p_user_id: user?.id || null,
      p_post_id: validation.data.postId || null,
      p_trip_id: validation.data.tripId || null,
      p_provider: validation.data.provider,
      p_location_name: validation.data.locationName,
      p_context: validation.data.context || 'unknown',
      p_click_url: `${validation.data.provider}:${validation.data.locationName}`,
      p_referrer: validation.data.referrer || null,
      p_user_agent: validation.data.userAgent || null,
      p_session_id: validation.data.sessionId || null
    })

    if (error) {
      console.error('Error tracking affiliate click:', error)
      return NextResponse.json(
        { error: 'Failed to track click' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      clickId: data
    })
  } catch (error) {
    console.error('Error in track-click API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

