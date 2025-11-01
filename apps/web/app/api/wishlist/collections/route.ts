import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('wishlist_collections')
      .select('id, name, description, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ collections: data || [] })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg.includes('wishlist_collections') && (msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('relation'))) {
      return NextResponse.json({ error: 'Wishlist collections feature not initialized. Please apply migration 015_wishlist_collections.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg || 'Failed to load collections' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const name: string | undefined = body?.name?.trim()
    const description: string | undefined = body?.description?.trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('wishlist_collections')
      .insert({ user_id: user.id, name, description })
      .select('id, name, description, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ collection: data }, { status: 201 })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg.includes('wishlist_collections_user_name_unique')) {
      return NextResponse.json({ error: 'You already have a collection with this name' }, { status: 409 })
    }
    if (msg.includes('wishlist_collections') && (msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('relation'))) {
      return NextResponse.json({ error: 'Wishlist collections feature not initialized. Please apply migration 015_wishlist_collections.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg || 'Failed to create collection' }, { status: 500 })
  }
}

