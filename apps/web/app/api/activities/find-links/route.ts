import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getWikipediaLink(query: string) {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
    if (!res.ok) return null
    const data = await res.json()
    const url = data?.content_urls?.desktop?.page || data?.content_urls?.mobile?.page
    if (url) return { title: data.title || query, url, source: 'wikipedia' as const }
  } catch {}
  return null
}

async function getWikivoyageLink(query: string) {
  try {
    const api = `https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(api)
    if (!res.ok) return null
    const data = await res.json()
    const first = data?.query?.search?.[0]
    if (first?.title) {
      const url = `https://en.wikivoyage.org/wiki/${encodeURIComponent(first.title)}`
      return { title: first.title, url, source: 'wikivoyage' as const }
    }
  } catch {}
  return null
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

    const [wiki, voyage] = await Promise.all([
      getWikipediaLink(query),
      getWikivoyageLink(query)
    ])

    const google = { title: `${activityName} ${locationName} on Google`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}` , source: 'google' as const }

    const links = [wiki, voyage, google].filter(Boolean)
    return NextResponse.json({ success: true, links })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

