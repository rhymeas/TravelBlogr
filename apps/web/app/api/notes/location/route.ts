/**
 * API Route: Location Notes
 * POST /api/notes/location - Create or update location note
 * GET /api/notes/location?locationId=xxx - Get user's note for a location
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET - Fetch user's note for a specific location
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'locationId is required' },
        { status: 400 }
      )
    }

    // Fetch note
    const { data: note, error } = await supabase
      .from('user_location_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('location_id', locationId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return NextResponse.json({
      success: true,
      data: note || null
    })

  } catch (error) {
    console.error('Error fetching location note:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Create or update location note
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { locationId, noteText, rating, photos, isPrivate } = body

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'locationId is required' },
        { status: 400 }
      )
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: 'rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Upsert note (insert or update if exists)
    const { data: note, error } = await supabase
      .from('user_location_notes')
      .upsert({
        user_id: user.id,
        location_id: locationId,
        note_text: noteText || null,
        rating: rating || null,
        photos: photos || [],
        is_private: isPrivate !== undefined ? isPrivate : true,
      }, {
        onConflict: 'user_id,location_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: note
    })

  } catch (error) {
    console.error('Error saving location note:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete location note
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'locationId is required' },
        { status: 400 }
      )
    }

    // Delete note
    const { error } = await supabase
      .from('user_location_notes')
      .delete()
      .eq('user_id', user.id)
      .eq('location_id', locationId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting location note:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

