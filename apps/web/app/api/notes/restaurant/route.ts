/**
 * API Route: Restaurant Notes
 * POST /api/notes/restaurant - Create or update restaurant note
 * GET /api/notes/restaurant?restaurantId=xxx - Get user's note for a restaurant
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'restaurantId is required' }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from('user_restaurant_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({ success: true, data: note || null })
  } catch (error) {
    console.error('Error fetching restaurant note:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { restaurantId, noteText, rating, photos, visitedDate, dishRecommendations, isPrivate } = body

    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'restaurantId is required' }, { status: 400 })
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ success: false, error: 'rating must be between 1 and 5' }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from('user_restaurant_notes')
      .upsert({
        user_id: user.id,
        restaurant_id: restaurantId,
        note_text: noteText || null,
        rating: rating || null,
        photos: photos || [],
        visited_date: visitedDate || null,
        dish_recommendations: dishRecommendations || null,
        is_private: isPrivate !== undefined ? isPrivate : true,
      }, {
        onConflict: 'user_id,restaurant_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: note })
  } catch (error) {
    console.error('Error saving restaurant note:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'restaurantId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_restaurant_notes')
      .delete()
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting restaurant note:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

