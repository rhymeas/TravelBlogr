/**
 * API Route: Batch Blog Post Generation
 * POST /api/batch/blog-posts
 * 
 * Generate blog posts from trips using GROQ batch API (50% cost savings).
 * Presentation layer - handles HTTP requests/responses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { GenerateBlogPostsFromTripsUseCase } from '@/lib/batch/application/use-cases/GenerateBlogPostsFromTripsUseCase'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const generateBlogPostsSchema = z.object({
  tripIds: z.array(z.string().uuid()).min(1).max(1000),
  autoPublish: z.boolean().default(false),
  includeAffiliate: z.boolean().default(true),
  seoOptimize: z.boolean().default(true)
})

/**
 * POST /api/batch/blog-posts
 * Create a batch job to generate blog posts from trips
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = generateBlogPostsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns all trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, user_id')
      .in('id', validation.data.tripIds)

    if (tripsError) {
      return NextResponse.json(
        { error: 'Failed to fetch trips' },
        { status: 500 }
      )
    }

    if (!trips || trips.length === 0) {
      return NextResponse.json(
        { error: 'No trips found' },
        { status: 404 }
      )
    }

    // Check ownership
    const unauthorizedTrips = trips.filter(trip => trip.user_id !== user.id)
    if (unauthorizedTrips.length > 0) {
      return NextResponse.json(
        { error: 'You do not own all selected trips' },
        { status: 403 }
      )
    }

    // Execute use case
    const useCase = new GenerateBlogPostsFromTripsUseCase()
    const result = await useCase.execute({
      userId: user.id,
      tripIds: validation.data.tripIds,
      autoPublish: validation.data.autoPublish,
      includeAffiliate: validation.data.includeAffiliate,
      seoOptimize: validation.data.seoOptimize
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      batchJob: result.batchJob.toJSON(),
      message: `Batch job created for ${validation.data.tripIds.length} trips`
    })
  } catch (error) {
    console.error('Error in batch blog posts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/batch/blog-posts
 * List user's batch jobs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('batch_jobs')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'blog_posts_from_trips')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobs, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch batch jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      jobs: jobs || []
    })
  } catch (error) {
    console.error('Error fetching batch jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

