import type { Entity, EntityInput } from './types'
import { geocodeAddress } from '@/lib/services/nominatimService'

/**
 * Resolve a canonical entity for a location.
 * Free-first: humanize slug, then geocode via Nominatim if coordinates missing.
 */
export async function resolveEntity(input: EntityInput): Promise<Entity> {
  const name = input.name || (input.slug ? humanizeSlug(input.slug) : 'Unknown')
  let lat = input.lat
  let lon = input.lon

  // Try free geocoding if coordinates are missing
  if ((lat == null || lon == null) && name && name !== 'Unknown') {
    try {
      const geo = await geocodeAddress(name)
      if (geo) { lat = geo.lat; lon = geo.lon }
    } catch {}
  }

  return {
    name,
    countryCode: input.countryCode,
    lat,
    lon,
  }
}

function humanizeSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

