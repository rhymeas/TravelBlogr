/**
 * API Route: Admin Analytics - Free Tier Limits
 * GET /api/admin/analytics/free-tier-limits
 * 
 * Returns analytics data about users hitting free tier limits
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin permissions
    const isAdmin = user.email?.includes('admin') || user.email === 'admin@travelblogr.com'
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Query AI usage data from Supabase
    // We'll count how many times users hit free tier limits
    const { data: usageData, error: usageError } = await supabase
      .from('ai_usage')
      .select('user_id, created_at, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit * 10) // Get more data to analyze

    if (usageError) {
      console.error('Error fetching usage data:', usageError)
      // Return mock data if table doesn't exist yet
      return NextResponse.json({
        success: true,
        data: {
          totalLimitHits: 0,
          uniqueUsers: 0,
          conversionRate: 0,
          topUsers: [],
          dailyTrend: [],
          message: 'Analytics table not yet populated'
        }
      })
    }

    // Analyze the data
    const limitHits = usageData?.filter(u => u.status === 'free_tier_limit') || []
    const uniqueUsers = new Set(limitHits.map(u => u.user_id)).size

    // Get user details for top users hitting limits
    const userIds = Array.from(new Set(limitHits.map(u => u.user_id))).slice(0, 10)
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    // Create user map
    const userMap = new Map(userProfiles?.map(p => [p.id, p]) || [])

    // Count hits per user
    const userHits = new Map<string, number>()
    limitHits.forEach(hit => {
      userHits.set(hit.user_id, (userHits.get(hit.user_id) || 0) + 1)
    })

    // Get top users
    const topUsers = Array.from(userHits.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({
        userId,
        name: userMap.get(userId)?.full_name || 'Unknown',
        hits: count
      }))

    // Calculate daily trend
    const dailyTrend = new Map<string, number>()
    limitHits.forEach(hit => {
      const date = new Date(hit.created_at).toISOString().split('T')[0]
      dailyTrend.set(date, (dailyTrend.get(date) || 0) + 1)
    })

    const trend = Array.from(dailyTrend.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    // Calculate conversion rate (users who purchased after hitting limit)
    // This would require tracking purchases linked to users
    const conversionRate = 0 // TODO: Implement when purchase tracking is available

    return NextResponse.json({
      success: true,
      data: {
        totalLimitHits: limitHits.length,
        uniqueUsers,
        conversionRate,
        topUsers,
        dailyTrend: trend,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days
        }
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

