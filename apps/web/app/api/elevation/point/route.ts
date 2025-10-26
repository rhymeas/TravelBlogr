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

    const res = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: [{ latitude: lat, longitude: lng }] })
    })

    if (!res.ok) {
      return NextResponse.json({ elevation: null }, { status: 200 })
    }

    const data = await res.json()
    const elevation = data?.results?.[0]?.elevation ?? null
    return NextResponse.json({ elevation })
  } catch (error) {
    console.error('Elevation point API error:', error)
    return NextResponse.json({ elevation: null }, { status: 200 })
  }
}

