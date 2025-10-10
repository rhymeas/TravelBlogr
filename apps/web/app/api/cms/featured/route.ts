import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// GET /api/cms/featured - Get featured CMS content for landing page management
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has CMS access
    const { data: profile } = await supabase
      .from('users')
      .select('role, subscription_tier')
      .eq('id', user.id)
      .single()

    const hasAccess = profile?.role === 'admin' || 
                     profile?.subscription_tier === 'premium' ||
                     profile?.subscription_tier === 'pro'

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all CMS posts that could be featured
    const { data: cmsPosts, error: cmsError } = await supabase
      .from('cms_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        status,
        visibility,
        tags,
        category,
        published_at,
        view_count,
        like_count,
        comment_count,
        created_at,
        author:users!cms_posts_author_id_fkey (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .not('featured_image', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20)

    if (cmsError) {
      console.error('CMS posts query error:', cmsError)
    }

    // Get CMS categories for filtering
    const { data: categories, error: categoriesError } = await supabase
      .from('cms_categories')
      .select(`
        id,
        name,
        slug,
        description,
        color,
        icon,
        post_count
      `)
      .order('post_count', { ascending: false })

    if (categoriesError) {
      console.error('CMS categories query error:', categoriesError)
    }

    // Get popular tags
    const { data: tags, error: tagsError } = await supabase
      .from('cms_tags')
      .select(`
        id,
        name,
        slug,
        description,
        color,
        post_count
      `)
      .order('post_count', { ascending: false })
      .limit(20)

    if (tagsError) {
      console.error('CMS tags query error:', tagsError)
    }

    const response = {
      posts: cmsPosts || [],
      categories: categories || [],
      tags: tags || [],
      meta: {
        postsCount: cmsPosts?.length || 0,
        categoriesCount: categories?.length || 0,
        tagsCount: tags?.length || 0,
        lastUpdated: new Date().toISOString()
      }
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600'
      }
    })

  } catch (error) {
    console.error('CMS featured content API error:', error)
    
    return NextResponse.json({
      posts: [],
      categories: [],
      tags: [],
      meta: {
        postsCount: 0,
        categoriesCount: 0,
        tagsCount: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Failed to fetch CMS content'
      }
    }, { status: 500 })
  }
}

// POST /api/cms/featured - Update featured status of CMS content
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { postId, action } = body

    if (!postId || !action) {
      return NextResponse.json({ error: 'Post ID and action required' }, { status: 400 })
    }

    // For now, we'll use tags to mark featured content
    // In the future, you might want to add a dedicated featured field
    const { data: post, error: fetchError } = await supabase
      .from('cms_posts')
      .select('tags')
      .eq('id', postId)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    let updatedTags: string[] = (post.tags as string[]) || []

    if (action === 'feature') {
      if (!updatedTags.includes('featured')) {
        updatedTags.push('featured')
      }
    } else if (action === 'unfeature') {
      updatedTags = updatedTags.filter((tag: string) => tag !== 'featured')
    }

    const { error: updateError } = await supabase
      .from('cms_posts')
      .update({ tags: updatedTags })
      .eq('id', postId)

    if (updateError) {
      console.error('Update featured status error:', updateError)
      return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Post ${action}d successfully`,
      tags: updatedTags
    })

  } catch (error) {
    console.error('CMS featured update API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update featured status'
    }, { status: 500 })
  }
}
