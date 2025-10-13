import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Force dynamic rendering for location routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/locations/[slug]/comments
 * Get all comments for a location
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()

    // Verify location exists and get ID
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Fetch top-level comments with nested replies
    const { data: comments, error: commentsError } = await supabase
      .from('location_comments')
      .select(`
        id,
        user_id,
        content,
        created_at,
        updated_at,
        profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        replies:location_comments!parent_id (
          id,
          user_id,
          content,
          created_at,
          updated_at,
          profiles!user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('location_id', location.id)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('Unexpected error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/locations/[slug]/comments
 * Create a new comment on a location
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Initialize Supabase client at runtime (not build time)
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

    // Verify location exists and get ID
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('location_comments')
        .select('id, location_id')
        .eq('id', parentId)
        .single()

      if (parentError || !parentComment || parentComment.location_id !== location.id) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('location_comments')
      .insert({
        user_id: user.id,
        location_id: location.id,
        parent_id: parentId || null,
        content: content.trim()
      })
      .select(`
        id,
        user_id,
        content,
        created_at,
        profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .single()

    if (commentError) {
      console.error('Error creating comment:', commentError)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

