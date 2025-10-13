import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/locations/[slug]/customize
 * Get user's customization for a location
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's customization for this location
    const { data: customization, error } = await supabase
      .from('user_locations')
      .select('*')
      .eq('user_id', user.id)
      .eq('location_id', params.slug)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user location:', error)
      return NextResponse.json({ error: 'Failed to fetch customization' }, { status: 500 })
    }

    return NextResponse.json({ customization })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/locations/[slug]/customize
 * Create or update user's customization for a location
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      personalNotes,
      userRating,
      isWishlisted,
      isVisited,
      visitDate,
      visibility,
      tags,
      customData
    } = body

    // Validate rating if provided
    if (userRating !== undefined && (userRating < 0 || userRating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 0 and 5' }, { status: 400 })
    }

    // Validate visibility if provided
    if (visibility && !['public', 'private', 'friends'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility level' }, { status: 400 })
    }

    // Verify location exists
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('id', params.slug)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Upsert user location customization
    const { data: customization, error: upsertError } = await supabase
      .from('user_locations')
      .upsert({
        user_id: user.id,
        location_id: params.slug,
        personal_notes: personalNotes,
        user_rating: userRating,
        is_wishlisted: isWishlisted ?? false,
        is_visited: isVisited ?? false,
        visit_date: visitDate,
        visibility: visibility || 'private',
        tags: tags || [],
        custom_data: customData || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,location_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting user location:', upsertError)
      return NextResponse.json({ error: 'Failed to save customization' }, { status: 500 })
    }

    // If user marked as visited, increment location visit count
    if (isVisited) {
      await supabase.rpc('increment', {
        table_name: 'locations',
        row_id: params.slug,
        column_name: 'visit_count'
      })
    }

    return NextResponse.json({ customization })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/locations/[slug]/customize
 * Partially update user's customization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate rating if provided
    if (body.userRating !== undefined && (body.userRating < 0 || body.userRating > 5)) {
      return NextResponse.json({ error: 'Rating must be between 0 and 5' }, { status: 400 })
    }

    // Validate visibility if provided
    if (body.visibility && !['public', 'private', 'friends'].includes(body.visibility)) {
      return NextResponse.json({ error: 'Invalid visibility level' }, { status: 400 })
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.personalNotes !== undefined) updateData.personal_notes = body.personalNotes
    if (body.userRating !== undefined) updateData.user_rating = body.userRating
    if (body.isWishlisted !== undefined) updateData.is_wishlisted = body.isWishlisted
    if (body.isVisited !== undefined) updateData.is_visited = body.isVisited
    if (body.visitDate !== undefined) updateData.visit_date = body.visitDate
    if (body.visibility !== undefined) updateData.visibility = body.visibility
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.customData !== undefined) updateData.custom_data = body.customData

    // Update user location customization
    const { data: customization, error: updateError } = await supabase
      .from('user_locations')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('location_id', params.slug)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user location:', updateError)
      return NextResponse.json({ error: 'Failed to update customization' }, { status: 500 })
    }

    return NextResponse.json({ customization })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/locations/[slug]/customize
 * Delete user's customization for a location
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user location customization
    const { error: deleteError } = await supabase
      .from('user_locations')
      .delete()
      .eq('user_id', user.id)
      .eq('location_id', params.slug)

    if (deleteError) {
      console.error('Error deleting user location:', deleteError)
      return NextResponse.json({ error: 'Failed to delete customization' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

