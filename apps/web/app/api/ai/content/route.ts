import { NextRequest, NextResponse } from 'next/server'
import { generateContentFromIntelligence } from '@/lib/services/aiContentAssistant'
import { getLocationIntelligence } from '@/lib/services/locationIntelligenceService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/content
 * Generate blog post content based on destination and location intelligence
 */
export async function POST(request: NextRequest) {
  try {
    const { destination, numberOfDays } = await request.json()

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      )
    }

    console.log(`🤖 Generating content for: ${destination} (${numberOfDays || 7} days)`)

    // Get location intelligence first (our data)
    const intelligence = await getLocationIntelligence(destination, true)

    // Generate content using GROQ with our intelligence data
    const content = await generateContentFromIntelligence(
      destination,
      intelligence,
      numberOfDays
    )

    return NextResponse.json({
      success: true,
      content,
      dataSource: {
        hasLocation: !!intelligence.location,
        poisCount: intelligence.pois.length,
        activitiesCount: intelligence.activities.length,
        tripsCount: intelligence.existingTrips.length,
        blogPostsCount: intelligence.existingBlogPosts.length
      }
    })
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

