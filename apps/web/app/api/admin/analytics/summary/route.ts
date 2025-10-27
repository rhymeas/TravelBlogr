import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/admin/analytics/summary
 *
 * Get performance summary with percentiles
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

    // Get time range from query params (default: 24 hours)
    const { searchParams } = new URL(request.url)
    const timeRangeHours = parseInt(searchParams.get('hours') || '24')

    // Get performance summary
    const { data: summary, error } = await supabase
      .rpc('get_performance_summary', { time_range_hours: timeRangeHours })

    if (error) {
      console.error('Error fetching performance summary:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      timeRangeHours,
      summary
    })

  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    )
  }
}

