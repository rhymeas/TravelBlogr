import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/trips/[tripId]/locations/[locationId]
 * Get trip-specific location customization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string; locationId: string } }
) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Verify trip exists and user has access
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id, status')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check access: owner or public trip
    const isOwner = user && trip.user_id === user.id
    const isPublic = trip.status === 'published'

    if (!isOwner && !isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get trip location customization
    const { data: customization, error } = await supabase
      .from('trip_location_customizations')
      .select('*')
      .eq('trip_id', params.tripId)
      .eq('location_id', params.locationId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching trip location:', error)
      return NextResponse.json({ error: 'Failed to fetch customization' }, { status: 500 })
    }

    return NextResponse.json({ customization })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/trips/[tripId]/locations/[locationId]
 * Create trip-specific location customization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string; locationId: string } }
) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trip exists and user owns it
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      customName,
      customDescription,
      customNotes,
      customImages,
      arrivalTime,
      departureTime,
      durationMinutes,
      estimatedCost,
      actualCost,
      currency,
      isPublic,
      orderIndex,
      customData
    } = body

    // Verify location exists
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('id', params.locationId)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Upsert trip location customization
    const { data: customization, error: upsertError } = await supabase
      .from('trip_location_customizations')
      .upsert({
        trip_id: params.tripId,
        location_id: params.locationId,
        user_id: user.id,
        custom_name: customName,
        custom_description: customDescription,
        custom_notes: customNotes,
        custom_images: customImages || [],
        arrival_time: arrivalTime,
        departure_time: departureTime,
        duration_minutes: durationMinutes,
        estimated_cost: estimatedCost,
        actual_cost: actualCost,
        currency: currency,
        is_public: isPublic ?? false,
        order_index: orderIndex ?? 0,
        custom_data: customData || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'trip_id,location_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting trip location:', upsertError)
      return NextResponse.json({ error: 'Failed to save customization' }, { status: 500 })
    }

    return NextResponse.json({ customization })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/trips/[tripId]/locations/[locationId]
 * Update trip-specific location customization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tripId: string; locationId: string } }
) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trip exists and user owns it
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.customName !== undefined) updateData.custom_name = body.customName
    if (body.customDescription !== undefined) updateData.custom_description = body.customDescription
    if (body.customNotes !== undefined) updateData.custom_notes = body.customNotes
    if (body.customImages !== undefined) updateData.custom_images = body.customImages
    if (body.arrivalTime !== undefined) updateData.arrival_time = body.arrivalTime
    if (body.departureTime !== undefined) updateData.departure_time = body.departureTime
    if (body.durationMinutes !== undefined) updateData.duration_minutes = body.durationMinutes
    if (body.estimatedCost !== undefined) updateData.estimated_cost = body.estimatedCost
    if (body.actualCost !== undefined) updateData.actual_cost = body.actualCost
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.isPublic !== undefined) updateData.is_public = body.isPublic
    if (body.orderIndex !== undefined) updateData.order_index = body.orderIndex
    if (body.customData !== undefined) updateData.custom_data = body.customData

    // Update trip location customization
    const { data: customization, error: updateError } = await supabase
      .from('trip_location_customizations')
      .update(updateData)
      .eq('trip_id', params.tripId)
      .eq('location_id', params.locationId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating trip location:', updateError)
      return NextResponse.json({ error: 'Failed to update customization' }, { status: 500 })
    }

    return NextResponse.json({ customization })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/trips/[tripId]/locations/[locationId]
 * Delete trip-specific location customization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string; locationId: string } }
) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trip exists and user owns it
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete trip location customization
    const { error: deleteError } = await supabase
      .from('trip_location_customizations')
      .delete()
      .eq('trip_id', params.tripId)
      .eq('location_id', params.locationId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting trip location:', deleteError)
      return NextResponse.json({ error: 'Failed to delete customization' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

