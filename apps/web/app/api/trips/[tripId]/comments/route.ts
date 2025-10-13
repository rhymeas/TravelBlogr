import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/trips/[tripId]/comments
 * Get all comments for a trip
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Fetch comments with user information
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        replies:comments!parent_id (
          *,
          user:profiles!user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('trip_id', params.tripId)
      .is('parent_id', null) // Only get top-level comments
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('Unexpected error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/trips/[tripId]/comments
 * Create a new comment on a trip
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

    const body = await request.json()
    const { content, parentId } = body

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 })
    }

    // Verify trip exists and is accessible
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, status, user_id')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check if trip is public or user owns it
    const isPublic = trip.status === 'published'
    const isOwner = trip.user_id === user.id

    if (!isPublic && !isOwner) {
      return NextResponse.json(
        { error: 'You cannot comment on this trip' },
        { status: 403 }
      )
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, trip_id')
        .eq('id', parentId)
        .single()

      if (parentError || !parentComment || parentComment.trip_id !== params.tripId) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from('comments')
      .insert({
        trip_id: params.tripId,
        user_id: user.id,
        parent_id: parentId || null,
        content: content.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        user:profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .single()

    if (createError) {
      console.error('Error creating comment:', createError)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Create notification for trip owner (if not commenting on own trip)
    if (trip.user_id !== user.id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: trip.user_id,
          type: 'comment',
          title: 'New Comment',
          message: `${comment.user?.full_name || 'Someone'} commented on your trip`,
          data: {
            trip_id: params.tripId,
            comment_id: comment.id,
            commenter_id: user.id
          }
        })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

