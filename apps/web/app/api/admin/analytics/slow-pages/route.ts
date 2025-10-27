import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/admin/analytics/slow-pages
 *
 * Get slowest pages by average render time
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get params from query
    const { searchParams } = new URL(request.url)
    const timeRangeHours = parseInt(searchParams.get('hours') || '24')
    const limitCount = parseInt(searchParams.get('limit') || '20')

    // Get slowest pages
    const { data: slowPages, error } = await supabase
      .rpc('get_slowest_pages', {
        time_range_hours: timeRangeHours,
        limit_count: limitCount
      })

    if (error) {
      console.error('Error fetching slow pages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      timeRangeHours,
      slowPages
    })

  } catch (error) {
    console.error('Slow pages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch slow pages' },
      { status: 500 }
    )
  }
}

