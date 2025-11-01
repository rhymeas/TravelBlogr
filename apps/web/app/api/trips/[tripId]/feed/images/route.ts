import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// POST: add an image to a trip's feed
export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const supabase = await createServerSupabase()

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tripId = params.tripId
    const body = await request.json()
    const { image_url, caption, location_name, location_coordinates } = body || {}

    if (!image_url || typeof image_url !== 'string') {
      return NextResponse.json({ error: 'image_url is required' }, { status: 400 })
    }

    // Verify ownership: user must own the trip to post (collaborator logic can be added later)
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id, privacy, slug, title')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    let canPost = trip.user_id === user.id
    if (!canPost) {
      const { data: collab } = await supabase
        .from('trip_collaborators')
        .select('role, status')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single()
      if (collab && collab.status === 'accepted' && (collab.role === 'editor' || collab.role === 'admin')) {
        canPost = true
      }
    }

    if (!canPost) {
      return NextResponse.json({ error: 'Not authorized to post to this trip' }, { status: 403 })
    }

    // Insert
    const { data: inserted, error: insertError } = await supabase
      .from('trip_feed_images')
      .insert({
        trip_id: tripId,
        user_id: user.id,
        image_url,
        caption: caption || null,
        location_name: location_name || null,
        location_coordinates: location_coordinates || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert trip_feed_images failed', insertError)
      return NextResponse.json({ error: 'Failed to post image' }, { status: 500 })
    }

    // Optionally: also write to activity_feed for public trips (global pool)
    if (trip.privacy === 'public') {
      await supabase.from('activity_feed').insert({
        user_id: user.id,
        type: 'trip_image',
        data: {
          trip_id: trip.id,
          image_id: inserted.id,
          image_url,
          caption: caption || null,
          location_name: location_name || null,
          trip_slug: trip.slug,
          trip_title: trip.title
        }
      })
    }

    return NextResponse.json({ success: true, image: inserted })
  } catch (err) {
    console.error('POST /api/trips/[tripId]/feed/images error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: list images for a trip
export async function GET(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const supabase = await createServerSupabase()
    const tripId = params.tripId

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const { data, error } = await supabase
      .from('trip_feed_images')
      .select(`
        *,
        user:profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Fetch trip_feed_images failed', error)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    return NextResponse.json({ success: true, images: data || [] })
  } catch (err) {
    console.error('GET /api/trips/[tripId]/feed/images error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

