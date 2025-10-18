import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional()
})

/**
 * GET /api/blog/posts/[id]/comments
 * Fetch all comments for a blog post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Fetch top-level comments with nested replies
    const { data: comments, error } = await supabase
      .from('cms_comments')
      .select(`
        id,
        user_id,
        content,
        like_count,
        created_at,
        updated_at,
        profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        replies:cms_comments!parent_id (
          id,
          user_id,
          content,
          like_count,
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
      .eq('post_id', id)
      .eq('status', 'approved')
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error in GET comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/blog/posts/[id]/comments
 * Create a new comment on a blog post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validation = commentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify post exists and is published
    const { data: post, error: postError } = await supabase
      .from('cms_posts')
      .select('id, status')
      .eq('id', id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot comment on unpublished posts' },
        { status: 403 }
      )
    }

    // If replying to a comment, verify parent exists
    if (validation.data.parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('cms_comments')
        .select('id, post_id')
        .eq('id', validation.data.parentId)
        .single()

      if (parentError || !parentComment || parentComment.post_id !== id) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('cms_comments')
      .insert({
        post_id: id,
        user_id: user.id,
        parent_id: validation.data.parentId || null,
        content: validation.data.content,
        status: 'approved' // Auto-approve for now, can add moderation later
      })
      .select(`
        id,
        user_id,
        content,
        like_count,
        created_at,
        updated_at,
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
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // Increment comment count on post
    await supabase.rpc('increment_post_comment_count', { post_id: id })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error in POST comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

