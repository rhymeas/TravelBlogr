#!/usr/bin/env tsx

/**
 * Test geocoding service for Lofthus
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

async function testGeocoding() {
  console.log(`\n🧪 Testing geocoding for Lofthus, Norway\n`)

  try {
    // Import geocoding service
    const { geocodeLocation } = await import('../apps/web/lib/services/geocodingService')

    // Test 1: Just "Lofthus"
    console.log(`\n1️⃣ Testing: "Lofthus"`)
    const result1 = await geocodeLocation('Lofthus')
    console.log(`   Result:`, result1)

    // Test 2: "Lofthus Norway"
    console.log(`\n2️⃣ Testing: "Lofthus Norway"`)
    const result2 = await geocodeLocation('Lofthus Norway')
    console.log(`   Result:`, result2)

    // Test 3: "Lofthus, Vestland, Norway"
    console.log(`\n3️⃣ Testing: "Lofthus, Vestland, Norway"`)
    const result3 = await geocodeLocation('Lofthus, Vestland, Norway')
    console.log(`   Result:`, result3)

    console.log(`\n✅ Geocoding test complete!`)

  } catch (error) {
    console.error(`\n❌ Error:`, error)
    process.exit(1)
  }
}

testGeocoding()

