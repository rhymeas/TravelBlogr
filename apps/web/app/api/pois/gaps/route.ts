/**
 * API Route: Identify POI Gaps
 * 
 * Uses GROQ AI to identify gaps in POI coverage (missing accommodations, meals, etc.)
 * Results are cached for 1 day.
 */

import { NextRequest, NextResponse } from 'next/server'
import { smartFetch } from '@/lib/services/smartDataHandler'
import { identifyPOIGaps, type TripContext } from '@/lib/services/groqPOIOrchestrator'
import type { ComprehensivePOI } from '@/lib/services/comprehensivePOIService'
import { isFeatureEnabled } from '@/lib/featureFlags'

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isFeatureEnabled('GROQ_POI_VALIDATION')) {
      return NextResponse.json({ 
        gaps: [],
        message: 'GROQ POI gap detection is disabled'
      })
    }

    const { pois, tripContext } = await request.json() as {
      pois: ComprehensivePOI[]
      tripContext: TripContext
    }

    if (!pois || !Array.isArray(pois)) {
      return NextResponse.json(
        { error: 'Invalid request: pois array required' },
        { status: 400 }
      )
    }

    if (!tripContext) {
      return NextResponse.json(
        { error: 'Invalid request: tripContext required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Identifying POI gaps for ${tripContext.from} → ${tripContext.to}`)

    // Identify gaps with GROQ (cached for 1 day)
    const gaps = await smartFetch(
      `gaps_${tripContext.from}_${tripContext.to}_${tripContext.travelType}_${tripContext.days}`,
      'groq_gaps',
      async () => {
        return await identifyPOIGaps(pois, tripContext)
      },
      {
        useServerClient: true,
        apiName: 'groq'
      }
    )

    console.log(`✅ Found ${gaps.length} POI gaps`)

    return NextResponse.json({
      success: true,
      gaps,
      count: gaps.length
    })
  } catch (error) {
    console.error('Identify POI gaps API error:', error)
    return NextResponse.json(
      { error: 'Failed to identify POI gaps', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

