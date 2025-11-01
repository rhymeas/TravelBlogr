import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Simple Haversine distance in kilometers
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug') || undefined
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')
    const limit = Math.min(parseInt(searchParams.get('limit') || '48'), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const radiusKm = Math.min(Math.max(parseInt(searchParams.get('radiusKm') || '100'), 1), 500)

    // Resolve coordinates by slug if provided
    let centerLat: number | null = null
    let centerLng: number | null = null

    let locName: string | null = null
    if (slug) {
      const { data: loc, error: locErr } = await supabase
        .from('locations')
        .select('id, name, slug, latitude, longitude')
        .eq('slug', slug)
        .maybeSingle()

      if (locErr) {
        console.error('Fetch location failed', locErr)
        return NextResponse.json({ error: 'Failed to resolve location' }, { status: 500 })
      }
      if (!loc || loc.latitude == null || loc.longitude == null) {
        return NextResponse.json({ error: 'Location not found or missing coordinates' }, { status: 404 })
      }
      centerLat = Number(loc.latitude)
      centerLng = Number(loc.longitude)
      locName = String(loc.name)
    } else if (latParam && lngParam) {
      centerLat = parseFloat(latParam)
      centerLng = parseFloat(lngParam)
    } else {
      return NextResponse.json({ error: 'Provide either slug or lat/lng' }, { status: 400 })
    }

    // Fetch a pool (larger than page) of recent public images then filter by radius
    const poolSize = Math.max(limit * 5, 200) // pull extra to filter client-side
    const { data, error } = await supabase
      .from('trip_feed_images')
      .select(`
        id,
        image_url,
        caption,
        location_name,
        location_coordinates,
        created_at,
        user:profiles!trip_feed_images_user_id_profiles_fkey (
          id,
          full_name,
          username,
          avatar_url
        ),
        trip:trips!trip_id (
          id,
          title,
          slug,
          privacy
        )
      `)
      .eq('trip.privacy', 'public')
      .order('created_at', { ascending: false })
      .range(0, poolSize - 1)

    if (error) {
      console.error('Fetch location feed failed', error)
      return NextResponse.json({ error: 'Failed to fetch location feed' }, { status: 500 })
    }

    // Also include user uploads from activity_feed with coordinates
    const { data: afData, error: afErr } = await supabase
      .from('activity_feed')
      .select('id, created_at, data')
      .in('type', ['photo_upload', 'video_upload'])
      .order('created_at', { ascending: false })
      .range(0, poolSize - 1)

    if (afErr) {
      console.warn('Fetch activity_feed supplement failed', afErr)
    }

    type Row = any
    const tripItems: Row[] = (data || []).filter((row: any) => {
      const coords = row?.location_coordinates
      if (coords && coords.lat != null && coords.lng != null) {
        const d = distanceKm(centerLat!, centerLng!, Number(coords.lat), Number(coords.lng))
        return d <= radiusKm
      }
      // Fallback: if coordinates missing, include if location_name matches current location name (best-effort)
      if (locName && row?.location_name) {
        try {
          const a = String(row.location_name).toLowerCase()
          const b = String(locName).toLowerCase()
          return a.includes(b)
        } catch {}
      }
      return false
    })

    const afItems: Row[] = (afData || [])
      .map((r: any) => {
        const img = r?.data?.image_url || (Array.isArray(r?.data?.images) ? r.data.images[0] : null)
        const coords = r?.data?.location_coordinates || null
        return img ? {
          id: `af_${r.id}`,
          image_url: img,
          caption: r?.data?.caption || null,
          location_name: r?.data?.location || null,
          location_coordinates: coords,
          created_at: r.created_at,
          user: null,
          trip: null
        } : null
      })
      .filter(Boolean)
      .filter((row: any) => {
        const coords = row?.location_coordinates
        if (coords && coords.lat != null && coords.lng != null) {
          const d = distanceKm(centerLat!, centerLng!, Number(coords.lat), Number(coords.lng))
          return d <= radiusKm
        }
        if (locName && row?.location_name) {
          try {
            const a = String(row.location_name).toLowerCase()
            const b = String(locName).toLowerCase()
            return a.includes(b)
          } catch {}
        }
        return false
      })

    // Merge, sort by created_at desc, de-duplicate by id and image_url
    const seen = new Set<string>()
    const images = [...tripItems, ...afItems]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((row: any) => {
        const key = `${row.id}:${row.image_url}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

    const sliced = images.slice(offset, offset + limit)

    return NextResponse.json({ success: true, images: sliced })
  } catch (err) {
    console.error('GET /api/feed/location error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

