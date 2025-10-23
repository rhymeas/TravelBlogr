import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { likeRateLimit, applyRateLimit, createRateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/activities/[activityId]/like
 * Toggle like/unlike for an activity feed post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { activityId: string } }
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

    // Verify activity exists
    const { data: activity, error: activityError } = await supabase
      .from('activity_feed')
      .select('id')
      .eq('id', params.activityId)
      .single()

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('activity_likes')
      .select('id')
      .eq('activity_id', params.activityId)
      .eq('user_id', user.id)
      .single()

    let liked = false
    let likeCount = 0

    if (existingLike) {
      // Unlike - delete the like
      const { error: deleteError } = await supabase
        .from('activity_likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error deleting like:', deleteError)
        return NextResponse.json({ error: 'Failed to unlike activity' }, { status: 500 })
      }

      liked = false
    } else {
      // Like - insert new like
      const { error: insertError } = await supabase
        .from('activity_likes')
        .insert({
          activity_id: params.activityId,
          user_id: user.id
        })

      if (insertError) {
        console.error('Error creating like:', insertError)
        return NextResponse.json({ error: 'Failed to like activity' }, { status: 500 })
      }

      liked = true
    }

    // Get updated like count
    const { count, error: countError } = await supabase
      .from('activity_likes')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', params.activityId)

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
    console.error('Unexpected error toggling like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/activities/[activityId]/like
 * Get like status and count for an activity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Get current user (optional for GET)
    const { data: { user } } = await supabase.auth.getUser()

    // Get like count
    const { count, error: countError } = await supabase
      .from('activity_likes')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', params.activityId)

    if (countError) {
      console.error('Error counting likes:', countError)
      return NextResponse.json({ error: 'Failed to get like count' }, { status: 500 })
    }

    let userLiked = false

    // Check if current user liked this activity
    if (user) {
      const { data: existingLike } = await supabase
        .from('activity_likes')
        .select('id')
        .eq('activity_id', params.activityId)
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

