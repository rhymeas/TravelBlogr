/**
 * API Route: Activity Notes
 * POST /api/notes/activity - Create or update activity note
 * GET /api/notes/activity?activityId=xxx - Get user's note for an activity
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
    const activityId = searchParams.get('activityId')

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'activityId is required' }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from('user_activity_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_id', activityId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({ success: true, data: note || null })
  } catch (error) {
    console.error('Error fetching activity note:', error)
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
    const { activityId, noteText, rating, photos, visitedDate, isPrivate } = body

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'activityId is required' }, { status: 400 })
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json({ success: false, error: 'rating must be between 1 and 5' }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from('user_activity_notes')
      .upsert({
        user_id: user.id,
        activity_id: activityId,
        note_text: noteText || null,
        rating: rating || null,
        photos: photos || [],
        visited_date: visitedDate || null,
        is_private: isPrivate !== undefined ? isPrivate : true,
      }, {
        onConflict: 'user_id,activity_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: note })
  } catch (error) {
    console.error('Error saving activity note:', error)
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
    const activityId = searchParams.get('activityId')

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'activityId is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_activity_notes')
      .delete()
      .eq('user_id', user.id)
      .eq('activity_id', activityId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting activity note:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

