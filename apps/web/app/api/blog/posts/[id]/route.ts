import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

// Validation schema for blog post update
const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  content: z.any().optional(),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  visibility: z.enum(['public', 'private', 'password']).optional(),
  password: z.string().optional(),
  featured_image: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  seo_title: z.string().max(255).optional(),
  seo_description: z.string().optional(),
  published_at: z.string().optional(),
  scheduled_at: z.string().optional()
})

/**
 * GET /api/blog/posts/[id]
 * Fetch a single blog post by ID or slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceSupabase()

    // Check if ID is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)

    // Fetch blog post
    let query = supabase
      .from('blog_posts')
      .select('*')

    if (isUUID) {
      query = query.eq('id', params.id)
    } else {
      query = query.eq('slug', params.id)
    }

    const { data: post, error } = await query.single()

    if (error) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Fetch author profile separately with all fields for author modal
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio, expertise, writing_style, travel_preferences')
      .eq('id', post.author_id)
      .single()

    // Attach profile to post
    const postWithProfile = {
      ...post,
      profiles: profile || null
    }

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id)

    return NextResponse.json(postWithProfile)
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/blog/posts/[id]
 * Update a blog post
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate input
    const validation = updateBlogPostSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the post or is admin
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('author_id')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.author_id !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Update blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/blog/posts/[id]
 * Delete a blog post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the post or is admin
    const { data: post, error: fetchError } = await supabase
      .from('cms_posts')
      .select('author_id')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.author_id !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Delete blog post
    const { error } = await supabase
      .from('cms_posts')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}

