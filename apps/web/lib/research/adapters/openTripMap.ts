import type { Citation, Entity, AdapterContext } from '../types'
import { geocodeAddress } from '@/lib/services/nominatimService'

const OTM_BASE = 'https://api.opentripmap.com/0.1'
const OTM_LANG = 'en'

/**
 * OpenTripMap adapter
 * - Free API (requires OPENTRIPMAP_API_KEY)
 * - Uses lat/lon when present; otherwise tries to geocode the name via Nominatim (free)
 * - Returns official site and Wikipedia links for top POIs near the location
 */
export const openTripMapAdapter = {
  key: 'openTripMap',
  async fetch(entity: Entity, ctx: AdapterContext): Promise<Citation[]> {
    const apiKey = process.env.OPENTRIPMAP_API_KEY
    if (!apiKey) return []

    let { lat, lon } = entity

    // Try to geocode if coordinates are missing
    if ((lat == null || lon == null) && entity.name) {
      const geo = await geocodeAddress(entity.name)
      if (geo) {
        lat = geo.lat
        lon = geo.lon
      }
    }

    if (lat == null || lon == null) return []

    try {
      // Fetch nearby places (radius ~5km, higher rated)
      const radiusUrl = `${OTM_BASE}/${OTM_LANG}/places/radius?radius=5000&lon=${lon}&lat=${lat}&rate=2&format=json&limit=${Math.min(
        Math.max((ctx.limit || 5) * 2, 8),
        25
      )}&apikey=${apiKey}`
      const res = await fetch(radiusUrl, { next: { revalidate: 60 * 60 } })
      if (!res.ok) return []
      const places: Array<{ xid: string; name?: string }> = await res.json()
      const top = (places || []).slice(0, 4)

      const details = await Promise.all(
        top.map(async (p) => {
          try {
            const dRes = await fetch(`${OTM_BASE}/${OTM_LANG}/places/xid/${p.xid}?apikey=${apiKey}`, {
              next: { revalidate: 24 * 60 * 60 }
            })
            if (!dRes.ok) return null
            const d = await dRes.json()
            return {
              name: d.name || p.name || 'Point of Interest',
              wikipedia: d.wikipedia || d.wiki || null,
              official: d.url || null,
              otm: d.otm || null,
              snippet: d.wikipedia_extracts?.text || d.info?.descr || ''
            }
          } catch {
            return null
          }
        })
      )

      const out: Citation[] = []
      for (const d of details) {
        if (!d) continue
        if (d.official) {
          out.push({
            url: d.official,
            title: `${d.name} — Official website`,
            publisher: safeHost(d.official),
            type: 'official'
          })
        }
        if (d.wikipedia) {
          out.push({
            url: d.wikipedia,
            title: `${d.name} — Wikipedia`,
            publisher: 'Wikipedia',
            type: 'wikipedia',
            snippet: d.snippet || undefined
          })
        }
        if (d.otm) {
          out.push({
            url: d.otm,
            title: `${d.name} — OpenTripMap`,
            publisher: 'OpenTripMap',
            type: 'poi'
          })
        }
      }

      return out
    } catch {
      return []
    }
  }
}

function safeHost(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return 'official' }
}

