import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { deleteCached, CacheKeys } from '@/lib/upstash'
import { revalidatePath } from 'next/cache'

// Force dynamic rendering for location routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/locations/[slug]/rating
 * Submit or update a rating for a location
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await createServerSupabase()         // for auth only
    const admin = createServiceSupabase()             // service role for DB writes

    // Get current user
    const { data: { user } } = await auth.auth.getUser()
    let userId = user?.id
    let userEmail = user?.email

    // Dev convenience: allow mock headers if no session
    if (!userId) {
      const mockUserId = request.headers.get('x-mock-user-id')
      const mockUserEmail = request.headers.get('x-mock-user-email')
      if (mockUserId && mockUserEmail) {
        userId = mockUserId
        userEmail = mockUserEmail
        console.log('🔧 Using mock auth:', { userId, userEmail })
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { rating } = await request.json()

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Verify location exists and get ID
    const { data: location, error: locationError } = await admin
      .from('locations')
      .select('id, slug')
      .eq('slug', params.slug)
      .single()

    if (locationError || !location) {
      console.error('❌ Location not found:', { slug: params.slug, error: locationError })
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Upsert user rating
    const { data: existing } = await admin
      .from('location_ratings')
      .select('id')
      .eq('location_id', location.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await admin
        .from('location_ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) {
        console.error('Error updating rating:', error)
        return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 })
      }
    } else {
      const { error } = await admin
        .from('location_ratings')
        .insert({ location_id: location.id, user_id: userId, rating })
      if (error) {
        console.error('Error creating rating:', error)
        return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 })
      }
    }

    // Recompute cached average/count
    const { data: ratings, error: ratingsError } = await admin
      .from('location_ratings')
      .select('rating')
      .eq('location_id', location.id)
    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError)
      return NextResponse.json({ error: 'Failed to calculate average' }, { status: 500 })
    }

    const averageRating = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0
    const ratingCount = ratings.length

    // Update location cached fields
    await admin
      .from('locations')
      .update({
        rating: averageRating,
        rating_count: ratingCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

    // Log contribution (non-critical)
    try {
      await admin
        .from('location_contributions')
        .insert({
          user_id: userId,
          location_id: location.id,
          contribution_type: 'rating',
          field_edited: 'rating',
          change_snippet: `Rated ${rating} star${rating === 1 ? '' : 's'}`,
          new_value: { rating }
        })
    } catch (e) {
      console.log('⚠️ Failed to log rating contribution:', e)
    }

    // Invalidate caches: Upstash first, then Next.js
    try {
      await deleteCached(CacheKeys.location(params.slug))
      await deleteCached(`${CacheKeys.location(params.slug)}:related`)
    } catch (e) {
      console.log('⚠️ Upstash cache invalidation failed:', e)
    }
    try {
      revalidatePath(`/locations/${params.slug}`)
      revalidatePath('/locations')
    } catch (e) {
      console.log('⚠️ Next.js revalidate failed:', e)
    }

    return NextResponse.json({
      success: true,
      averageRating: Number(averageRating.toFixed(1)),
      ratingCount,
      userRating: rating
    })
  } catch (error) {
    console.error('Unexpected error submitting rating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/locations/[slug]/rating
 * Get user's rating for a location
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const auth = await createServerSupabase()
    const { data: { user } } = await auth.auth.getUser()

    if (!user) {
      return NextResponse.json({ userRating: null })
    }

    // Get location ID from slug
    const { data: location } = await createServiceSupabase()
      .from('locations')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (!location) {
      return NextResponse.json({ userRating: null })
    }

    const { data: rating } = await createServiceSupabase()
      .from('location_ratings')
      .select('rating')
      .eq('location_id', location.id)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ userRating: rating?.rating || null })
  } catch (error) {
    console.error('Error fetching user rating:', error)
    return NextResponse.json({ userRating: null })
  }
}

