import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!tripId) {
      return NextResponse.json(
        { error: 'tripId is required' },
        { status: 400 }
      )
    }

    // Fetch recent contributions with user profiles
    const { data: contributions, error } = await supabase
      .from('trip_contributions')
      .select(`
        id,
        contribution_type,
        field_edited,
        change_snippet,
        created_at,
        profiles!user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching contributions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contributions' },
        { status: 500 }
      )
    }

    // Fetch top contributors
    const { data: topContributors, error: topError } = await supabase
      .rpc('get_trip_top_contributors', {
        p_trip_id: tripId,
        p_limit: 3
      })

    if (topError) {
      console.error('Error fetching top contributors:', topError)
    }

    return NextResponse.json({
      success: true,
      contributions: contributions || [],
      topContributors: topContributors || []
    })

  } catch (error) {
    console.error('Contributions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

