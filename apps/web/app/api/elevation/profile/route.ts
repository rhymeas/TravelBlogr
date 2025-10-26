import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Build a downsampled list of coordinates to avoid huge payloads
function downsampleCoords(coords: number[][], maxPoints = 200): { lat: number; lng: number }[] {
  if (!coords || coords.length === 0) return []
  const step = Math.max(1, Math.ceil(coords.length / maxPoints))
  const sampled: { lat: number; lng: number }[] = []
  for (let i = 0; i < coords.length; i += step) {
    const [lng, lat] = coords[i]
    sampled.push({ lat, lng })
  }
  // Ensure last point is included
  const last = coords[coords.length - 1]
  const lastSample = sampled[sampled.length - 1]
  if (!lastSample || lastSample.lat !== last[1] || lastSample.lng !== last[0]) {
    sampled.push({ lat: last[1], lng: last[0] })
  }
  return sampled
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const coords: Array<{ longitude: number; latitude: number }> | number[][] = body?.coordinates

    if (!coords || !Array.isArray(coords) || coords.length < 2) {
      return NextResponse.json({ error: 'coordinates required' }, { status: 400 })
    }

    // Normalize to [[lng,lat], ...]
    const arr: number[][] = Array.isArray(coords[0])
      ? (coords as number[][])
      : (coords as Array<{ longitude: number; latitude: number }>).map(c => [c.longitude, c.latitude])

    const sampled = downsampleCoords(arr)

    // Call Open-Elevation once with all sampled points
    const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: sampled.map(s => ({ latitude: s.lat, longitude: s.lng })) })
    })

    if (!res.ok) {
      return NextResponse.json({ elevations: [], distances: [] }, { status: 200 })
    }

    const data = await res.json()
    const elevations: number[] = (data?.results || []).map((r: any) => Number(r.elevation) || 0)

    // Build cumulative distances (km) for sampled points
    const distances: number[] = []
    let cum = 0
    for (let i = 0; i < sampled.length; i++) {
      if (i === 0) {
        distances.push(0)
      } else {
        cum += haversineKm(sampled[i-1].lat, sampled[i-1].lng, sampled[i].lat, sampled[i].lng)
        distances.push(cum)
      }
    }

    return NextResponse.json({ elevations, distances })
  } catch (error) {
    console.error('elevation/profile error', error)
    return NextResponse.json({ elevations: [], distances: [] }, { status: 200 })
  }
}

