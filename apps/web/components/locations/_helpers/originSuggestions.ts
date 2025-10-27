export interface OriginSuggestion { label: string; lat: number; lon: number; type: 'station' | 'airport' | 'city' }

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search'

async function searchOne(q: string): Promise<{ lat: number; lon: number; display_name: string } | null> {
  try {
    const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'TravelBlogr/1.0 (origin-suggestions)' } })
    if (!res.ok) return null
    const arr = await res.json()
    if (Array.isArray(arr) && arr[0] && arr[0].lat && arr[0].lon) {
      return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), display_name: arr[0].display_name }
    }
    return null
  } catch { return null }
}

export async function suggestOriginsFor(name: string): Promise<OriginSuggestion[]> {
  const out: OriginSuggestion[] = []
  // Try train station
  const station = await searchOne(`${name} train station`)
  if (station) out.push({ label: station.display_name.split(',')[0] || `${name} Station`, lat: station.lat, lon: station.lon, type: 'station' })
  // Try airport
  const airport = await searchOne(`${name} airport`)
  if (airport) out.push({ label: airport.display_name.split(',')[0] || `${name} Airport`, lat: airport.lat, lon: airport.lon, type: 'airport' })
  // City center
  const city = await searchOne(`${name} city center`)
  if (city) out.push({ label: `${name} city center`, lat: city.lat, lon: city.lon, type: 'city' })
  return out
}

