import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// GET /api/featured - Featured trips, locations, and CMS content for landing page
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get featured trips with related data
    const { data: featuredTrips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        description,
        slug,
        cover_image,
        start_date,
        end_date,
        location_data,
        created_at,
        user_id,
        profiles!user_id (
          id,
          full_name,
          avatar_url,
          username
        ),
        posts!inner (
          id,
          title,
          excerpt,
          featured_image,
          post_date,
          view_count,
          like_count
        )
      `)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6)

    if (tripsError) {
      console.error('Featured trips query error:', tripsError)
    }

    // Get featured locations with posts
    const { data: featuredLocations, error: locationsError } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        slug,
        description,
        country,
        region,
        city,
        latitude,
        longitude,
        featured_image,
        gallery_images,
        rating,
        visit_count,
        best_time_to_visit,
        location_posts!inner (
          id,
          title,
          excerpt,
          featured_image,
          published_at,
          view_count,
          like_count,
          author:profiles!author_id (
            id,
            full_name,
            avatar_url
          )
        ),
        location_tips (
          id,
          category,
          title,
          content,
          is_featured
        )
      `)
      .eq('is_featured', true)
      .eq('is_published', true)
      .eq('location_posts.status', 'published')
      .order('visit_count', { ascending: false })
      .limit(8)

    if (locationsError) {
      console.error('Featured locations query error:', locationsError)
    }

    // Get featured CMS posts for editorial content
    const { data: featuredCMSPosts, error: cmsPostsError } = await supabase
      .from('cms_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        tags,
        category,
        published_at,
        view_count,
        like_count,
        author:profiles!author_id (
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
      .limit(4)

    if (cmsPostsError) {
      console.error('Featured CMS posts query error:', cmsPostsError)
    }

    // Get recent activity for live feed preview (combining trip posts and CMS posts)
    const { data: recentTripPosts, error: tripPostsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        featured_image,
        post_date,
        view_count,
        like_count,
        user_id,
        profiles!user_id (
          id,
          full_name,
          avatar_url,
          username
        ),
        trip:trips (
          id,
          title,
          slug
        )
      `)
      .order('post_date', { ascending: false })
      .limit(4)

    if (tripPostsError) {
      console.error('Recent trip posts query error:', tripPostsError)
    }

    // Get recent CMS posts for live activity
    const { data: recentCMSPosts, error: recentCMSError } = await supabase
      .from('cms_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        published_at,
        view_count,
        like_count,
        category,
        author:profiles!author_id (
          id,
          full_name,
          avatar_url,
          username
        )
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(4)

    if (recentCMSError) {
      console.error('Recent CMS posts query error:', recentCMSError)
    }

    // Transform data for frontend consumption
    const transformedTrips = featuredTrips?.map(trip => ({
      ...trip,
      author: trip.profiles?.[0] || null,
      postsCount: trip.posts?.length || 0,
      duration: trip.start_date && trip.end_date
        ? Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      totalDistance: trip.location_data?.totalDistance || null,
      type: 'trip'
    })) || []

    const transformedLocations = featuredLocations?.map(location => ({
      ...location,
      postsCount: location.location_posts?.length || 0,
      featuredTips: location.location_tips?.filter(tip => tip.is_featured) || [],
      type: 'location'
    })) || []

    // Transform CMS posts for featured content
    const transformedCMSPosts = featuredCMSPosts?.map(post => ({
      ...post,
      type: 'cms_post',
      published_at: post.published_at,
      postsCount: 1
    })) || []

    // Combine and sort recent activity from both trip posts and CMS posts
    const combinedRecentPosts = [
      ...(recentTripPosts?.map(post => ({
        ...post,
        type: 'trip_post',
        published_at: post.post_date,
        author: post.profiles?.[0] || null
      })) || []),
      ...(recentCMSPosts?.map(post => ({
        ...post,
        type: 'cms_post',
        published_at: post.published_at,
        author: post.author
      })) || [])
    ]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 6)

    const response = {
      trips: transformedTrips,
      locations: transformedLocations,
      cmsContent: transformedCMSPosts,
      recentPosts: combinedRecentPosts,
      meta: {
        tripsCount: transformedTrips.length,
        locationsCount: transformedLocations.length,
        cmsPostsCount: transformedCMSPosts.length,
        recentPostsCount: combinedRecentPosts.length,
        lastUpdated: new Date().toISOString()
      }
    }

    // Cache for 10 minutes
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200'
      }
    })

  } catch (error) {
    console.error('Featured content API error:', error)
    
    // Return empty response on error
    return NextResponse.json({
      trips: [],
      locations: [],
      cmsContent: [],
      recentPosts: [],
      meta: {
        tripsCount: 0,
        locationsCount: 0,
        cmsPostsCount: 0,
        recentPostsCount: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Failed to fetch featured content'
      }
    }, { status: 500 })
  }
}
