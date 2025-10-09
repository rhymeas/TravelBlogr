import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

/**
 * POST /api/locations/[slug]/view
 * Track a page view for a location
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createServerSupabase()

    // Get optional user (views can be anonymous)
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { timestamp, referrer, userAgent } = body

    // Verify location exists and get ID
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, view_count')
      .eq('slug', params.slug)
      .single()

    if (locationError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Get IP address for deduplication (optional)
    const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'

    // Record the view
    const { error: viewError } = await supabase
      .from('location_views')
      .insert({
        location_id: location.id,
        user_id: user?.id || null,
        ip_address: ip,
        referrer: referrer || null,
        user_agent: userAgent || null,
        viewed_at: timestamp || new Date().toISOString()
      })

    if (viewError) {
      console.error('Error recording view:', viewError)
      // Don't fail the request if view tracking fails
    }

    // Increment view count on location
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        view_count: (location.view_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

    if (updateError) {
      console.error('Error updating view count:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error tracking view:', error)
    // Return success anyway - tracking shouldn't break the page
    return NextResponse.json({ success: true })
  }
}

