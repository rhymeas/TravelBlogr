import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function truncateToSentences(text: string, maxSentences = 3): string {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
  return sentences.slice(0, maxSentences).join(' ').trim()
}

async function getWikipediaSummary(topic: string): Promise<string | null> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`)
    if (!res.ok) return null
    const data = await res.json()
    const extract = data?.extract as string | undefined
    return extract ? truncateToSentences(extract, 3) : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activityName = searchParams.get('activityName') || ''
    const locationName = searchParams.get('locationName') || ''
    const country = searchParams.get('country') || ''

    if (!activityName || !locationName) {
      return NextResponse.json({ success: false, error: 'Missing activityName or locationName' }, { status: 400 })
    }

    const query = `${activityName} ${locationName} ${country}`.trim()

    // Free-first: Wikipedia summary; ensure max 3 short sentences
    const summary = await getWikipediaSummary(query)
    const fallback = `A noteworthy activity in ${locationName}${country ? `, ${country}` : ''}.`
    const description = summary || fallback

    return NextResponse.json({ success: true, description })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

