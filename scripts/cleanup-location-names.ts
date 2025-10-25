/**
 * Location Name Cleanup Script
 * 
 * Removes region/country concatenation from location names
 * Converts: "Banff Lake Louise Canada" → "Banff Lake Louise"
 * 
 * Usage:
 *   npx ts-node scripts/cleanup-location-names.ts [--dry-run] [--limit 10]
 * 
 * Options:
 *   --dry-run    Show what would be changed without making changes
 *   --limit N    Only process N locations (default: all)
 *   --verbose    Show detailed logs for each location
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Location {
  id: string
  name: string
  country: string
  region: string
}

interface CleanupResult {
  id: string
  oldName: string
  newName: string
  changed: boolean
  reason?: string
}

/**
 * Extract location name without region/country
 * Examples:
 * - "Banff Lake Louise Canada" → "Banff Lake Louise"
 * - "Hallstatt Austria" → "Hallstatt"
 * - "Tokyo, Japan" → "Tokyo"
 * - "Banff" → "Banff" (no change)
 */
function cleanLocationName(name: string, country: string, region: string): { cleaned: string; changed: boolean; reason?: string } {
  if (!name || !country) {
    return { cleaned: name, changed: false }
  }

  let cleaned = name.trim()
  let changed = false
  let reason = ''

  // Check if name ends with country
  if (cleaned.endsWith(country)) {
    cleaned = cleaned.substring(0, cleaned.length - country.length).trim()
    changed = true
    reason = `Removed country suffix: "${country}"`
  }

  // Check if name ends with region (after country removal)
  if (region && cleaned.endsWith(region)) {
    cleaned = cleaned.substring(0, cleaned.length - region.length).trim()
    changed = true
    reason = `${reason ? reason + ' + ' : ''}Removed region suffix: "${region}"`
  }

  // Remove trailing commas and spaces
  cleaned = cleaned.replace(/,\s*$/, '').trim()

  // Check if we removed something
  if (cleaned !== name.trim()) {
    changed = true
  }

  return { cleaned, changed, reason }
}

async function cleanupLocationNames() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verbose = args.includes('--verbose')
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null

  console.log(`🧹 Location Name Cleanup Script`)
  console.log(`================================`)
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '✏️ LIVE MODE (will update database)'}`)
  if (limit) console.log(`Limit: ${limit} locations`)
  console.log('')

  try {
    // Fetch all locations
    console.log(`📍 Fetching locations from database...`)
    let query = supabase
      .from('locations')
      .select('id, name, country, region')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: locations, error } = await query

    if (error) {
      console.error(`❌ Error fetching locations:`, error)
      process.exit(1)
    }

    if (!locations || locations.length === 0) {
      console.log(`⚠️ No locations found`)
      process.exit(0)
    }

    console.log(`✅ Found ${locations.length} locations\n`)

    // Analyze and clean names
    const results: CleanupResult[] = []
    let needsCleanup = 0

    for (const location of locations) {
      const { cleaned, changed, reason } = cleanLocationName(
        location.name,
        location.country,
        location.region
      )

      if (changed) {
        needsCleanup++
        results.push({
          id: location.id,
          oldName: location.name,
          newName: cleaned,
          changed: true,
          reason
        })

        if (verbose) {
          console.log(`  📝 ${location.name}`)
          console.log(`     → ${cleaned}`)
          console.log(`     (${reason})`)
        }
      }
    }

    console.log(`\n📊 Analysis Results:`)
    console.log(`====================`)
    console.log(`Total locations: ${locations.length}`)
    console.log(`Need cleanup: ${needsCleanup}`)
    console.log(`Already clean: ${locations.length - needsCleanup}`)
    console.log(`Cleanup rate: ${((needsCleanup / locations.length) * 100).toFixed(1)}%\n`)

    if (needsCleanup === 0) {
      console.log(`✅ All locations are already clean!`)
      process.exit(0)
    }

    // Show sample of changes
    console.log(`📋 Sample of changes (first 5):`)
    console.log(`================================`)
    results.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. "${result.oldName}" → "${result.newName}"`)
      console.log(`   ${result.reason}`)
    })

    if (results.length > 5) {
      console.log(`... and ${results.length - 5} more`)
    }

    console.log('')

    // Apply changes if not dry-run
    if (!dryRun) {
      console.log(`💾 Applying changes to database...`)
      let updated = 0
      let failed = 0

      for (const result of results) {
        const { error: updateError } = await supabase
          .from('locations')
          .update({ name: result.newName })
          .eq('id', result.id)

        if (updateError) {
          console.error(`  ❌ Failed to update ${result.id}: ${updateError.message}`)
          failed++
        } else {
          updated++
          if (verbose) {
            console.log(`  ✅ Updated: ${result.oldName} → ${result.newName}`)
          }
        }
      }

      console.log(`\n✅ Cleanup Complete!`)
      console.log(`====================`)
      console.log(`Updated: ${updated}/${needsCleanup}`)
      if (failed > 0) {
        console.log(`Failed: ${failed}`)
      }
    } else {
      console.log(`🔍 DRY RUN: No changes made`)
      console.log(`Run without --dry-run to apply changes`)
    }

  } catch (error) {
    console.error(`❌ Unexpected error:`, error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupLocationNames()

