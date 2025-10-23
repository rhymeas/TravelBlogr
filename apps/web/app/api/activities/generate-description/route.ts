import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function truncateToSentences(text: string, maxSentences = 2): string {
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
    return extract ? truncateToSentences(extract, 2) : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activityName = searchParams.get('activityName') || ''
    const locationName = searchParams.get('locationName') || ''

    if (!activityName || !locationName) {
      return NextResponse.json({ success: false, error: 'Missing activityName or locationName' }, { status: 400 })
    }

    const query = `${activityName} ${locationName}`

    // Free-first: Wikipedia summary fallback to a generic sentence
    const summary = await getWikipediaSummary(query)
    const description = summary || `A noteworthy activity in ${locationName}.`

    return NextResponse.json({ success: true, description })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

