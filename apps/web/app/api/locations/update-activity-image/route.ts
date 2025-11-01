import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { deleteCached, CacheKeys } from '@/lib/upstash'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await createServerSupabase()
    const supabaseAdmin = createServiceSupabase()

    // Auth required
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { locationId, activityId, imageUrl } = await request.json()

    if (!locationId || !activityId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If activityId is not a real UUID (e.g., temp-123), skip DB update but return OK so UI flow continues
    if (!isUUID(activityId)) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const { error } = await supabaseAdmin
      .from('activities')
      .update({ image_url: imageUrl })
      .eq('id', activityId)
      .eq('location_id', locationId)

    if (error) {
      console.error('Failed to update activity image:', error)
      return NextResponse.json({ error: 'Failed to update image' }, { status: 500 })
    }

    // Fetch slug for cache invalidation
    let slug: string | null = null
    try {
      const { data: loc, error: locErr } = await supabaseAdmin
        .from('locations')
        .select('slug')
        .eq('id', locationId)
        .single()
      if (!locErr) slug = loc?.slug || null
    } catch {}

    // Invalidate caches (Upstash first, then Next.js) so non-edit mode sees fresh images
    if (slug) {
      try {
        await deleteCached(CacheKeys.location(slug))
        await deleteCached(`${CacheKeys.location(slug)}:related`)
      } catch (cacheErr) {
        console.log('⚠️ Upstash cache invalidation failed (non-critical):', cacheErr)
      }
      try {
        revalidatePath(`/locations/${slug}`)
        revalidatePath(`/locations/${slug}/photos`)
        revalidatePath('/locations')
      } catch (revalErr) {
        console.log('⚠️ Next.js cache revalidation failed (non-critical):', revalErr)
      }
    }

    return NextResponse.json({ success: true, slug, invalidated: !!slug })
  } catch (err) {
    console.error('update-activity-image error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

