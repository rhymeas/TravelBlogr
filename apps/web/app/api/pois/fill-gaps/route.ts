/**
 * API Route: Fill POI Gaps
 * 
 * Uses GROQ AI to generate POIs to fill identified gaps
 * Results are cached for 1 day.
 */

import { NextRequest, NextResponse } from 'next/server'
import { smartFetch } from '@/lib/services/smartDataHandler'
import { fillPOIGaps, type TripContext, type POIGap } from '@/lib/services/groqPOIOrchestrator'
import { isFeatureEnabled } from '@/lib/featureFlags'

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isFeatureEnabled('GROQ_POI_VALIDATION')) {
      return NextResponse.json({ 
        filledPOIs: [],
        message: 'GROQ POI gap filling is disabled'
      })
    }

    const { gaps, tripContext } = await request.json() as {
      gaps: POIGap[]
      tripContext: TripContext
    }

    if (!gaps || !Array.isArray(gaps)) {
      return NextResponse.json(
        { error: 'Invalid request: gaps array required' },
        { status: 400 }
      )
    }

    if (!tripContext) {
      return NextResponse.json(
        { error: 'Invalid request: tripContext required' },
        { status: 400 }
      )
    }

    if (gaps.length === 0) {
      return NextResponse.json({
        success: true,
        filledPOIs: [],
        count: 0,
        message: 'No gaps to fill'
      })
    }

    console.log(`🔧 Filling ${gaps.length} POI gaps for ${tripContext.from} → ${tripContext.to}`)

    // Fill gaps with GROQ (cached for 1 day)
    const filledPOIs = await smartFetch(
      `filled_gaps_${tripContext.from}_${tripContext.to}_${tripContext.travelType}_${gaps.length}`,
      'groq_gap_fill',
      async () => {
        return await fillPOIGaps(gaps, tripContext)
      },
      {
        useServerClient: true,
        apiName: 'groq'
      }
    )

    console.log(`✅ Generated ${filledPOIs.length} POIs to fill gaps`)

    return NextResponse.json({
      success: true,
      filledPOIs,
      count: filledPOIs.length
    })
  } catch (error) {
    console.error('Fill POI gaps API error:', error)
    return NextResponse.json(
      { error: 'Failed to fill POI gaps', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

