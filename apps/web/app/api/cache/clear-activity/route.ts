import { NextRequest, NextResponse } from 'next/server'
import { deleteCached, CacheKeys } from '@/lib/upstash'

export const dynamic = 'force-dynamic'

/**
 * Clear Upstash cache for specific activities
 * POST /api/cache/clear-activity
 * Body: { activityName: string, locationName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { activityName, locationName, tripType, context } = await request.json()

    if (!activityName || !locationName) {
      return NextResponse.json(
        { error: 'Missing activityName or locationName' },
        { status: 400 }
      )
    }

    // Match the same cache key logic as braveActivityService.ts
    const ctxKey = (tripType || context) ? `:${(tripType || '').toLowerCase()}:${(context || '').toLowerCase().slice(0,50)}` : ''
    const cacheKey = CacheKeys.activityData(locationName + ctxKey, activityName)
    await deleteCached(cacheKey)

    console.log(`🗑️ Cleared cache for: ${activityName} in ${locationName}${ctxKey ? ' with context' : ''}`)
    console.log(`   Cache key: ${cacheKey}`)

    return NextResponse.json({
      success: true,
      message: `Cache cleared for ${activityName}`,
      cacheKey
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

