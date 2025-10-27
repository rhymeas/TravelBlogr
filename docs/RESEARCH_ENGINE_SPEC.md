# Research Engine (Free-First, GROQ-Synthesized) – Specification

## Overview
A standalone, reusable Research Engine that aggregates trusted, free sources for any location and synthesizes:
- What to know (2 short lines)
- 1–2 Did you know? facts
- 3–6 citations (titles, publishers, favicons where possible)

It powers three surfaces:
1) Location detail pages (compact “Resources” widget + What to know/Facts)
2) Trip Planner V2 (day/item-level citations in metadata)
3) Blog CMS (editor sidebar with insert actions)

Principles
- Free-first sources (Wikivoyage, Wikipedia, Wikidata, OpenTripMap)
- GROQ used only for concise synthesis from provided sources (no unsupported facts)
- Upstash caching, strict invalidation order, Supabase auth (server/client separation)


## Architecture (Gears)
- Entity Resolver
  - Input: { slug | name, lat/lon?, countryCode? }
  - Output: canonical entity { name, qid?, lat/lon?, countryCode? }
  - Later: Wikidata search/disambiguation; for MVP we accept direct name

- Source Adapters (pluggable registry)
  - wikivoyage: article summary, external links
  - wikipedia: summary/infobox, external links
  - wikidata: official website, authority/social links
  - openTripMap: top POIs with official/website links
  - Contract: (entity, { limit, signal? }) => Citation[]

- Normalizer/Deduper/Ranker
  - Normalize to {url, title, publisher, type, snippet?, publishedAt?, score}
  - Rank trust: official > gov > foundation > wikivoyage > wikipedia > poi-generic
  - Dedupe by canonical URL (domain+path) and title similarity

- Summarizer (GROQ)
  - Input: top N citations (title, snippet)
  - Output: { summary (<=2 lines), facts (1–2) }
  - Guardrails: cite-only; avoid hallucinations; short output

- Cache & Store
  - Upstash cache-aside for results; TTL 24h on location pages, 5–30m in CMS
  - Optional persistence tables after MVP for analytics and reuse


## Data Types (core)
- Entity: { qid?: string, name: string, countryCode?: string, lat?: number, lon?: number, aliases?: string[] }
- Citation: { url: string, title: string, publisher?: string, type: 'wikivoyage'|'wikipedia'|'official'|'gov'|'wikidata'|'poi', snippet?: string, publishedAt?: string, score?: number }
- ResearchResult: { summary: string, facts: string[], citations: Citation[] }


## API
- POST /api/research/citations
  - Body: { locationSlug | name, query?: string, limit?: number = 5 }
  - Returns: { success: true, summary, facts, citations }
- GET /api/research/citations?location=slug&limit=5
  - Read-only for widgets

Rate limit: per IP and per user (Supabase) via Upstash (e.g., 20/min while editing, 60/hr public)


## Cache Keys & TTL (CRITICAL)
- Keys
  - research:${locationSlug}:${limit}:${hash(query||'')}
  - research:item:${tripItemId}
- TTL
  - Location pages: CacheTTL.LONG (24h)
  - CMS/Planner editing: CacheTTL.SHORT (5–30m)
- Invalidation order
  1) deleteCached(key)
  2) revalidatePath(`/locations/${slug}`) and related pages


## Sources (free-first)
- MediaWiki (Wikipedia & Wikivoyage REST/API) – summaries, extlinks
- Wikidata SPARQL – official site, socials, identifiers
- OpenTripMap – POIs including website links
- Optional curated allowlist per country (seeded from Wikidata officialSite)

No Google Places, no paid web search APIs.


## Ranking Rules
1) Official/Government domains rank highest (official tourism, parks, gov TLDs)
2) Then Wikivoyage/Wikipedia
3) Then authority foundations, then generic POIs
4) Ties broken by recency/snippet quality


## Summarization Prompt (sketch)
System: "You are a travel research assistant. Only summarize from provided sources. No speculation. Keep it brief."
User content: JSON with top K citations (titles/snippets) and location context. Ask for:
- 2 lines: What to know
- 1–2 Did you know? facts
- No extra commentary; no invented claims


## Security & Auth
- Server-only fetching in route handler (createServerSupabase where needed)
- Supabase auth for CMS calls; per-user rate limiting
- Respect licenses (show source link + attribution for Wikipedia/Wikivoyage)


## UI Surfaces
- Location widget: summary + 3–5 citations (favicon, title, domain). “More sources” expands list.
- Planner V2: attach top 1–2 citations to day/items; store in trip_itinerary_items.metadata
- CMS: right sidebar panel; query field; results list; insert actions that stamp a citation block or metadata


## Persistence Options
MVP: cache-only plus storing what editors insert into post content or trip_itinerary_items.metadata.
Future: tables research_queries, research_results, research_citations with RLS (profiles(id)).


## Testing
- Unit: normalization, ranking, dedupe; entity resolution fallbacks
- Integration: API route with fixture providers; cache hit/miss
- E2E: location page renders widget; planner day displays citation pill


## Rollout Plan
- Stage 0: Spec & scaffolding (this doc, types, engine skeleton, API stub)
- Stage 1: Implement adapters (wikivoyage/wikipedia/wikidata/openTripMap) + rank/dedupe + GROQ synth + caching
- Stage 2: Location widget integration + cache invalidation hooks
- Stage 3: CMS research panel + insert actions
- Stage 4: Planner V2 citations stored in trip_itinerary_items.metadata
- Stage 5: Hardening (tests, metrics, rate limits, attribution)


## Notes
- Keep prompts tiny to minimize GROQ token costs
- Fail fast with clear fallbacks (empty sources → safe placeholder summary)
- All adapters must be timeout-aware and return within 1–2s

