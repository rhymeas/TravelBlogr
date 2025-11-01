import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// GET: global pool of public trip images
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '60'), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    // Join profiles for user info and trips for minimal metadata
    const { data, error } = await supabase
      .from('trip_feed_images')
      .select(`
        *,
        user:profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        trip:trips!trip_id (
          id,
          title,
          slug,
          privacy
        )
      `)
      .eq('trip.privacy', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Fetch global pool failed', error)
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, images: data || [] })
  } catch (err) {
    console.error('GET /api/feed/global error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

