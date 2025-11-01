import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const collectionId: string | undefined = body?.collectionId
    const locationIds: string[] = Array.isArray(body?.locationIds) ? body.locationIds : []
    if (!collectionId || locationIds.length === 0) {
      return NextResponse.json({ error: 'collectionId and locationIds are required' }, { status: 400 })
    }

    // Verify collection belongs to user (RLS should enforce, but we double-check)
    const { data: col, error: colErr } = await supabase
      .from('wishlist_collections')
      .select('id, user_id')
      .eq('id', collectionId)
      .single()
    if (colErr || !col || col.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rows = locationIds.map(id => ({ collection_id: collectionId, location_id: id }))
    const { error } = await supabase.from('collection_locations').upsert(rows, { onConflict: 'collection_id,location_id' })
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if ((msg.includes('collection_locations') || msg.includes('wishlist_collections')) && (msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('relation'))) {
      return NextResponse.json({ error: 'Wishlist collections feature not initialized. Please apply migration 015_wishlist_collections.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg || 'Failed to add locations' }, { status: 500 })
  }
}

