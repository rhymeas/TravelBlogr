import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { searchImages } from '@/lib/services/braveSearchService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name')?.trim()
    const location = searchParams.get('location')?.trim() || ''
    const category = searchParams.get('category')?.trim() || ''

    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 })
    }

    const supabase = createServiceSupabase()

    // 1) Check cache
    const { data: cached, error: readErr } = await supabase
      .from('poi_images')
      .select('image_url')
      .eq('poi_name', name)
      .eq('location', location)
      .maybeSingle()

    if (!readErr && cached?.image_url) {
      return NextResponse.json({ url: cached.image_url, source: 'cache' })
    }

    // 2) Fetch from Brave Image Search
    const query = `${name} ${location} ${category}`.trim()
    const images = await searchImages(query, 3)
    const imageUrl = images[0]?.thumbnail || images[0]?.url || null

    if (!imageUrl) {
      return NextResponse.json({ url: null, source: 'none' })
    }

    // 3) Save to DB for reuse
    await supabase
      .from('poi_images')
      .upsert({ poi_name: name, location, category, image_url: imageUrl, source: 'brave' })

    return NextResponse.json({ url: imageUrl, source: 'brave' })
  } catch (error) {
    console.error('poi image error', error)
    return NextResponse.json({ url: null, source: 'error' }, { status: 200 })
  }
}

