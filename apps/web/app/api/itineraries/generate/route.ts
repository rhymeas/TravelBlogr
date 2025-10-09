/**
 * API Route: Generate plan
 * POST /api/itineraries/generate
 * 
 * Presentation layer - handles HTTP requests/responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { GenerateplanUseCase } from '@/lib/itinerary/application/use-cases/GenerateItineraryUseCase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/itineraries/generate
 * Generate a new plan
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Parse request body
    const body = await request.json()

    // 2. Validate required fields
    const { from, to, startDate, endDate } = body
    if (!from || !to || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: {
            required: ['from', 'to', 'startDate', 'endDate'],
            received: Object.keys(body)
          }
        },
        { status: 400 }
      )
    }

    // 3. Execute use case
    const useCase = new GenerateplanUseCase()
    const result = await useCase.execute({
      from: body.from,
      to: body.to,
      stops: body.stops || [], // Include stops if provided
      startDate: body.startDate,
      endDate: body.endDate,
      interests: body.interests || [],
      budget: body.budget || 'moderate'
    })

    // 4. Handle result
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      )
    }

    const generationTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: result.plan?.toJSON(),
      resolvedLocations: result.resolvedLocations || [],
      locationImages: result.locationImages || {},
      meta: {
        generationTimeMs: generationTime,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ API Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/itineraries/generate
 * Get API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/itineraries/generate',
    method: 'POST',
    description: 'Generate a travel plan using AI',
    requestBody: {
      from: 'string (required) - Origin location slug (e.g., "tokyo")',
      to: 'string (required) - Destination location slug (e.g., "kyoto")',
      startDate: 'string (required) - ISO date (e.g., "2025-05-15")',
      endDate: 'string (required) - ISO date (e.g., "2025-05-20")',
      interests: 'string[] (optional) - e.g., ["temples", "food", "nature"]',
      budget: 'string (optional) - "budget" | "moderate" | "luxury" (default: "moderate")'
    },
    example: {
      from: 'tokyo',
      to: 'kyoto',
      startDate: '2025-05-15',
      endDate: '2025-05-20',
      interests: ['temples', 'food'],
      budget: 'moderate'
    },
    response: {
      success: true,
      data: {
        id: 'uuid',
        title: 'Trip title',
        summary: 'Trip summary',
        days: [
          {
            day: 1,
            date: '2025-05-15',
            location: 'Tokyo',
            type: 'stay',
            items: [
              {
                time: '09:00',
                title: 'Activity name',
                type: 'activity',
                duration: 2,
                description: 'Description',
                costEstimate: 50
              }
            ]
          }
        ],
        totalCostEstimate: 500,
        tips: ['Tip 1', 'Tip 2'],
        stats: {
          totalDays: 5,
          stayDays: 4,
          travelDays: 1,
          locations: ['Tokyo', 'Kyoto'],
          totalActivities: 12,
          totalMeals: 15,
          averageCostPerDay: 100
        }
      },
      meta: {
        generationTimeMs: 2000,
        generatedAt: '2025-01-06T12:00:00Z'
      }
    }
  })
}

