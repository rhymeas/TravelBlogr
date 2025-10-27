import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/trips/save-route
 * Saves the currently displayed route geometry as a travel item in trip_itinerary_items
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      tripId,
      from,
      to,
      transportMode,
      preference,
      geometry,
      provider,
      distanceKm,
      durationHrs
    } = body || {}

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }
    if (!geometry || !geometry.type || geometry.type !== 'LineString' || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
      return NextResponse.json({ error: 'geometry LineString with at least 2 coordinates is required' }, { status: 400 })
    }

    // Verify user owns the trip (select minimal row)
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single()

    if (tripErr || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    if (trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare metadata payload
    const meta = {
      from,
      to,
      geometry, // GeoJSON LineString
      provider: provider || 'unknown',
      preference: preference || null,
      transportMode: transportMode || null,
      distanceKm: typeof distanceKm === 'number' ? distanceKm : null,
      durationHrs: typeof durationHrs === 'number' ? durationHrs : null,
      savedAt: new Date().toISOString()
    }

    // Insert as a travel item into trip_itinerary_items (day_index 0 by default)
    const titleFrom = (from?.label || from?.name || 'Origin') as string
    const titleTo = (to?.label || to?.name || 'Destination') as string

    const { data: item, error: insertErr } = await supabase
      .from('trip_itinerary_items')
      .insert({
        trip_id: tripId,
        day_index: 0,
        title: `Travel: ${titleFrom} → ${titleTo}`,
        type: 'travel',
        duration: durationHrs != null ? `${Math.round(durationHrs * 60)} min` : null,
        metadata: meta
      })
      .select('*')
      .single()

    if (insertErr) {
      console.error('Failed to save route to trip_itinerary_items, falling back:', insertErr)
      // Provide a graceful error with guidance
      return NextResponse.json({ error: 'Failed to save route (missing table trip_itinerary_items?)' }, { status: 500 })
    }

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error('POST /api/trips/save-route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

