import type { Citation, Entity, AdapterContext } from '../types'

/**
 * Wikidata adapter
 * Free API (no key). Use wbsearchentities to get QID, then fetch P856 (official website).
 */
export const wikidataAdapter = {
  key: 'wikidata',
  async fetch(entity: Entity, ctx: AdapterContext): Promise<Citation[]> {
    try {
      const name = entity.name?.trim()
      if (!name) return []

      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=1&origin=*`
      const sRes = await fetch(searchUrl, { next: { revalidate: 60 * 60 } })
      if (!sRes.ok) return []
      const sJson: any = await sRes.json()
      const qid = sJson?.search?.[0]?.id as string | undefined
      const label = sJson?.search?.[0]?.label as string | undefined
      if (!qid) return []

      const dataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`
      const dRes = await fetch(dataUrl, { next: { revalidate: 60 * 60 } })
      if (!dRes.ok) return []
      const dJson: any = await dRes.json()
      const entityData = dJson?.entities?.[qid]
      const officialClaims = entityData?.claims?.P856 || []
      const urls = officialClaims
        .map((c: any) => c?.mainsnak?.datavalue?.value)
        .filter((u: any) => typeof u === 'string') as string[]
      if (!urls.length) return []

      const url = urls[0]
      const citation: Citation = {
        url,
        title: `${label || name} — Official website`,
        publisher: new URL(url).hostname.replace(/^www\./, ''),
        type: 'official'
      }
      return [citation]
    } catch {
      return []
    }
  }
}

