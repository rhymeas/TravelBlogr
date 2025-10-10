import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

/**
 * GET /api/posts/[postId]/comments
 * Get all comments for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = createServerSupabase()

    // Verify post exists and is accessible
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id, trip_id, trips!inner(status, user_id)')
      .eq('id', params.postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if post is accessible (public trip or user owns it)
    const { data: { user } } = await supabase.auth.getUser()
    const tripStatus = (post.trips as any).status
    const tripOwnerId = (post.trips as any).user_id
    
    const isPublic = tripStatus === 'published'
    const isOwner = user && (tripOwnerId === user.id || post.user_id === user.id)

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: 'Post not accessible' }, { status: 403 })
    }

    // Fetch top-level comments with nested replies
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        user_id,
        content,
        created_at,
        updated_at,
        user:profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        replies:comments!parent_id (
          id,
          user_id,
          content,
          created_at,
          updated_at,
          user:profiles!user_id (
            id,
            full_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('post_id', params.postId)
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
 * POST /api/posts/[postId]/comments
 * Create a new comment on a post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = createServerSupabase()
    
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

    // Verify post exists and is accessible
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id, trip_id, trips!inner(status, user_id)')
      .eq('id', params.postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if post is accessible (public trip or user owns it)
    const tripStatus = (post.trips as any).status
    const tripOwnerId = (post.trips as any).user_id
    
    const isPublic = tripStatus === 'published'
    const isOwner = tripOwnerId === user.id || post.user_id === user.id

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: 'Cannot comment on private posts' }, { status: 403 })
    }

    // If replying to a comment, verify parent exists
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, post_id')
        .eq('id', parentId)
        .single()

      if (parentError || !parentComment || parentComment.post_id !== params.postId) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: params.postId,
        trip_id: null, // This is a post comment, not a trip comment
        parent_id: parentId || null,
        content: content.trim()
      })
      .select(`
        id,
        user_id,
        content,
        created_at,
        user:profiles!user_id (
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

    // Create notification for post owner (if not commenting on own post)
    if (post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'comment',
        title: 'New comment on your post',
        message: `${user.user_metadata?.full_name || 'Someone'} commented on your post`,
        data: {
          comment_id: comment.id,
          post_id: params.postId,
          trip_id: post.trip_id,
          commenter_id: user.id,
          commenter_name: user.user_metadata?.full_name
        }
      })
    }

    // Also notify trip owner if different from post owner
    if (tripOwnerId !== post.user_id && tripOwnerId !== user.id) {
      await supabase.from('notifications').insert({
        user_id: tripOwnerId,
        type: 'comment',
        title: 'New comment on a trip post',
        message: `${user.user_metadata?.full_name || 'Someone'} commented on a post in your trip`,
        data: {
          comment_id: comment.id,
          post_id: params.postId,
          trip_id: post.trip_id,
          commenter_id: user.id,
          commenter_name: user.user_metadata?.full_name
        }
      })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Unexpected error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

