export function isAmbiguousLocationName(rawName: string | null | undefined): boolean {
  if (!rawName) return true
  const name = String(rawName).trim()
  if (name.length < 2) return true

  const lower = name.toLowerCase()

  // Clearly ambiguous or generated placeholders
  const patterns: RegExp[] = [
    /\b(border|checkpoint|crossing)\b/i,
    /^intermediate(?:\s|-)?city(?:\s*\d+)?$/i,
    /^city\s*\d+$/i,
    /(waypoint|stop)\s*\d+/i,
    /^(unknown|tbd|unspecified)$/i,
    /^intermediate\s*$/i,
    /^destination\s*$/i,
    // CRITICAL: Only block if it STARTS with these patterns (not contains)
    /^(travel|way|go|route|trip|journey)\s+(to|from|via)\s+/i,
  ]

  if (patterns.some((re) => re.test(name))) return true

  // Extremely generic labels without specificity
  const genericOnly = [
    'border', 'the border', 'checkpoint', 'crossing',
    'intermediate city', 'intermediate', 'waypoint', 'stop',
    'unknown', 'tbd', 'unspecified',
  ]
  if (genericOnly.includes(lower)) return true

  return false
}

/**
 * Simple proximity check threshold (in degrees). ~0.05 ≈ 5-6km depending on latitude.
 */
export const DUPLICATE_COORD_THRESHOLD = 0.05

