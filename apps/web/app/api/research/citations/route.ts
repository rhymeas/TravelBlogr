import { NextResponse } from 'next/server'
import { researchForLocation, buildResearchCacheKey } from '@/lib/research'
import { checkRateLimit, deleteCached, CacheTTL } from '@/lib/upstash'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('location') || undefined
    const limit = Number(searchParams.get('limit') || 5)
    const lang = searchParams.get('lang') || undefined

    if (!slug) {
      return NextResponse.json({ success: false, error: 'location is required' }, { status: 400 })
    }

    const res = await researchForLocation({ slug, limit, lang })
    return NextResponse.json({ success: true, ...res }, { status: 200 })
  } catch (error) {
    console.error('GET /api/research/citations error', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon'
    const rate = await checkRateLimit(`rate:research:${ip}`, 20, 60) // 20/min editing
    if (!rate.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded', retryAt: rate.resetAt }, { status: 429 })
    }

    const body = await req.json()
    const { locationSlug, slug, name, query = '', limit = 5, lang } = body || {}
    const id = locationSlug || slug || name

    if (!id) {
      return NextResponse.json({ success: false, error: 'locationSlug | slug | name is required' }, { status: 400 })
    }

    const res = await researchForLocation({ slug: id, name, query, limit, lang })
    return NextResponse.json({ success: true, ...res }, { status: 200 })
  } catch (error) {
    console.error('POST /api/research/citations error', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

// Optional: cache bust endpoint for admins/editors (future)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('location') || undefined
    const query = searchParams.get('query') || ''
    const limit = Number(searchParams.get('limit') || 5)
    const lang = searchParams.get('lang') || undefined

    if (!slug) return NextResponse.json({ success: false, error: 'location is required' }, { status: 400 })

    const key = buildResearchCacheKey(slug, query, limit, lang || undefined)
    await deleteCached(key)

    return NextResponse.json({ success: true, message: 'Cache invalidated' }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/research/citations error', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

