import { NextResponse } from 'next/server'
import { getRoutingUsage } from '@/lib/services/routingMonitor'

/**
 * GET /api/admin/routing-usage
 * 
 * Get current month's routing API usage stats
 */
export async function GET() {
  try {
    const usage = await getRoutingUsage()

    if (!usage) {
      return NextResponse.json(
        { error: 'Failed to fetch routing usage' },
        { status: 500 }
      )
    }

    return NextResponse.json(usage)
  } catch (error) {
    console.error('Error fetching routing usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

