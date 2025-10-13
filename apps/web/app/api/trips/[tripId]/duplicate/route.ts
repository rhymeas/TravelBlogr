import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * POST /api/trips/[tripId]/duplicate
 * Duplicate a trip (public or own) into the current user's account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { newTitle } = body

    // Verify source trip exists and is accessible
    const { data: sourceTripData, error: tripError } = await supabase
      .from('trips')
      .select('id, title, user_id, status')
      .eq('id', params.tripId)
      .single()

    if (tripError || !sourceTripData) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check if user has access to this trip
    // Either: own trip, or public trip
    const isOwnTrip = sourceTripData.user_id === user.id
    const isPublicTrip = sourceTripData.status === 'published'

    if (!isOwnTrip && !isPublicTrip) {
      return NextResponse.json(
        { error: 'You do not have permission to duplicate this trip' },
        { status: 403 }
      )
    }

    // Call database function to duplicate trip
    const { data: newTripId, error: duplicateError } = await supabase.rpc('duplicate_trip', {
      source_trip_id: params.tripId,
      new_user_id: user.id,
      new_title: newTitle || `${sourceTripData.title} (Copy)`
    })

    if (duplicateError) {
      console.error('Error duplicating trip:', duplicateError)
      return NextResponse.json(
        { error: 'Failed to duplicate trip', details: duplicateError.message },
        { status: 500 }
      )
    }

    // Fetch the newly created trip
    const { data: newTrip, error: fetchError } = await supabase
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
        )
      `)
      .eq('id', newTripId)
      .single()

    if (fetchError || !newTrip) {
      console.error('Error fetching duplicated trip:', fetchError)
      return NextResponse.json(
        { error: 'Trip duplicated but failed to fetch details' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trip: newTrip,
      message: 'Trip duplicated successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error duplicating trip:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

