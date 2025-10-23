import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredCache } from '@/lib/services/smartDataHandler'

/**
 * GET /api/cron/cleanup-cache
 * Cleanup expired cache entries
 *
 * This should be called by a cron job (e.g., Railway Cron, GitHub Actions)
 * Recommended: Run daily at 2 AM
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[Cron] Starting cache cleanup...')
    const deletedCount = await cleanupExpiredCache(true)
    
    console.log(`[Cron] Cleanup complete. Deleted ${deletedCount} expired entries.`)
    
    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Error during cache cleanup:', error)
    return NextResponse.json(
      { error: 'Cache cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/cleanup-cache
 * Manual trigger for cache cleanup (for testing)
 */
export async function POST(request: NextRequest) {
  return GET(request)
}

