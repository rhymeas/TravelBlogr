import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50)

    if (!locationId) {
      return NextResponse.json({ success: false, error: 'locationId required' }, { status: 400 })
    }

    const cacheKey = CacheKeys.activityData(`loc:${locationId}:lim:${limit}`)

    const activities = await getOrSet(
      cacheKey,
      async () => {
        const supabase = createServiceSupabase()
        // Source of truth: activities JSON on locations table (see add-activity route)
        const { data, error } = await supabase
          .from('locations')
          .select('activities')
          .eq('id', locationId)
          .single()
        if (error) throw new Error(error.message)
        const arr = (data?.activities || []) as any[]
        const mapped = arr.slice(0, limit).map((a) => ({
          id: a.id,
          location_id: locationId,
          activity_name: a.name,
          description: a.description || null,
          category: a.category || null,
          duration_minutes: null, // original stored as string duration; keep null in public list
          cost_level: a.cost || null,
          tags: Array.isArray(a.tags) ? a.tags : null,
          image_url: a.image_url || null,
          link_url: a.link_url || null,
          source: a.link_source || null,
          type: a.category || null,
        }))
        return mapped
      },
      CacheTTL.VERY_LONG // 7 days
    )

    return NextResponse.json({ success: true, activities })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

