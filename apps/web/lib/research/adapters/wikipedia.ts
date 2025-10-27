import type { Citation, Entity, AdapterContext } from '../types'

/**
 * Wikipedia adapter
 * Free MediaWiki Action API, no key needed.
 * - Search best page by title
 * - Return main page URL with short extract
 */
export const wikipediaAdapter = {
  key: 'wikipedia',
  async fetch(entity: Entity, ctx: AdapterContext): Promise<Citation[]> {
    try {
      const name = entity.name?.trim()
      if (!name) return []

      const langs = Array.from(new Set([...(ctx.langs || []), ctx.lang || 'en', 'en']))

      for (const lang of langs) {
        const base = `https://${lang}.wikipedia.org`
        const searchUrl = `${base}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&utf8=&format=json&srlimit=1&origin=*`
        const sRes = await fetch(searchUrl, { next: { revalidate: 60 * 60 } })
        if (!sRes.ok) continue
        const sJson: any = await sRes.json()
        const hit = sJson?.query?.search?.[0]
        if (!hit?.title) continue

        const title = hit.title as string
        const pageUrl = `${base}/wiki/${encodeURIComponent(title.replace(/\s/g, '_'))}`

        // Optional extract for snippet
        const extractUrl = `${base}/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json&origin=*`
        let snippet: string | undefined
        try {
          const eRes = await fetch(extractUrl, { next: { revalidate: 60 * 60 } })
          if (eRes.ok) {
            const eJson: any = await eRes.json()
            const pages = eJson?.query?.pages || {}
            const firstPage = Object.values(pages)[0] as any
            snippet = (firstPage?.extract || '').toString().split('\n')[0]?.slice(0, 240)
          }
        } catch {}

        const citation: Citation = {
          url: pageUrl,
          title,
          publisher: 'Wikipedia',
          type: 'wikipedia',
          snippet
        }
        return [citation]
      }

      return []
    } catch {
      return []
    }
  }
}

