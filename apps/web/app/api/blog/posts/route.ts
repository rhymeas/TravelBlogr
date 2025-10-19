import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

// Validation schema for blog post
const blogPostSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  content: z.any().optional(),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  visibility: z.enum(['public', 'private', 'password']).default('public'),
  password: z.string().optional(),
  featured_image: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  seo_title: z.string().max(255).optional(),
  seo_description: z.string().optional(),
  published_at: z.string().optional(),
  scheduled_at: z.string().optional()
})

/**
 * GET /api/blog/posts
 * Fetch blog posts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Use service role client to bypass RLS for public blog posts
    const supabase = createServiceSupabase()

    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data: posts, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch author profiles separately
    let postsWithProfiles = posts
    if (posts && posts.length > 0) {
      const authorIds = [...new Set(posts.map(p => p.author_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', authorIds)

      // Attach profiles to posts
      postsWithProfiles = posts.map(post => ({
        ...post,
        profiles: profiles?.find(p => p.id === post.author_id) || null
      }))
    }

    return NextResponse.json({
      posts: postsWithProfiles,
      total: count,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/blog/posts
 * Create a new blog post
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = blogPostSchema.safeParse(body)
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

    // Create blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...validation.data,
        author_id: user.id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}

