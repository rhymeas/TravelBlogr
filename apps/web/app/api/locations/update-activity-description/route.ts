import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteCached, CacheKeys } from '@/lib/upstash'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const { locationId, activityId, description, slug } = await req.json()

    if (!locationId || !activityId || !description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getAdmin()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 })
    }

    const { error } = await supabase
      .from('activities')
      .update({ description })
      .eq('id', activityId)
      .eq('location_id', locationId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Invalidate caches: Upstash first, then Next.js paths
    try {
      if (slug) {
        await deleteCached(CacheKeys.location(slug))
        await deleteCached(`${CacheKeys.location(slug)}:related`)
        revalidatePath(`/locations/${slug}`)
        revalidatePath(`/locations/${slug}/photos`)
        revalidatePath('/locations')
      }
    } catch {}

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

