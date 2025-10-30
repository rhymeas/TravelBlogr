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

    // Try Open-Elevation first, fallback to Open-Meteo if it fails
    let elevations: number[] = []

    try {
      const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: sampled.map(s => ({ latitude: s.lat, longitude: s.lng })) }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (res.ok) {
        const data = await res.json()
        elevations = (data?.results || []).map((r: any) => Number(r.elevation) || 0)
      }
    } catch (error) {
      console.warn('Open-Elevation failed, trying Open-Meteo:', error)
    }

    // Fallback to Open-Meteo if Open-Elevation failed
    if (elevations.length === 0) {
      try {
        // Open-Meteo supports batch elevation queries, but we need to chunk for long routes
        // to avoid URL length limits (max ~2000 chars)
        const CHUNK_SIZE = 100 // Process 100 points at a time
        const chunks: Array<{ lat: number; lng: number }[]> = []

        for (let i = 0; i < sampled.length; i += CHUNK_SIZE) {
          chunks.push(sampled.slice(i, i + CHUNK_SIZE))
        }

        console.log(`🏔️ Fetching elevation from Open-Meteo in ${chunks.length} chunks (${sampled.length} total points)`)

        for (const chunk of chunks) {
          const lats = chunk.map(s => s.lat).join(',')
          const lngs = chunk.map(s => s.lng).join(',')
          const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`, {
            signal: AbortSignal.timeout(10000) // 10 second timeout for batch
          })

          if (res.ok) {
            const data = await res.json()
            const chunkElevations = (data?.elevation || []).map((e: any) => Number(e) || 0)
            elevations.push(...chunkElevations)
          } else {
            console.warn('Open-Meteo chunk failed with status:', res.status)
          }
        }

        console.log(`✅ Open-Meteo returned ${elevations.length} elevation points`)
      } catch (error) {
        console.warn('Open-Meteo also failed:', error)
        return NextResponse.json({ elevations: [], distances: [] }, { status: 200 })
      }
    }

    if (elevations.length === 0) {
      console.warn('⚠️ No elevation data available from any provider')
      return NextResponse.json({ elevations: [], distances: [] }, { status: 200 })
    }

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

    console.log(`✅ Returning ${elevations.length} elevations and ${distances.length} distances`)
    return NextResponse.json({ elevations, distances })
  } catch (error) {
    console.error('elevation/profile error', error)
    return NextResponse.json({ elevations: [], distances: [] }, { status: 200 })
  }
}

