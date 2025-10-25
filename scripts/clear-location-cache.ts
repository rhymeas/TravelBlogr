#!/usr/bin/env tsx

/**
 * Clear all caches for a specific location
 *
 * Usage:
 *   npx tsx scripts/clear-location-cache.ts "Lofthus"
 *   npx tsx scripts/clear-location-cache.ts "Paris"
 */

import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

// Load environment variables
config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

async function clearLocationCache(locationName: string) {
  console.log(`\n🧹 Clearing all caches for: "${locationName}"\n`)

  try {
    // Get all keys
    const allKeys = await redis.keys('*')
    console.log(`📊 Total keys in cache: ${allKeys.length}`)

    // Filter keys related to this location (case-insensitive)
    const locationKeys = allKeys.filter(key => 
      key.toLowerCase().includes(locationName.toLowerCase())
    )

    console.log(`🎯 Found ${locationKeys.length} keys related to "${locationName}":\n`)

    if (locationKeys.length === 0) {
      console.log(`⚠️  No cache keys found for "${locationName}"`)
      return
    }

    // Show what we're deleting
    locationKeys.forEach(key => {
      console.log(`   - ${key}`)
    })

    console.log(`\n🗑️  Deleting ${locationKeys.length} keys...`)

    // Delete all related keys
    for (const key of locationKeys) {
      await redis.del(key)
      console.log(`   ✅ Deleted: ${key}`)
    }

    console.log(`\n✅ Successfully cleared all caches for "${locationName}"!`)
    console.log(`\n💡 Now refetch the location to get fresh data with correct country context.`)

  } catch (error) {
    console.error(`\n❌ Error clearing cache:`, error)
    process.exit(1)
  }
}

// Get location name from command line
const locationName = process.argv[2]

if (!locationName) {
  console.error(`\n❌ Error: Please provide a location name`)
  console.error(`\nUsage: npx tsx scripts/clear-location-cache.ts "Lofthus"`)
  process.exit(1)
}

clearLocationCache(locationName)

