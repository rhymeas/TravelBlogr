import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { nanoid } from 'nanoid'

// GET /api/trips - Get user's trips
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Debug logging
    console.log('🔐 Auth Debug:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    if (authError || !user) {
      console.error('❌ Auth failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch trips with posts and share links
    const { data: trips, error } = await supabase
      .from('trips')
      .select(`
        *,
        posts (
          id,
          title,
          content,
          featured_image,
          post_date,
          order_index
        ),
        share_links (
          id,
          link_type,
          token,
          title,
          is_active,
          view_count
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching trips:', error)
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
    }

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/trips - Create new trip
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Debug logging
    console.log('🔐 POST /api/trips Auth Debug:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
      cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
    })

    if (authError || !user) {
      console.error('❌ POST Auth failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startDate, endDate, isPublic = true } = body

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + nanoid(8)

    // Create trip in database
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim(),
        slug,
        status: isPublic ? 'published' : 'draft', // Public = published, Private = draft
        start_date: startDate,
        end_date: endDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trip:', error)
      return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
    }

    // Initialize trip stats (for view tracking)
    const { error: statsError } = await supabase
      .from('trip_stats')
      .insert({
        trip_id: trip.id,
        total_views: 0,
        unique_views: 0,
        updated_at: new Date().toISOString()
      })

    if (statsError) {
      console.warn('Failed to initialize trip stats:', statsError)
      // Don't fail the request, just log the warning
    }

    // Generate default share links
    const shareLinks = await generateShareLinks(trip.id, user.id)

    // Return the created trip with share links
    return NextResponse.json({
      trip,
      shareLinks
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}

// Helper function to generate share links
async function generateShareLinks(tripId: string, userId: string) {
  const supabase = await createServerSupabase()
  
  const shareLinks = {
    public: {
      type: 'public' as const,
      token: nanoid(32),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/t/${nanoid(16)}`,
      title: 'Public View'
    },
    family: {
      type: 'family' as const,
      token: nanoid(32),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/t/${nanoid(16)}`,
      title: 'Family View'
    },
    friends: {
      type: 'friends' as const,
      token: nanoid(32),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/t/${nanoid(16)}`,
      title: 'Friends View'
    },
    professional: {
      type: 'professional' as const,
      token: nanoid(32),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/t/${nanoid(16)}`,
      title: 'Professional View'
    }
  }

  // Insert share links into database
  const shareLinksData = Object.values(shareLinks).map(link => ({
    trip_id: tripId,
    user_id: userId,
    link_type: link.type,
    token: link.token,
    title: link.title,
    is_active: true
  }))

  const { error } = await supabase
    .from('share_links')
    .insert(shareLinksData)

  if (error) {
    console.error('Error creating share links:', error)
    // Don't fail the trip creation, just log the error
  }

  return shareLinks
}

// PUT /api/trips/[id] - Update trip
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const tripId = url.pathname.split('/').pop()
    
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { title, description, coverImage, status } = body

    // Update trip in database
    const { data: trip, error } = await supabase
      .from('trips')
      .update({
        title: title?.trim(),
        description: description?.trim(),
        cover_image: coverImage,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId)
      .eq('user_id', user.id) // Ensure user owns the trip
      .select()
      .single()

    if (error) {
      console.error('Error updating trip:', error)
      return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
    }

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json({ trip })

  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}
