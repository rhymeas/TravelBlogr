import { createGroqClient, isGroqConfigured } from '@/lib/groq'
import { getOrSet, CacheTTL } from '@/lib/upstash'
import type { AdapterContext, Citation, Entity, EntityInput, ResearchResult, SourceAdapter } from './types'
import { resolveEntity } from './entityResolver'
import { wikivoyageAdapter } from './adapters/wikivoyage'
import { wikipediaAdapter } from './adapters/wikipedia'
import { wikidataAdapter } from './adapters/wikidata'
import { openTripMapAdapter } from './adapters/openTripMap'
import { searchWeb } from '@/lib/services/braveSearchService'

const ADAPTERS: SourceAdapter[] = [
  wikivoyageAdapter,
  wikipediaAdapter,
  wikidataAdapter,
  openTripMapAdapter,
]

export function buildResearchCacheKey(locationSlug: string, query: string = '', limit: number = 5, lang?: string) {
  const q = query?.trim() || ''
  const h = simpleHash(q + '|' + (lang || ''))
  return `research:${locationSlug}:${limit}:${h}`
}

export async function researchForLocation(
  input: EntityInput & { locationSlug?: string; query?: string; limit?: number; lang?: string }
): Promise<ResearchResult> {
  const { locationSlug = input.slug || input.name || 'unknown', query = '', limit = 5, lang } = input
  const cacheKey = buildResearchCacheKey(String(locationSlug), query, limit, lang)

  return getOrSet(cacheKey, async () => {
    const entity: Entity = await resolveEntity(input)
    const langs = buildLangs(lang, entity.countryCode)
    const ctx: AdapterContext = { limit, lang, langs }

    const rawLists = await Promise.allSettled(ADAPTERS.map((a) => a.fetch(entity, ctx)))
    let citations = dedupeAndRank(
      rawLists
        .filter((r): r is PromiseFulfilledResult<Citation[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value || [])
        .slice(0, Math.max(limit * 2, 8))
    )

    // Brave fallback: if we still lack strong sources (or none), try to add official sites
    if (citations.length < limit) {
      try {
        const query = `${entity.name} official site tourism`
        const web = await searchWeb(query, 6)
        const official = web
          .filter((w) => w.type === 'official')
          .slice(0, 3)
          .map<Citation>((w) => ({
            url: w.url,
            title: w.title || `${entity.name} — Official site`,
            publisher: domain(w.url),
            type: 'official'
          }))
        if (official.length) {
          citations = dedupeAndRank([...citations, ...official])
        }
      } catch (e) {
        // soft-fail
      }
    }

    citations = citations.slice(0, limit)

    const { summary, facts } = await summarize(citations, entity)

    return {
      summary,
      facts,
      citations,
    }
  }, CacheTTL.LONG)
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u)
    url.hash = ''
    return url.toString()
  } catch {
    return u
  }
}

function domain(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return 'unknown'
  }
}

function scoreByTrust(c: Citation): number {
  const d = domain(c.url)
  // Trust heuristics
  if (c.type === 'official' || /\.(gov|gc\.ca|go\.jp)$/.test(d)) return 100
  if (c.type === 'gov') return 95
  if (c.type === 'wikivoyage') return 90
  if (c.type === 'wikipedia') return 85
  if (c.type === 'wikidata') return 80
  return c.score ?? 60
}

function dedupeAndRank(items: Citation[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const it of items) {
    const key = normalizeUrl(it.url)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...it, score: scoreByTrust(it) })
  }
  return out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}

async function summarize(citations: Citation[], entity: Entity): Promise<{ summary: string; facts: string[] }> {
  if (!citations.length || !isGroqConfigured()) {
    return { summary: `Key info about ${entity.name}.`, facts: [] }
  }

  const groq = createGroqClient()
  const top = citations.slice(0, 5).map((c) => ({ title: c.title, snippet: c.snippet, url: c.url }))

  const prompt = [
    {
      role: 'system' as const,
      content:
        'You are a precise travel research assistant. ONLY summarize from the provided sources. Keep it very brief. No invented facts.'
    },
    {
      role: 'user' as const,
      content: JSON.stringify({
        location: entity.name,
        sources: top,
        instructions:
          'Return JSON with keys: summary (<=2 lines), facts (array of 1-2 short did-you-know facts). No extra keys.'
      })
    }
  ]

  try {
    const resp = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: prompt as any,
      temperature: 0.2,
      max_tokens: 300
    })
    const text = resp.choices?.[0]?.message?.content || ''
    const parsed = safeParseJSON(text)
    if (parsed && typeof parsed.summary === 'string' && Array.isArray(parsed.facts)) {
      return { summary: parsed.summary, facts: parsed.facts.slice(0, 2) }
    }
  } catch (e) {
    console.error('GROQ summarize error', e)
  }
  return { summary: `Highlights about ${entity.name}.`, facts: [] }
}

function safeParseJSON(t: string): any | null {
  try { return JSON.parse(t) } catch { return null }
}

function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

function buildLangs(lang?: string, countryCode?: string): string[] {
  const out: string[] = []
  const primary = (lang || '').trim().toLowerCase()
  if (primary) out.push(primary)

  const cc = (countryCode || '').toUpperCase()
  const preferred = langsForCountry(cc)
  for (const l of preferred) if (!out.includes(l)) out.push(l)

  if (!out.includes('en')) out.push('en')
  return out
}

function langsForCountry(cc?: string): string[] {
  switch (cc) {
    case 'DE': case 'AT': case 'CH': return ['de']
    case 'FR': case 'CA': case 'BE': case 'CH': return ['fr']
    case 'ES': case 'AR': case 'MX': case 'CL': case 'PE': return ['es']
    case 'IT': return ['it']
    case 'NL': case 'BE': return ['nl']
    case 'PT': case 'BR': return ['pt']
    case 'PL': return ['pl']
    case 'CZ': return ['cs']
    case 'SK': return ['sk']
    case 'RO': case 'MD': return ['ro']
    case 'RU': return ['ru']
    case 'TR': return ['tr']
    case 'ID': return ['id']
    case 'MY': return ['ms']
    case 'TH': return ['th']
    case 'VN': return ['vi']
    case 'JP': return ['ja']
    case 'KR': return ['ko']
    case 'CN': case 'TW': case 'HK': return ['zh']
    case 'EG': case 'SA': case 'AE': case 'MA': return ['ar']
    case 'IR': return ['fa']
    case 'IN': return ['hi']
    case 'PK': return ['ur']
    case 'IL': return ['he']
    case 'SE': return ['sv']
    case 'NO': return ['no']
    case 'DK': return ['da']
    case 'FI': return ['fi']
    case 'GR': return ['el']
    case 'HU': return ['hu']
    case 'UA': return ['uk']
    case 'RS': return ['sr']
    case 'HR': return ['hr']
    case 'BA': return ['bs']
    case 'SI': return ['sl']
    case 'MK': return ['mk']
    case 'BG': return ['bg']
    default: return []
  }
}
