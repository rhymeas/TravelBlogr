import { NextRequest, NextResponse } from 'next/server'
import { fetchActivityImage } from '@/lib/services/robustImageService'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activityName = searchParams.get('activityName') || ''
    const locationName = searchParams.get('locationName') || ''
    const country = searchParams.get('country') || undefined

    if (!activityName || !locationName) {
      return NextResponse.json({ success: false, error: 'Missing activityName or locationName' }, { status: 400 })
    }

    // Enhanced: Include country for better contextualization
    const url = await fetchActivityImage(activityName, locationName, country)
    return NextResponse.json({ success: true, url })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

