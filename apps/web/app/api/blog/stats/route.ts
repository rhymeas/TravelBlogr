import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * GET /api/blog/stats
 * Fetch blog stats for homepage
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('blog_stats')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ stats: data })
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

