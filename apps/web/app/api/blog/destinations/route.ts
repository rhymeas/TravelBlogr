import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/blog/destinations
 * Fetch blog destinations with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trending = searchParams.get('trending') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = await createServerSupabase()

    let query = supabase
      .from('blog_destinations')
      .select('*')
      .order('display_order', { ascending: true })
      .limit(limit)

    // Apply filters
    if (trending) {
      query = query.eq('is_trending', true)
    }
    if (featured) {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ destinations: data })
  } catch (error) {
    console.error('Error fetching blog destinations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch destinations' },
      { status: 500 }
    )
  }
}

