import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Minimal runtime type guards
function isString(x: any): x is string { return typeof x === 'string' }
function isArray(x: any): x is any[] { return Array.isArray(x) }

export async function POST(
  req: Request,
  { params }: { params: { tripId: string; itemId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: userErr
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { tripId, itemId } = params

    // Ensure user owns the trip
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single()

    if (tripErr || !trip || trip.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const summary = body?.summary
    const facts = body?.facts
    const citations = body?.citations

    if (!isString(summary) || summary.length < 4) {
      return NextResponse.json({ success: false, error: 'Invalid summary' }, { status: 400 })
    }
    if (!isArray(facts) || facts.some((f) => !isString(f))) {
      return NextResponse.json({ success: false, error: 'Invalid facts' }, { status: 400 })
    }
    if (!isArray(citations) || citations.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid citations' }, { status: 400 })
    }

    // Fetch existing item to merge metadata
    const { data: item, error: itemErr } = await supabase
      .from('trip_itinerary_items')
      .select('id, metadata')
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .single()

    if (itemErr || !item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    const nextMetadata = {
      ...(item.metadata ?? {}),
      research: { summary, facts, citations }
    }

    const { data: updated, error: updErr } = await supabase
      .from('trip_itinerary_items')
      .update({ metadata: nextMetadata })
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .select('id, metadata')
      .single()

    if (updErr) {
      return NextResponse.json({ success: false, error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: updated })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

