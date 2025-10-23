import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50)

    if (!locationId) {
      return NextResponse.json({ success: false, error: 'locationId required' }, { status: 400 })
    }

    const supabase = createServiceSupabase()

    const { data, error } = await supabase
      .from('location_activity_links')
      .select('*')
      .eq('location_id', locationId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, activities: data || [] })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

