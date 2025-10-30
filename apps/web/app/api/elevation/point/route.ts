import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Free, no-key elevation lookup using Open-Elevation
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
    }

    // Try Open-Elevation first, fallback to Open-Meteo if it fails
    let elevation: number | null = null

    try {
      const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: [{ latitude: lat, longitude: lng }] }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (res.ok) {
        const data = await res.json()
        elevation = data?.results?.[0]?.elevation ?? null
      }
    } catch (error) {
      console.warn('Open-Elevation failed, trying Open-Meteo:', error)
    }

    // Fallback to Open-Meteo if Open-Elevation failed
    if (elevation === null) {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`, {
          signal: AbortSignal.timeout(5000)
        })

        if (res.ok) {
          const data = await res.json()
          elevation = data?.elevation?.[0] ?? null
        }
      } catch (error) {
        console.warn('Open-Meteo also failed:', error)
      }
    }

    return NextResponse.json({ elevation })
  } catch (error) {
    console.error('Elevation point API error:', error)
    return NextResponse.json({ elevation: null }, { status: 200 })
  }
}

