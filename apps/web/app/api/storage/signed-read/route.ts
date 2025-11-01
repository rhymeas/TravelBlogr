import { NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'

// Buckets we allow signing for (avoid arbitrary bucket abuse)
const ALLOWED_BUCKETS = new Set([
  'trip-images',
  'profile-avatars',
  'location-images',
  'images'
])

function parseBucketAndPathFromUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url)
    // Expect: /storage/v1/object/public/<bucket>/<path...>
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex(p => p === 'object')
    if (idx === -1 || idx + 2 >= parts.length) return null

    // parts[idx+1] may be 'public' but we want actual bucket as the next segment
    const maybePublic = parts[idx + 1]
    const bucket = parts[idx + 2]
    const pathParts = parts.slice(idx + 3)

    if (!bucket || pathParts.length === 0) return null
    return { bucket, path: decodeURIComponent(pathParts.join('/')) }
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get('imageId')
    const url = searchParams.get('url')
    const expiresInParam = searchParams.get('expiresIn')
    const expiresIn = Math.min(Math.max(Number(expiresInParam) || 3600, 60), 24 * 3600) // 1h default, 1d max

    const supabaseServer = await createServerSupabase()
    const service = createServiceSupabase()

    // Strategy A: imageId provided (preferred) → enforce visibility
    if (imageId) {
      // trip_feed_images: id, image_url, posted_by, visibility_level
      const { data: row, error } = await service
        .from('trip_feed_images')
        .select('id, image_url, posted_by, visibility_level')
        .eq('id', imageId)
        .maybeSingle()

      if (error || !row) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      // If not public, require auth and ownership (simple, safe rule)
      if (row.visibility_level !== 'public') {
        const { data: auth } = await supabaseServer.auth.getUser()
        if (!auth?.user || auth.user.id !== row.posted_by) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }

      const parsed = parseBucketAndPathFromUrl(row.image_url)
      if (!parsed) {
        return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
      }
      if (!ALLOWED_BUCKETS.has(parsed.bucket)) {
        return NextResponse.json({ error: 'Bucket not allowed' }, { status: 400 })
      }

      const { data: signed, error: signErr } = await service
        .storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, expiresIn)

      if (signErr || !signed?.signedUrl) {
        return NextResponse.json({ error: signErr?.message || 'Failed to sign URL' }, { status: 500 })
      }

      return NextResponse.json({ signedUrl: signed.signedUrl })
    }

    // Strategy B: raw URL provided → require auth (to prevent anonymous abuse)
    if (url) {
      const { data: auth } = await supabaseServer.auth.getUser()
      if (!auth?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const parsed = parseBucketAndPathFromUrl(url)
      if (!parsed) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }
      if (!ALLOWED_BUCKETS.has(parsed.bucket)) {
        return NextResponse.json({ error: 'Bucket not allowed' }, { status: 400 })
      }

      const { data: signed, error: signErr } = await service
        .storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, expiresIn)

      if (signErr || !signed?.signedUrl) {
        return NextResponse.json({ error: signErr?.message || 'Failed to sign URL' }, { status: 500 })
      }

      return NextResponse.json({ signedUrl: signed.signedUrl })
    }

    return NextResponse.json({ error: 'Missing imageId or url' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

