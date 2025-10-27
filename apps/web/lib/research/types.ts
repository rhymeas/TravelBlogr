export type SourceType =
  | 'wikivoyage'
  | 'wikipedia'
  | 'official'
  | 'gov'
  | 'wikidata'
  | 'poi'

export interface Citation {
  url: string
  title: string
  publisher?: string
  type: SourceType
  snippet?: string
  publishedAt?: string
  score?: number
}

export interface ResearchSummary {
  summary: string
  facts: string[]
}

export interface ResearchResult extends ResearchSummary {
  citations: Citation[]
}

export interface EntityInput {
  slug?: string
  name?: string
  lat?: number
  lon?: number
  countryCode?: string
}

export interface Entity {
  qid?: string
  name: string
  countryCode?: string
  lat?: number
  lon?: number
  aliases?: string[]
}

export interface AdapterContext {
  limit: number
  signal?: AbortSignal
  // Preferred language (ISO code like 'de', 'fr', 'en')
  lang?: string
  // Language fallbacks in order of preference (e.g., ['de','en'])
  langs?: string[]
}

export interface SourceAdapter {
  key: string
  fetch(entity: Entity, ctx: AdapterContext): Promise<Citation[]>
}

