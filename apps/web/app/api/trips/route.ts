import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { container } from '../../../../infrastructure/container/Container'
import { CreateTripUseCase } from '../../../../packages/core/application/use-cases/CreateTripUseCase'
import { TYPES } from '../../../../packages/core/application/types'
import { nanoid } from 'nanoid'

// GET /api/trips - Get user's trips
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
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
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startDate, endDate } = body

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Use our domain use case for business logic
    const createTripUseCase = container.get<CreateTripUseCase>(TYPES.CreateTripUseCase)
    
    const result = await createTripUseCase.execute({
      userId: user.id,
      title: title.trim(),
      description: description?.trim(),
      startDate,
      endDate
    })

    if (result.isFailure) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const trip = result.getValue().trip

    // Generate default share links using Supabase's convenience
    const shareLinks = await generateShareLinks(trip.id.toString(), user.id)

    // Return the created trip with share links
    return NextResponse.json({
      trip: {
        id: trip.id.toString(),
        title: trip.title.value,
        description: trip.description,
        slug: trip.slug.value,
        status: trip.status.value,
        dateRange: trip.dateRange ? {
          startDate: trip.dateRange.startDate.toISOString(),
          endDate: trip.dateRange.endDate.toISOString()
        } : null,
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString()
      },
      shareLinks
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}

// Helper function to generate share links
async function generateShareLinks(tripId: string, userId: string) {
  const supabase = createServerSupabase()
  
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
    const supabase = createServerSupabase()
    
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
