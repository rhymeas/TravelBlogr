import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tripId = searchParams.get('tripId')
    if (!tripId) return NextResponse.json({ error: 'tripId is required' }, { status: 400 })

    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('route_checklist_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: data })
  } catch (error) {
    console.error('route-checklist GET error:', error)
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tripId, latitude, longitude, distanceKm, itemText } = body || {}
    if (!tripId || latitude == null || longitude == null || !itemText) {
      return NextResponse.json({ error: 'tripId, latitude, longitude, itemText required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('route_checklist_items')
      .insert({
        trip_id: tripId,
        user_id: user.id,
        latitude,
        longitude,
        distance_from_start: distanceKm,
        item_text: itemText,
        completed: false
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('route-checklist POST error:', error)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

