/**
 * API Route: Generate POI Search Strategy
 * 
 * Uses GROQ AI to analyze trip context and generate intelligent POI search strategy
 * Results are cached for 7 days (strategies don't change often for same trip type).
 */

import { NextRequest, NextResponse } from 'next/server'
import { smartFetch } from '@/lib/services/smartDataHandler'
import { generatePOISearchStrategy, type TripContext } from '@/lib/services/groqPOIOrchestrator'
import { isFeatureEnabled } from '@/lib/featureFlags'

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isFeatureEnabled('GROQ_POI_VALIDATION')) {
      return NextResponse.json({ 
        strategy: null,
        message: 'GROQ POI strategy generation is disabled'
      })
    }

    const { tripContext } = await request.json() as {
      tripContext: TripContext
    }

    if (!tripContext) {
      return NextResponse.json(
        { error: 'Invalid request: tripContext required' },
        { status: 400 }
      )
    }

    console.log(`🎯 Generating POI search strategy for ${tripContext.from} → ${tripContext.to}`)

    // Generate strategy with GROQ (cached for 7 days)
    const strategy = await smartFetch(
      `strategy_${tripContext.travelType}_${tripContext.budget}_${tripContext.days}`,
      'groq_strategy',
      async () => {
        return await generatePOISearchStrategy(tripContext)
      },
      {
        useServerClient: true,
        apiName: 'groq'
      }
    )

    console.log(`✅ Generated POI search strategy:`, {
      priorityCategories: strategy.priorityCategories.length,
      accommodationNeeds: strategy.accommodationNeeds.count,
      mealBreaks: strategy.mealBreaks.count,
      activities: strategy.activities.count
    })

    return NextResponse.json({
      success: true,
      strategy
    })
  } catch (error) {
    console.error('Generate POI strategy API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate POI strategy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

