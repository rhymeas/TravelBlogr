import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { applyRateLimit, apiRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/trip-notes
 * Body: { clientUid, noteText, tripId?, locationId?, activityId?, locationName?, activityTitle? }
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await applyRateLimit(req, apiRateLimit)
    if (!limit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = await createServerSupabase()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientUid, noteText, tripId, locationId, activityId, locationName, activityTitle } = await req.json()

    if (!clientUid || !noteText) {
      return NextResponse.json({ error: 'Missing clientUid or noteText' }, { status: 400 })
    }

    // Try update existing by clientUid, else insert
    const { data: existing, error: findErr } = await supabase
      .from('trip_notes')
      .select('id')
      .eq('user_id', user.id)
      .eq('client_uid', clientUid)
      .maybeSingle()

    if (findErr) {
      console.error('Find error:', findErr)
    }

    if (existing?.id) {
      const { data, error } = await supabase
        .from('trip_notes')
        .update({
          note_text: noteText,
          trip_id: tripId || null,
          location_id: locationId || null,
          activity_id: activityId || null,
          location_name: locationName || null,
          activity_title: activityTitle || null,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    const { data, error } = await supabase
      .from('trip_notes')
      .insert({
        user_id: user.id,
        note_text: noteText,
        trip_id: tripId || null,
        location_id: locationId || null,
        activity_id: activityId || null,
        location_name: locationName || null,
        activity_title: activityTitle || null,
        client_uid: clientUid,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('trip-notes error:', e)
    return NextResponse.json({ error: e.message || 'Failed to save note' }, { status: 500 })
  }
}

