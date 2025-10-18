/**
 * API Route: Generate plan
 * POST /api/itineraries/generate
 * 
 * Presentation layer - handles HTTP requests/responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { GenerateplanUseCase } from '@/lib/itinerary/application/use-cases/GenerateItineraryUseCase'
import { createServerSupabase } from '@/lib/supabase-server'
import { canGenerateAI } from '@/lib/services/creditService'
import { useCreditServer, incrementAIUsageServer } from '@/lib/services/creditService.server'

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

    // 3. Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Debug logging
    console.log('🔐 Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          action: 'login',
        },
        { status: 401 }
      )
    }

    // 4. Check if user is admin (unlimited credits)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    console.log('👤 User role:', { userId: user.id, role: profile?.role, isAdmin })

    // 5. Allow generation without credit check
    // Credits are only checked when user tries to SAVE the plan to their account
    // This allows users to generate plans for free and only pay if they want to save
    // Admins have unlimited credits
    let usedCredit = false

    // 5. Execute use case
    const useCase = new GenerateplanUseCase()
    const result = await useCase.execute({
      from: body.from,
      to: body.to,
      stops: body.stops || [], // Include stops if provided
      startDate: body.startDate,
      endDate: body.endDate,
      interests: body.interests || [],
      budget: body.budget || 'moderate',
      maxTravelHoursPerDay: body.maxTravelHoursPerDay, // Optional travel pacing preference
      transportMode: body.transportMode || 'car', // Transport mode (default: car)
      proMode: body.proMode || false // Pro mode flag (default: false)
    })

    // 7. Handle result
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      )
    }

    // 8. Increment monthly usage counter (for free tier tracking)
    // Skip for admins - they have unlimited usage
    if (!isAdmin) {
      await incrementAIUsageServer(user.id)
    }

    const generationTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      plan: result.plan?.toJSON(), // Use 'plan' instead of 'data' for clarity
      data: result.plan?.toJSON(), // Keep 'data' for backward compatibility
      resolvedLocations: result.resolvedLocations || [],
      locationImages: result.locationImages || {},
      // NEW: expose structured context so the client can render metrics/POIs
      structuredContext: result.structuredContext || null,
      meta: {
        generationTimeMs: generationTime,
        generatedAt: new Date().toISOString(),
        usedCredit,
        isAdmin, // Include admin status in response for debugging
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

