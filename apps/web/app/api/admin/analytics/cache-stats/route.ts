import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/admin/analytics/cache-stats
 *
 * Get cache hit rate statistics
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

    // Get cache hit rate
    const { data: cacheStats, error } = await supabase
      .rpc('get_cache_hit_rate', { time_range_hours: timeRangeHours })

    if (error) {
      console.error('Error fetching cache stats:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate overall hit rate
    const totalRequests = cacheStats.reduce((sum: number, stat: any) => sum + parseInt(stat.total_requests), 0)
    const totalHits = cacheStats.reduce((sum: number, stat: any) => sum + parseInt(stat.cache_hits), 0)
    const overallHitRate = totalRequests > 0 ? (totalHits / totalRequests * 100).toFixed(2) : '0.00'

    return NextResponse.json({
      success: true,
      timeRangeHours,
      overallHitRate: parseFloat(overallHitRate),
      totalRequests,
      totalHits,
      cacheStats
    })

  } catch (error) {
    console.error('Cache stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cache stats' },
      { status: 500 }
    )
  }
}

