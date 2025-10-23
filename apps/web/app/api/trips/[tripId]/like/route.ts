import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { likeRateLimit, applyRateLimit, createRateLimitHeaders } from '@/lib/rate-limit'
import { trackError, trackCriticalError } from '@/lib/error-tracking'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/trips/[tripId]/like
 * Toggle like/unlike for a trip
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, likeRateLimit, user.id)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please slow down.',
          retryAfter: new Date(rateLimitResult.reset).toISOString()
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Verify trip exists
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('trip_likes')
      .select('id')
      .eq('trip_id', params.tripId)
      .eq('user_id', user.id)
      .single()

    let liked = false
    let likeCount = 0

    if (existingLike) {
      // Unlike - delete the like
      const { error: deleteError } = await supabase
        .from('trip_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        trackError('Failed to delete trip like', deleteError, {
          userId: user.id,
          tripId: params.tripId,
          feature: 'likes',
          action: 'unlike'
        })
        return NextResponse.json({ error: 'Failed to unlike trip' }, { status: 500 })
      }

      liked = false
    } else {
      // Like - insert new like
      const { error: insertError } = await supabase
        .from('trip_likes')
        .insert({
          trip_id: params.tripId,
          user_id: user.id
        })

      if (insertError) {
        trackError('Failed to create trip like', insertError, {
          userId: user.id,
          tripId: params.tripId,
          feature: 'likes',
          action: 'like'
        })
        return NextResponse.json({ error: 'Failed to like trip' }, { status: 500 })
      }

      liked = true
    }

    // Get updated like count
    const { count, error: countError } = await supabase
      .from('trip_likes')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', params.tripId)

    if (countError) {
      console.error('Error counting likes:', countError)
    } else {
      likeCount = count || 0
    }

    return NextResponse.json({
      success: true,
      liked,
      likeCount,
      userId: user.id
    })
  } catch (error) {
    trackCriticalError('Unexpected error toggling trip like', error, {
      tripId: params.tripId,
      feature: 'likes',
      action: 'toggle_like'
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/trips/[tripId]/like
 * Get like status and count for a trip
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Get current user (optional for GET)
    const { data: { user } } = await supabase.auth.getUser()

    // Get like count
    const { count, error: countError } = await supabase
      .from('trip_likes')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', params.tripId)

    if (countError) {
      console.error('Error counting likes:', countError)
      return NextResponse.json({ error: 'Failed to get like count' }, { status: 500 })
    }

    let userLiked = false

    // Check if current user liked this trip
    if (user) {
      const { data: existingLike } = await supabase
        .from('trip_likes')
        .select('id')
        .eq('trip_id', params.tripId)
        .eq('user_id', user.id)
        .single()

      userLiked = !!existingLike
    }

    return NextResponse.json({
      likeCount: count || 0,
      userLiked
    })
  } catch (error) {
    console.error('Unexpected error getting like status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

