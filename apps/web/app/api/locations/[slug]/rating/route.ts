import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

/**
 * POST /api/locations/[slug]/rating
 * Submit or update a rating for a location
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rating } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Verify location exists and get ID
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if user already rated this location
    const { data: existingRating } = await supabase
      .from('location_ratings')
      .select('id')
      .eq('location_id', location.id)
      .eq('user_id', user.id)
      .single()

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await supabase
        .from('location_ratings')
        .update({
          rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRating.id)

      if (updateError) {
        console.error('Error updating rating:', updateError)
        return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 })
      }
    } else {
      // Create new rating
      const { error: insertError } = await supabase
        .from('location_ratings')
        .insert({
          location_id: location.id,
          user_id: user.id,
          rating
        })

      if (insertError) {
        console.error('Error creating rating:', insertError)
        return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 })
      }
    }

    // Calculate new average rating
    const { data: ratings, error: ratingsError } = await supabase
      .from('location_ratings')
      .select('rating')
      .eq('location_id', location.id)

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError)
      return NextResponse.json({ error: 'Failed to calculate average' }, { status: 500 })
    }

    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    const ratingCount = ratings.length

    // Update location with new average
    await supabase
      .from('locations')
      .update({
        rating: averageRating,
        rating_count: ratingCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

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
    const supabase = createServerSupabase()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ userRating: null })
    }

    // Get location ID from slug
    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (!location) {
      return NextResponse.json({ userRating: null })
    }

    const { data: rating } = await supabase
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

