#!/usr/bin/env tsx

/**
 * Verify all location coordinates match their country
 * 
 * Finds locations where coordinates don't match the country field
 * (e.g., "Norway" location with Florida coordinates)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

// Country bounding boxes (approximate)
const COUNTRY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  'Norway': { minLat: 57.9, maxLat: 71.2, minLng: 4.5, maxLng: 31.2 },
  'Norge': { minLat: 57.9, maxLat: 71.2, minLng: 4.5, maxLng: 31.2 },
  'Sweden': { minLat: 55.3, maxLat: 69.1, minLng: 10.9, maxLng: 24.2 },
  'Denmark': { minLat: 54.5, maxLat: 57.8, minLng: 8.0, maxLng: 15.2 },
  'Finland': { minLat: 59.8, maxLat: 70.1, minLng: 20.5, maxLng: 31.6 },
  'Iceland': { minLat: 63.3, maxLat: 66.6, minLng: -24.5, maxLng: -13.5 },
  'United States': { minLat: 24.5, maxLat: 49.4, minLng: -125.0, maxLng: -66.9 },
  'United States of America': { minLat: 24.5, maxLat: 49.4, minLng: -125.0, maxLng: -66.9 },
  'Canada': { minLat: 41.7, maxLat: 83.1, minLng: -141.0, maxLng: -52.6 },
  'Mexico': { minLat: 14.5, maxLat: 32.7, minLng: -118.4, maxLng: -86.7 },
  'France': { minLat: 41.3, maxLat: 51.1, minLng: -5.1, maxLng: 9.6 },
  'Germany': { minLat: 47.3, maxLat: 55.1, minLng: 5.9, maxLng: 15.0 },
  'Italy': { minLat: 36.6, maxLat: 47.1, minLng: 6.6, maxLng: 18.5 },
  'Spain': { minLat: 36.0, maxLat: 43.8, minLng: -9.3, maxLng: 4.3 },
  'United Kingdom': { minLat: 49.9, maxLat: 60.9, minLng: -8.2, maxLng: 1.8 },
  'Morocco': { minLat: 27.7, maxLat: 35.9, minLng: -13.2, maxLng: -1.0 },
  'Japan': { minLat: 24.0, maxLat: 45.5, minLng: 122.9, maxLng: 153.9 },
  'Australia': { minLat: -43.6, maxLat: -10.7, minLng: 113.3, maxLng: 153.6 },
  'New Zealand': { minLat: -47.3, maxLat: -34.4, minLng: 166.4, maxLng: 178.6 },
  'Brazil': { minLat: -33.7, maxLat: 5.3, minLng: -73.9, maxLng: -34.8 },
}

function isCoordinateInCountry(lat: number, lng: number, country: string): boolean {
  const bounds = COUNTRY_BOUNDS[country]
  if (!bounds) {
    // Unknown country, can't verify
    return true
  }

  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  )
}

async function verifyLocationCoordinates() {
  console.log(`\n🔍 Verifying Location Coordinates\n`)

  try {
    // Import Supabase
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error(`❌ Missing Supabase credentials`)
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all locations
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, slug, latitude, longitude, country, region')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`❌ Error fetching locations:`, error)
      process.exit(1)
    }

    if (!locations || locations.length === 0) {
      console.log(`⚠️  No locations found`)
      return
    }

    console.log(`📊 Checking ${locations.length} locations...\n`)

    const issues: any[] = []

    for (const location of locations) {
      if (!location.latitude || !location.longitude || !location.country) {
        continue
      }

      const lat = parseFloat(location.latitude)
      const lng = parseFloat(location.longitude)

      const isValid = isCoordinateInCountry(lat, lng, location.country)

      if (!isValid) {
        issues.push({
          id: location.id,
          name: location.name,
          slug: location.slug,
          country: location.country,
          region: location.region,
          coordinates: `${lat}, ${lng}`,
          lat,
          lng
        })
      }
    }

    if (issues.length === 0) {
      console.log(`✅ All locations have correct coordinates!`)
      return
    }

    console.log(`⚠️  Found ${issues.length} locations with potentially wrong coordinates:\n`)

    for (const issue of issues) {
      console.log(`❌ ${issue.name} (${issue.slug})`)
      console.log(`   Country: ${issue.country}`)
      console.log(`   Region: ${issue.region || 'N/A'}`)
      console.log(`   Coordinates: ${issue.coordinates}`)
      console.log(`   URL: http://localhost:3000/locations/${issue.slug}`)
      console.log(`   Fix: Refetch this location with correct region`)
      console.log(``)
    }

    console.log(`\n💡 To fix these locations:`)
    console.log(`   1. Visit each location page`)
    console.log(`   2. Click "Refetch Data" button (admin only)`)
    console.log(`   3. Verify coordinates are now correct`)
    console.log(`\n   OR run SQL update:`)
    console.log(`   UPDATE locations SET latitude = X, longitude = Y WHERE id = 'location-id';`)

  } catch (error) {
    console.error(`\n❌ Error:`, error)
    process.exit(1)
  }
}

verifyLocationCoordinates()

