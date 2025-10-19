import { NextRequest, NextResponse } from 'next/server'
import { generateKeywordSuggestions } from '@/lib/services/aiContentAssistant'
import { getLocationIntelligence } from '@/lib/services/locationIntelligenceService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/keywords
 * Generate SEO keyword suggestions based on destination and location intelligence
 */
export async function POST(request: NextRequest) {
  try {
    const { destination } = await request.json()

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Generating keywords for: ${destination}`)

    // Get location intelligence first (our data)
    const intelligence = await getLocationIntelligence(destination, true)

    // Generate keywords using GROQ with our intelligence data
    const keywords = await generateKeywordSuggestions(destination, intelligence)

    return NextResponse.json({
      success: true,
      keywords,
      dataSource: {
        hasLocation: !!intelligence.location,
        poisCount: intelligence.pois.length,
        activitiesCount: intelligence.activities.length,
        tripsCount: intelligence.existingTrips.length,
        blogPostsCount: intelligence.existingBlogPosts.length
      }
    })
  } catch (error) {
    console.error('Error generating keywords:', error)
    return NextResponse.json(
      { error: 'Failed to generate keywords' },
      { status: 500 }
    )
  }
}

