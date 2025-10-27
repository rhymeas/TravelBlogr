import { NextRequest, NextResponse } from 'next/server'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'
import { geocodeAddress } from '@/lib/services/nominatimService'
import { getRoute, type RouteCoordinate, type TransportProfile } from '@/lib/services/routingService'
import { getRouteWithElevation, type ElevationProfile as ElevProfile } from '@/lib/services/elevationService'
import { searchWeb } from '@/lib/services/braveSearchService'

export const runtime = 'nodejs'

function parseLatLng(v?: string | null): { lat: number; lon: number } | null {
  if (!v) return null
  const m = v.split(',').map((x) => parseFloat(x.trim()))
  if (m.length !== 2 || Number.isNaN(m[0]) || Number.isNaN(m[1])) return null
  return { lat: m[0], lon: m[1] }
}

function metersToKm(m: number): number { return Math.round((m / 1000) * 100) / 100 }
function secondsToHrs(s: number): number { return Math.round((s / 3600) * 100) / 100 }

function difficultyByMetrics(distanceKm: number, ascentM?: number, profile?: string): 'easy' | 'moderate' | 'hard' {
  if (profile?.startsWith('driving')) return 'easy'
  const a = ascentM || 0
  if (distanceKm < 10 && a < 250) return 'easy'
  if (distanceKm < 30 && a < 800) return 'moderate'
  return 'hard'
}

function summarizeKomootLike(
  fromLabel: string,
  toLabel: string,
  profile: string,
  distanceKm: number,
  durationHrs: number,
  ascent?: number,
  descent?: number
) {
  const parts: string[] = []
  parts.push(`${profile.includes('cycle') ? 'Cycling' : profile.includes('foot') ? 'Walking' : 'Driving'} route from ${fromLabel} to ${toLabel}`)
  parts.push(`${distanceKm} km · ${durationHrs} h`)
  if (ascent != null && descent != null) parts.push(`↑ ${ascent} m · ↓ ${descent} m`)
  return parts.join(' — ')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profileParam = (searchParams.get('profile') || 'driving-car') as TransportProfile
    const includeElevation = searchParams.get('elevation') === 'true'
    const includeSources = searchParams.get('sources') === 'true'

    const fromQuery = searchParams.get('from') // "lat,lon"
    const toQuery = searchParams.get('to')
    const fromName = searchParams.get('fromName') || ''
    const toName = searchParams.get('toName') || ''

    if (!fromQuery && !fromName) return NextResponse.json({ success: false, error: 'from or fromName is required' }, { status: 400 })
    if (!toQuery && !toName) return NextResponse.json({ success: false, error: 'to or toName is required' }, { status: 400 })

    // Geocode if needed (Nominatim, free)
    const fromLatLng = parseLatLng(fromQuery) || (fromName ? await geocodeAddress(fromName) : null)
    const toLatLng = parseLatLng(toQuery) || (toName ? await geocodeAddress(toName) : null)

    if (!fromLatLng || !toLatLng) {
      return NextResponse.json({ success: false, error: 'Failed to resolve from/to coordinates' }, { status: 400 })
    }

    const fromLabel = fromName || `${fromLatLng.lat.toFixed(4)},${fromLatLng.lon.toFixed(4)}`
    const toLabel = toName || `${toLatLng.lat.toFixed(4)},${toLatLng.lon.toFixed(4)}`

    const fromKey = `${fromLatLng.lat.toFixed(3)},${fromLatLng.lon.toFixed(3)}`
    const toKey = `${toLatLng.lat.toFixed(3)},${toLatLng.lon.toFixed(3)}`

    // Upstash cache-aside for the whole response
    const cacheKey = CacheKeys.transportRoute(fromKey, toKey, profileParam, includeElevation)

    const result = await getOrSet(cacheKey, async () => {
      // Get route (DB-cached under the hood)
      let route
      if (includeElevation) {
        const elev = await getRouteWithElevation([fromLatLng.lon, fromLatLng.lat], [toLatLng.lon, toLatLng.lat], profileParam as any)
        if (!elev) throw new Error('Route with elevation not available')
        route = {
          geometry: elev.geometry,
          distance: elev.distance,
          duration: elev.duration,
          elevationProfile: elev.elevationProfile,
          provider: 'openrouteservice'
        }
      } else {
        const r = await getRoute([
          { latitude: fromLatLng.lat, longitude: fromLatLng.lon },
          { latitude: toLatLng.lat, longitude: toLatLng.lon }
        ], profileParam)
        route = r
      }

      const distanceKm = metersToKm(route.distance)
      const durationHrs = secondsToHrs(route.duration)
      const ascent = (route as any).elevationProfile?.ascent as number | undefined
      const descent = (route as any).elevationProfile?.descent as number | undefined
      const difficulty = difficultyByMetrics(distanceKm, ascent, profileParam)

      const summary = summarizeKomootLike(fromLabel, toLabel, profileParam, distanceKm, durationHrs, ascent, descent)

      let sources: Array<{ title: string; url: string; type: string }> = []
      if (includeSources) {
        const q = `${fromLabel} to ${toLabel} train bus official site timetable`
        const web = await searchWeb(q, 6)
        sources = web
          .filter((w) => w.type === 'official' || w.type === 'guide')
          .slice(0, 4)
          .map((w) => ({ title: w.title, url: w.url, type: w.type }))
      }

      const elevationProfile: ElevProfile | undefined = (route as any).elevationProfile
      return {
        from: { label: fromLabel, lat: fromLatLng.lat, lon: fromLatLng.lon },
        to: { label: toLabel, lat: toLatLng.lat, lon: toLatLng.lon },
        profile: profileParam,
        distanceKm,
        durationHrs,
        ascent,
        descent,
        difficulty,
        provider: route.provider,
        summary,
        geometry: route.geometry,
        elevationProfile: elevationProfile ? {
          elevations: elevationProfile.elevations,
          distances: elevationProfile.distances,
          ascent: elevationProfile.ascent,
          descent: elevationProfile.descent,
          maxElevation: elevationProfile.maxElevation,
          minElevation: elevationProfile.minElevation
        } : undefined,
        sources
      }
    }, CacheTTL.LONG)

    return NextResponse.json({ success: true, data: result }, { status: 200 })
  } catch (error) {
    console.error('GET /api/transport error', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

