/**
 * Canonical Location Slug Utilities
 *
 * Rules (holistic):
 * - Format: city-country OR city-region-country (max 3 parts)
 * - Drop noisy prefixes: start-, stop-, checkpoint-, pintu-, gate-, post-
 * - Drop admin words: municipality, parish, prefecture, county, district, province,
 *   regency, kabupaten, kecamatan, commune, township, borough, metropolitan, state of, province of
 * - Remove postal/zip codes and numeric tokens
 * - De-duplicate repeated parts (e.g., "indonesia-indonesia" → "indonesia")
 * - ASCII-safe slug (lowercase, hyphens)
 */

const NOISY_PREFIXES = [
  'start', 'stop', 'checkpoint', 'pintu', 'gate', 'post'
]

const ADMIN_WORDS = [
  'municipality', 'parish', 'prefecture', 'county', 'district', 'province',
  'regency', 'kabupaten', 'kecamatan', 'commune', 'township', 'borough',
  'metropolitan', 'metropolitan area', 'state of', 'province of', 'department', 'region'
]

/** Normalize raw text to slug tokens */
function toTokens(text?: string | null): string[] {
  if (!text) return []
  // Replace separators with spaces, strip non-alphanum, split
  const cleaned = text
    .toLowerCase()
    .replace(/[_.,/|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleaned.split(' ')
  const filtered: string[] = []

  let skipNextOf = false
  for (let i = 0; i < words.length; i++) {
    let w = words[i]
    if (!w) continue

    // Drop numeric tokens (zip codes, house numbers)
    if (/^\d+$/.test(w)) continue

    // Drop leading noisy prefixes (start-, stop-, etc.)
    if (i === 0 && NOISY_PREFIXES.includes(w)) continue

    // Drop admin words and their trailing "of"
    if (ADMIN_WORDS.includes(w)) { skipNextOf = true; continue }
    if (skipNextOf && w === 'of') { skipNextOf = false; continue }

    // Keep only a-z0-9 and hyphenate later
    w = w.replace(/[^a-z0-9-]/g, '')
    if (w) filtered.push(w)
  }

  return filtered
}

/**
 * Build canonical parts: [city, region?, country]
 * Prefers provided region/country when available; otherwise derives from name tokens.
 */
function canonicalParts(name: string, region?: string | null, country?: string | null): string[] {
  const nameTokens = toTokens(name)
  const regionTokens = toTokens(region || undefined)
  const countryTokens = toTokens(country || undefined)

  // City: take the first token sequence from name until an admin-like break
  const city = nameTokens[0] || ''

  // Region: first meaningful token if provided and distinct from city/country
  const regionPart = regionTokens.find(t => t && t !== city) || ''

  // Country: prefer provided country; if not present, try last token of name
  let countryPart = countryTokens[0]
  if (!countryPart && nameTokens.length > 1) {
    countryPart = nameTokens[nameTokens.length - 1]
  }

  const parts = [city]
  if (regionPart && regionPart !== countryPart) parts.push(regionPart)
  if (countryPart) parts.push(countryPart)

  // De-duplicate consecutive or repeated items
  const deduped: string[] = []
  for (const p of parts) {
    if (!p) continue
    if (deduped[deduped.length - 1] === p) continue
    if (deduped.includes(p)) continue
    deduped.push(p)
  }

  // Limit to max 3 parts
  return deduped.slice(0, 3)
}

/** Exported: generate canonical location slug */
export function generateLocationSlug(name: string, region?: string | null, country?: string | null): string {
  const parts = canonicalParts(name, region, country)
  // Join and sanitize
  let slug = parts.join('-')
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug
}

/** Also expose a helper for blog linking etc. */
export function nameToCanonicalSlug(locationName: string): string {
  // Split on comma to attempt extracting city, country
  const [name, regionOrCountry, maybeCountry] = locationName.split(',').map(s => s?.trim())
  const namePart = name || locationName
  const regionPart = maybeCountry ? regionOrCountry : undefined
  const countryPart = maybeCountry || regionOrCountry
  return generateLocationSlug(namePart, regionPart, countryPart)
}

