import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/utils/adminCheck'
import { generateLocationSlug } from '@/lib/utils/locationSlug'
import { deleteCached, CacheKeys } from '@/lib/upstash'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createServerSupabase()
    const supabaseAdmin = createServiceSupabase()

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (!isAdmin(user.email)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dryRun = searchParams.get('dryRun') !== 'false' // default true
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

    // Fetch locations
    let query = supabaseAdmin
      .from('locations')
      .select('id, slug, name, region, country')
      .order('created_at', { ascending: false })
    if (limit) query = query.limit(limit)

    const { data: locations, error } = await query
    if (error) {
      console.error('Failed to fetch locations:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({ success: true, message: 'No locations found', results: [] })
    }

    const results: Array<{ id: string; oldSlug: string; newSlug: string; changed: boolean; reason?: string }> = []
    let updated = 0

    // Index existing slugs for quick collision check
    const existing = new Set<string>(locations.map((l: any) => l.slug))

    for (const loc of locations) {
      const newSlugBase = generateLocationSlug(loc.name, loc.region, loc.country)
      let newSlug = newSlugBase
      if (!newSlug || newSlug === loc.slug) {
        results.push({ id: loc.id, oldSlug: loc.slug, newSlug: loc.slug, changed: false })
        continue
      }

      // Resolve collisions
      let attempt = 1
      while (existing.has(newSlug) && newSlug !== loc.slug) {
        const suffix = attempt === 1 ? '-2' : `-${attempt + 1}`
        newSlug = `${newSlugBase}${suffix}`
        attempt++
        if (attempt > 5) {
          // fallback to short id suffix
          newSlug = `${newSlugBase}-${loc.id.slice(0, 4)}`
          break
        }
      }

      results.push({ id: loc.id, oldSlug: loc.slug, newSlug, changed: true, reason: 'canonicalized' })
      if (!dryRun) existing.add(newSlug)
    }

    if (!dryRun) {
      for (const r of results.filter((x) => x.changed)) {
        const { error: upErr } = await supabaseAdmin
          .from('locations')
          .update({ slug: r.newSlug, updated_at: new Date().toISOString() })
          .eq('id', r.id)
        if (upErr) {
          console.error('Failed to update slug for', r.id, upErr)
          continue
        }
        updated++
        // Invalidate caches (Upstash first)
        await deleteCached(CacheKeys.location(r.oldSlug))
        await deleteCached(CacheKeys.location(r.newSlug))
        // Revalidate Next.js cache
        try {
          revalidatePath(`/locations/${r.oldSlug}`)
          revalidatePath(`/locations/${r.newSlug}`)
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      updated,
      total: locations.length,
      changes: results.slice(0, 50)
    })
  } catch (error) {
    console.error('POST /api/admin/normalize-slugs error', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

