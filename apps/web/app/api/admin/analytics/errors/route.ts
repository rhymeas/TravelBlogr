import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/admin/analytics/errors
 *
 * Get recent errors with stack traces
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
    const limitCount = parseInt(searchParams.get('limit') || '50')

    // Get recent errors
    const { data: errors, error } = await supabase
      .rpc('get_recent_errors', {
        time_range_hours: timeRangeHours,
        limit_count: limitCount
      })

    if (error) {
      console.error('Error fetching errors:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group errors by message for easier analysis
    const errorGroups = errors.reduce((groups: any, err: any) => {
      const key = err.error_message || 'Unknown error'
      if (!groups[key]) {
        groups[key] = {
          message: key,
          count: 0,
          firstSeen: err.created_at,
          lastSeen: err.created_at,
          examples: []
        }
      }
      groups[key].count++
      groups[key].lastSeen = err.created_at
      if (groups[key].examples.length < 3) {
        groups[key].examples.push({
          id: err.id,
          page_path: err.page_path,
          error_stack: err.error_stack,
          metadata: err.metadata,
          created_at: err.created_at
        })
      }
      return groups
    }, {})

    const groupedErrors = Object.values(errorGroups).sort((a: any, b: any) => b.count - a.count)

    return NextResponse.json({
      success: true,
      timeRangeHours,
      totalErrors: errors.length,
      uniqueErrors: groupedErrors.length,
      errors,
      groupedErrors
    })

  } catch (error) {
    console.error('Errors fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    )
  }
}

