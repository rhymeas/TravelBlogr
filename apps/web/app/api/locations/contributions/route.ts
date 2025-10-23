import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId is required' },
        { status: 400 }
      )
    }

    // Fetch recent contributions with user profiles
    // NOTE: Can't use foreign key hint because user_id references auth.users, not profiles
    // Instead, we'll fetch contributions and profiles separately, then join in code
    const { data: contributionsData, error: contributionsError } = await supabase
      .from('location_contributions')
      .select('id, contribution_type, field_edited, change_snippet, created_at, user_id, new_value')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (contributionsError) {
      console.error('Error fetching contributions:', contributionsError)
      return NextResponse.json(
        { error: 'Failed to fetch contributions' },
        { status: 500 }
      )
    }

    // Fetch profiles for all contributors
    const userIds = [...new Set(contributionsData?.map(c => c.user_id) || [])]
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    // Join contributions with profiles
    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
    const contributions = contributionsData?.map(c => ({
      ...c,
      profiles: profilesMap.get(c.user_id) || null
    })) || []

    // Fetch top contributors
    const { data: topContributors, error: topError } = await supabase
      .rpc('get_location_top_contributors', {
        p_location_id: locationId,
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

