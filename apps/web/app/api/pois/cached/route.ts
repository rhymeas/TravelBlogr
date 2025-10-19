/**
 * API Route: Get Cached POIs
 * 
 * Returns POIs from cache (session or database) without hitting external APIs.
 * Fast response for immediate display.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFromDatabaseCache } from '@/lib/services/smartDataHandler'
import { isFeatureEnabled } from '@/lib/featureFlags'

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isFeatureEnabled('SMART_POI_SYSTEM')) {
      return NextResponse.json({ 
        pois: [],
        message: 'Smart POI system is disabled'
      })
    }

    const { locations } = await request.json()

    if (!locations || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Invalid request: locations array required' },
        { status: 400 }
      )
    }

    console.log(`📍 Fetching cached POIs for ${locations.length} locations`)

    // Fetch cached POIs in parallel
    const cachedPOIs = await Promise.all(
      locations.map(async (location) => {
        const cached = await getFromDatabaseCache({
          type: 'pois',
          key: location,
          useServerClient: true
        })
        return cached || []
      })
    )

    const allPOIs = cachedPOIs.flat()

    console.log(`✅ Found ${allPOIs.length} cached POIs`)

    return NextResponse.json({
      success: true,
      pois: allPOIs,
      count: allPOIs.length,
      cached: true
    })
  } catch (error) {
    console.error('Cached POIs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cached POIs' },
      { status: 500 }
    )
  }
}

