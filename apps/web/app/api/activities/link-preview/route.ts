import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Very small HTML meta extractor without external deps
function extractMetaContent(html: string, selectors: { name?: string; property?: string }[]): string | null {
  for (const sel of selectors) {
    if (sel.property) {
      const re = new RegExp(`<meta[^>]+property=["']${sel.property}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i')
      const m = html.match(re)
      if (m?.[1]) return m[1]
    }
    if (sel.name) {
      const re = new RegExp(`<meta[^>]+name=["']${sel.name}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i')
      const m = html.match(re)
      if (m?.[1]) return m[1]
    }
  }
  return null
}

function resolveUrl(base: string, img: string): string {
  try {
    return new URL(img, base).toString()
  } catch {
    return img
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    if (!url) {
      return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 })
    }

    // Fetch the page HTML (use a basic UA to prevent simple bot blocks)
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogrBot/1.0; +https://travelblogr.com)'
      },
      cache: 'no-store'
    })

    if (!resp.ok) {
      return NextResponse.json({ success: false, error: `Upstream ${resp.status}` }, { status: 502 })
    }

    const html = await resp.text()

    // Try common meta tags first
    const imgRaw = extractMetaContent(html, [
      { property: 'og:image' },
      { property: 'og:image:url' },
      { name: 'twitter:image' },
      { name: 'twitter:image:src' },
    ])

    if (!imgRaw) {
      return NextResponse.json({ success: false, image: null })
    }

    const image = resolveUrl(url, imgRaw)
    return NextResponse.json({ success: true, image })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

