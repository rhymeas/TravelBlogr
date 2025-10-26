import { NextResponse } from 'next/server'
import { searchPOIsNearLocation } from '@/lib/services/braveSearchService'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))
    const radius = Number(searchParams.get('radius') || 25)
    const category = (searchParams.get('category') as any) || undefined

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
    }

    const pois = await searchPOIsNearLocation(lat, lng, radius, category)
    return NextResponse.json({ pois })
  } catch (error) {
    console.error('POIs API error:', error)
    return NextResponse.json({ pois: [] }, { status: 200 })
  }
}

