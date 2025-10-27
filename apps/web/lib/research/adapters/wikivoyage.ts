import type { Citation, Entity, AdapterContext } from '../types'

/**
 * Wikivoyage adapter
 * Free MediaWiki API, no key needed.
 * - Search best page by title
 * - Return main page URL
 */
export const wikivoyageAdapter = {
  key: 'wikivoyage',
  async fetch(entity: Entity, ctx: AdapterContext): Promise<Citation[]> {
    try {
      const name = entity.name?.trim()
      if (!name) return []

      const langs = Array.from(new Set([...(ctx.langs || []), ctx.lang || 'en', 'en']))

      for (const lang of langs) {
        const base = `https://${lang}.wikivoyage.org`
        const searchUrl = `${base}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&utf8=&format=json&srlimit=1&origin=*`
        const sRes = await fetch(searchUrl, { next: { revalidate: 60 * 60 } })
        if (!sRes.ok) continue
        const sJson: any = await sRes.json()
        const hit = sJson?.query?.search?.[0]
        if (!hit?.title) continue

        const title = hit.title as string
        const pageUrl = `${base}/wiki/${encodeURIComponent(title.replace(/\s/g, '_'))}`

        const citation: Citation = {
          url: pageUrl,
          title,
          publisher: 'Wikivoyage',
          type: 'wikivoyage'
        }
        return [citation]
      }

      return []
    } catch {
      return []
    }
  }
}

