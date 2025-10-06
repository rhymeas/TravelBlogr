/**
 * Admin API: Trigger Crawler
 * Manually trigger restaurant crawler for a location
 */

import { NextRequest, NextResponse } from 'next/server'
import { crawlAndSaveRestaurants } from '@/../../services/content-crawler/crawlers/restaurantCrawler'
import { syncWeatherForLocation } from '@/../../services/content-crawler/clients/weatherClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TriggerRequest {
  type: 'restaurants' | 'weather'
  locationId: string
  urls?: string[] // For restaurant crawler
  latitude?: number // For weather
  longitude?: number // For weather
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // For now, check for admin secret
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET

    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: TriggerRequest = await request.json()

    if (!body.type || !body.locationId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, locationId' },
        { status: 400 }
      )
    }

    console.log(`🚀 Triggering ${body.type} crawler for location: ${body.locationId}`)

    if (body.type === 'restaurants') {
      if (!body.urls || body.urls.length === 0) {
        return NextResponse.json(
          { error: 'URLs are required for restaurant crawler' },
          { status: 400 }
        )
      }

      const result = await crawlAndSaveRestaurants(
        body.locationId,
        body.urls
      )

      return NextResponse.json({
        success: result.success,
        message: `Crawled ${result.crawled} restaurants, saved ${result.saved}`,
        data: {
          crawled: result.crawled,
          saved: result.saved,
          errors: result.errors,
        },
      })
    } else if (body.type === 'weather') {
      if (body.latitude === undefined || body.longitude === undefined) {
        return NextResponse.json(
          { error: 'Latitude and longitude are required for weather sync' },
          { status: 400 }
        )
      }

      const result = await syncWeatherForLocation(
        body.locationId,
        body.latitude,
        body.longitude
      )

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'Weather synced successfully'
          : `Weather sync failed: ${result.error}`,
        error: result.error,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid crawler type. Must be "restaurants" or "weather"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error triggering crawler:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

