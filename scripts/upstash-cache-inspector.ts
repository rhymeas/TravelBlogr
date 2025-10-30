#!/usr/bin/env tsx
/**
 * Upstash Cache Inspector & Manager
 * 
 * Usage:
 *   npm run cache:list              # List all cache keys
 *   npm run cache:get <key>         # Get value for a specific key
 *   npm run cache:delete <key>      # Delete a specific key
 *   npm run cache:clear <pattern>   # Clear all keys matching pattern
 *   npm run cache:stats             # Show cache statistics
 */

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

async function listKeys(pattern: string = '*'): Promise<string[]> {
  const keys: string[] = []
  let cursor = 0

  do {
    const result = await redis.scan(cursor, { match: pattern, count: 100 })
    cursor = result[0]
    keys.push(...result[1])
  } while (cursor !== 0)

  return keys
}

async function getKey(key: string): Promise<any> {
  const value = await redis.get(key)
  return value
}

async function deleteKey(key: string): Promise<number> {
  return await redis.del(key)
}

async function clearPattern(pattern: string): Promise<number> {
  const keys = await listKeys(pattern)
  if (keys.length === 0) {
    console.log(`No keys found matching pattern: ${pattern}`)
    return 0
  }

  console.log(`Found ${keys.length} keys matching pattern: ${pattern}`)
  console.log('Deleting...')

  let deleted = 0
  for (const key of keys) {
    await redis.del(key)
    deleted++
    if (deleted % 10 === 0) {
      console.log(`  Deleted ${deleted}/${keys.length} keys...`)
    }
  }

  console.log(`✅ Deleted ${deleted} keys`)
  return deleted
}

async function showStats(): Promise<void> {
  const allKeys = await listKeys('*')
  const activityKeys = await listKeys('activity:*')
  const braveKeys = await listKeys('brave:*')
  const locationKeys = await listKeys('location:*')

  console.log('\n📊 Upstash Cache Statistics')
  console.log('=' .repeat(50))
  console.log(`Total keys: ${allKeys.length}`)
  console.log(`Activity keys: ${activityKeys.length}`)
  console.log(`Brave keys: ${braveKeys.length}`)
  console.log(`Location keys: ${locationKeys.length}`)
  console.log('=' .repeat(50))

  // Show sample keys
  console.log('\n📝 Sample Activity Keys:')
  activityKeys.slice(0, 10).forEach(key => console.log(`  - ${key}`))
  if (activityKeys.length > 10) {
    console.log(`  ... and ${activityKeys.length - 10} more`)
  }
}

async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  try {
    switch (command) {
      case 'list':
        const pattern = arg || '*'
        const keys = await listKeys(pattern)
        console.log(`\n📋 Keys matching "${pattern}":`)
        keys.forEach(key => console.log(`  - ${key}`))
        console.log(`\nTotal: ${keys.length} keys`)
        break

      case 'get':
        if (!arg) {
          console.error('❌ Please provide a key to get')
          process.exit(1)
        }
        const value = await getKey(arg)
        console.log(`\n🔍 Value for key "${arg}":`)
        console.log(JSON.stringify(value, null, 2))
        break

      case 'delete':
        if (!arg) {
          console.error('❌ Please provide a key to delete')
          process.exit(1)
        }
        const deleted = await deleteKey(arg)
        console.log(`✅ Deleted ${deleted} key(s)`)
        break

      case 'clear':
        const clearPattern = arg || 'activity:*'
        await clearPattern(clearPattern)
        break

      case 'stats':
        await showStats()
        break

      default:
        console.log(`
Upstash Cache Inspector & Manager

Usage:
  npm run cache:list [pattern]     # List all cache keys (default: *)
  npm run cache:get <key>          # Get value for a specific key
  npm run cache:delete <key>       # Delete a specific key
  npm run cache:clear [pattern]    # Clear all keys matching pattern (default: activity:*)
  npm run cache:stats              # Show cache statistics

Examples:
  npm run cache:list "activity:*"
  npm run cache:get "activity:Banff, Canada:Lake Louise Gondola"
  npm run cache:clear "activity:Banff*"
  npm run cache:stats
        `)
        break
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()

