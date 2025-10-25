import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCached, deleteCached } from '@/lib/upstash'
import { isImageKitConfigured, getImageKitEndpoint } from '@/lib/image-cdn'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function checkBrave(): Promise<{ ok: boolean; details: string }> {
  const key = process.env.BRAVE_SEARCH_API_KEY || process.env.NEXT_PUBLIC_BRAVE_SEARCH_API_KEY
  if (!key) return { ok: false, details: 'BRAVE_SEARCH_API_KEY missing' }

  try {
    const controller = AbortController ? new AbortController() : undefined
    const signal = controller ? controller.signal : undefined
    if (controller) setTimeout(() => controller.abort(), 3000)

    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent('travel landscape')}&count=1`,
      { headers: { 'Accept': 'application/json', 'X-Subscription-Token': key }, signal }
    )
    if (!res.ok) return { ok: false, details: `HTTP ${res.status}` }
    const json = await res.json().catch(() => ({}))
    const ok = Array.isArray(json?.results) || Array.isArray(json?.images) || !!json
    return { ok: !!ok, details: ok ? 'reachable' : 'unexpected response' }
  } catch (e: any) {
    return { ok: false, details: e?.name === 'AbortError' ? 'timeout' : (e?.message || 'network error') }
  }
}

async function checkUpstash(): Promise<{ ok: boolean; details: string }> {
  try {
    const key = `health:${Date.now()}`
    const value = { ts: Date.now() }
    const set = await setCached(key, value, 10)
    const got = await getCached<typeof value>(key)
    await deleteCached(key)
    const ok = !!set && !!got && got?.ts === value.ts
    return { ok, details: ok ? 'set/get/del ok' : 'redis mismatch' }
  } catch (e: any) {
    return { ok: false, details: e?.message || 'redis error' }
  }
}

function checkImageKit(): { ok: boolean; details: string; endpoint?: string } {
  const ok = isImageKitConfigured()
  return { ok, details: ok ? 'configured' : 'missing env', endpoint: ok ? getImageKitEndpoint() : undefined }
}

export async function GET(_req: NextRequest) {
  const [brave, upstash] = await Promise.all([checkBrave(), checkUpstash()])
  const imagekit = checkImageKit()

  const status = {
    brave,
    imagekit,
    upstash,
    ok: brave.ok && imagekit.ok && upstash.ok,
    timestamp: new Date().toISOString()
  }

  // 200 if all ok, 503 if any provider failing
  return NextResponse.json(status, { status: status.ok ? 200 : 503 })
}

