import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { saveRateLimit, applyRateLimit, createRateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/trips/[tripId]/save
 * Toggle save/unsave for a trip
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, saveRateLimit, user.id)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please slow down.',
          retryAfter: new Date(rateLimitResult.reset).toISOString()
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Verify trip exists
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('trip_saves')
      .select('id')
      .eq('trip_id', params.tripId)
      .eq('user_id', user.id)
      .single()

    let saved = false
    let saveCount = 0

    if (existingSave) {
      // Unsave - delete the save
      const { error: deleteError } = await supabase
        .from('trip_saves')
        .delete()
        .eq('id', existingSave.id)

      if (deleteError) {
        console.error('Error deleting save:', deleteError)
        return NextResponse.json({ error: 'Failed to unsave trip' }, { status: 500 })
      }

      saved = false
    } else {
      // Save - insert new save
      const { error: insertError } = await supabase
        .from('trip_saves')
        .insert({
          trip_id: params.tripId,
          user_id: user.id
        })

      if (insertError) {
        console.error('Error creating save:', insertError)
        return NextResponse.json({ error: 'Failed to save trip' }, { status: 500 })
      }

      saved = true
    }

    // Get updated save count
    const { count, error: countError } = await supabase
      .from('trip_saves')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', params.tripId)

    if (countError) {
      console.error('Error counting saves:', countError)
    } else {
      saveCount = count || 0
    }

    return NextResponse.json({
      success: true,
      saved,
      saveCount,
      userId: user.id
    })
  } catch (error) {
    console.error('Unexpected error toggling save:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/trips/[tripId]/save
 * Get save status and count for a trip
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Get current user (optional for GET)
    const { data: { user } } = await supabase.auth.getUser()

    // Get save count
    const { count, error: countError } = await supabase
      .from('trip_saves')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', params.tripId)

    if (countError) {
      console.error('Error counting saves:', countError)
      return NextResponse.json({ error: 'Failed to get save count' }, { status: 500 })
    }

    let userSaved = false

    // Check if current user saved this trip
    if (user) {
      const { data: existingSave } = await supabase
        .from('trip_saves')
        .select('id')
        .eq('trip_id', params.tripId)
        .eq('user_id', user.id)
        .single()

      userSaved = !!existingSave
    }

    return NextResponse.json({
      saveCount: count || 0,
      userSaved
    })
  } catch (error) {
    console.error('Unexpected error getting save status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

