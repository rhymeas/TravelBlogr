import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/trips/:tripId/itinerary-items
// Body: { dayIndex: number, title: string, type: 'activity'|'meal'|'travel'|'note', duration?: string, image?: string }
export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const supabase = await createServerSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tripId = params.tripId
    if (!tripId) return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })

    const body = await request.json()
    const { dayIndex, title, type, duration, image } = body || {}

    if (typeof dayIndex !== 'number' || !title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify ownership
    const { data: trip, error: fetchErr } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single()

    if (fetchErr || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    if (trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Insert itinerary item
    const { data: inserted, error: insertErr } = await supabase
      .from('trip_itinerary_items')
      .insert({
        trip_id: tripId,
        day_index: dayIndex,
        title,
        type,
        duration: duration || null,
        image_url: image || null,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('Insert itinerary item error:', insertErr)
      return NextResponse.json({ error: 'Failed to insert itinerary item' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: inserted?.id }, { status: 201 })
  } catch (err) {
    console.error('Itinerary items API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/trips/:tripId/itinerary-items?id=...
export async function DELETE(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const supabase = await createServerSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tripId = params.tripId
    const id = request.nextUrl.searchParams.get('id')
    if (!tripId || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Verify ownership
    const { data: trip, error: fetchErr } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single()

    if (fetchErr || !trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    if (trip.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error: delErr } = await supabase
      .from('trip_itinerary_items')
      .delete()
      .eq('id', id)
      .eq('trip_id', tripId)

    if (delErr) {
      console.error('Delete itinerary item error:', delErr)
      return NextResponse.json({ error: 'Failed to delete itinerary item' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Itinerary items DELETE error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

