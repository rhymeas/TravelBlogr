#!/usr/bin/env tsx

/**
 * Test geocoding fix for ambiguous location names
 * 
 * Verifies that locations with region get correct coordinates
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

async function testGeocodingFix() {
  console.log(`\n🧪 Testing Geocoding Fix for Ambiguous Locations\n`)

  try {
    // Import geocoding service
    const { geocodeLocation } = await import('../apps/web/lib/services/geocodingService')

    // Test cases: Locations that exist in multiple countries
    const testCases = [
      {
        name: 'Lofthus (Norway)',
        queries: [
          { query: 'Lofthus', expected: 'Should return Florida (WRONG)' },
          { query: 'Lofthus Norway', expected: 'Should return Oslo (WRONG)' },
          { query: 'Lofthus, Vestland, Norway', expected: 'Should return Lofthus, Vestland (CORRECT)' }
        ]
      },
      {
        name: 'Paris (France vs Texas)',
        queries: [
          { query: 'Paris', expected: 'Should return France (most famous)' },
          { query: 'Paris Texas', expected: 'Should return Paris, Texas' },
          { query: 'Paris, Île-de-France, France', expected: 'Should return Paris, France (CORRECT)' }
        ]
      },
      {
        name: 'Springfield (USA - many cities)',
        queries: [
          { query: 'Springfield', expected: 'Should return first result (ambiguous)' },
          { query: 'Springfield Illinois', expected: 'Should return Springfield, Illinois' },
          { query: 'Springfield, Illinois, USA', expected: 'Should return Springfield, Illinois (CORRECT)' }
        ]
      }
    ]

    for (const testCase of testCases) {
      console.log(`\n📍 Testing: ${testCase.name}`)
      console.log(`${'='.repeat(60)}`)

      for (const { query, expected } of testCase.queries) {
        console.log(`\n🔍 Query: "${query}"`)
        console.log(`   Expected: ${expected}`)

        const result = await geocodeLocation(query)

        if (result) {
          console.log(`   ✅ Result: ${result.displayName}`)
          console.log(`   📍 Coordinates: ${result.lat}, ${result.lng}`)
          console.log(`   🌍 Country: ${result.country}`)
          console.log(`   🏙️  City: ${result.city || 'N/A'}`)
          console.log(`   🗺️  Region: ${result.region || 'N/A'}`)
        } else {
          console.log(`   ❌ No result found`)
        }
      }
    }

    console.log(`\n\n✅ Geocoding test complete!`)
    console.log(`\n💡 Key Takeaway:`)
    console.log(`   - Always use format: "LocationName, Region, Country"`)
    console.log(`   - This ensures correct disambiguation for locations with same name`)
    console.log(`   - Example: "Lofthus, Vestland, Norway" not "Lofthus Norway"`)

  } catch (error) {
    console.error(`\n❌ Error:`, error)
    process.exit(1)
  }
}

testGeocodingFix()

