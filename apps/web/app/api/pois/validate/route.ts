/**
 * API Route: Validate POIs with GROQ
 * 
 * Uses GROQ AI to validate POI relevance for the trip context.
 * Results are cached for 3 days.
 */

import { NextRequest, NextResponse } from 'next/server'
import { smartFetch } from '@/lib/services/smartDataHandler'
import { validatePOIRelevance } from '@/lib/services/groqPOIOrchestrator'
import { isFeatureEnabled } from '@/lib/featureFlags'

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isFeatureEnabled('GROQ_POI_VALIDATION')) {
      return NextResponse.json({ 
        pois: [],
        message: 'GROQ POI validation is disabled'
      })
    }

    const { pois, tripContext } = await request.json()

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

    console.log(`🤖 Validating ${pois.length} POIs with GROQ`)

    // Validate POIs with GROQ (cached for 3 days)
    const validated = await smartFetch(
      `validated_${tripContext.from}_${tripContext.to}_${tripContext.travelType}`,
      'groqValidation',
      async () => {
        return await validatePOIRelevance(pois, tripContext)
      },
      { 
        useServerClient: true,
        apiName: 'groq'
      }
    )

    console.log(`✅ Validated ${validated.length} POIs`)

    return NextResponse.json({
      success: true,
      pois: validated,
      count: validated.length,
      validated: true
    })
  } catch (error) {
    console.error('Validate POIs API error:', error)
    return NextResponse.json(
      { error: 'Failed to validate POIs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

