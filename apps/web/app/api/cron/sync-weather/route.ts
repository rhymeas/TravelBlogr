/**
 * Cron Job: Sync Weather Data
 * Runs every 6 hours to update weather for all locations
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🌤️  Starting weather sync cron job...')
    const startTime = Date.now()

    // Dynamic import to avoid bundling heavy dependencies during build
    const { syncAllLocationsWeather } = await import('@/../../services/content-crawler/clients/weatherClient')

    const result = await syncAllLocationsWeather()

    const duration = Date.now() - startTime

    console.log(`✅ Weather sync complete in ${duration}ms`)
    console.log(`   - Processed: ${result.processed} locations`)
    console.log(`   - Errors: ${result.errors.length}`)

    return NextResponse.json({
      success: result.success,
      message: `Weather synced for ${result.processed} locations`,
      stats: {
        processed: result.processed,
        errors: result.errors.length,
        duration,
      },
      errors: result.errors,
    })
  } catch (error) {
    console.error('Error in weather sync cron:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

