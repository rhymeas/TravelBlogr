/**
 * API Route: Fetch Fresh POIs
 * 
 * Fetches POIs from external APIs with smart caching and rate limiting.
 * Uses batch processing to avoid API overheat.
 */

import { NextRequest, NextResponse } from 'next/server'
import { smartFetch, processBatch } from '@/lib/services/smartDataHandler'
import { getComprehensivePOIs } from '@/lib/services/comprehensivePOIService'
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

    const { locations, travelType = 'city-break', budget = 'moderate', limit = 20 } = await request.json()

    if (!locations || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Invalid request: locations array required' },
        { status: 400 }
      )
    }

    console.log(`📍 Fetching POIs for ${locations.length} locations (${travelType}, ${budget})`)

    // Fetch POIs in small batches to avoid API overheat
    const pois = await processBatch(
      locations,
      async (location) => {
        return await smartFetch(
          `pois_${location}_${travelType}_${budget}`,
          'pois',
          async () => {
            const result = await getComprehensivePOIs({
              locationName: location,
              travelType: travelType as any,
              budget: budget as any,
              limit
            }, true)
            return result
          },
          { 
            useServerClient: true,
            apiName: 'opentripmap'
          }
        )
      },
      {
        batchSize: 5,  // Process 5 locations at a time
        delayMs: 1000, // 1 second delay between batches
        onProgress: (current, total) => {
          console.log(`   Progress: ${current}/${total} locations`)
        }
      }
    )

    const allPOIs = pois.flat()

    console.log(`✅ Fetched ${allPOIs.length} POIs from ${locations.length} locations`)

    return NextResponse.json({
      success: true,
      pois: allPOIs,
      count: allPOIs.length,
      cached: false
    })
  } catch (error) {
    console.error('Fetch POIs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch POIs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

