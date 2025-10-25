/**
 * API Route: Cleanup Location Names
 * POST /api/admin/cleanup-locations
 * 
 * Admin-only endpoint to clean up location names by removing region/country concatenation
 * Converts: "Banff Lake Louise Canada" → "Banff Lake Louise"
 * 
 * Query Parameters:
 *   - dryRun: boolean (default: true) - Show what would be changed without making changes
 *   - limit: number (default: null) - Only process N locations
 *   - verbose: boolean (default: false) - Show detailed logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/utils/adminCheck'

export const runtime = 'nodejs'
export const maxDuration = 120 // 2 minutes for large cleanups

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
 */
function cleanLocationName(
  name: string,
  country: string,
  region: string
): { cleaned: string; changed: boolean; reason?: string } {
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

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin permissions
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const dryRun = searchParams.get('dryRun') !== 'false' // Default to true
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null
    const verbose = searchParams.get('verbose') === 'true'

    console.log(`🧹 [ADMIN] Starting location name cleanup`)
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
    if (limit) console.log(`Limit: ${limit}`)

    // Fetch all locations
    console.log(`📍 Fetching locations...`)
    let query = supabase
      .from('locations')
      .select('id, name, country, region')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: locations, error: fetchError } = await query

    if (fetchError) {
      console.error(`❌ Error fetching locations:`, fetchError)
      return NextResponse.json(
        { success: false, error: `Failed to fetch locations: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No locations found',
        results: {
          total: 0,
          needsCleanup: 0,
          alreadyClean: 0,
          updated: 0,
          failed: 0,
          changes: []
        }
      })
    }

    console.log(`✅ Found ${locations.length} locations`)

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
          console.log(`  📝 ${location.name} → ${cleaned}`)
        }
      }
    }

    console.log(`📊 Analysis: ${needsCleanup}/${locations.length} need cleanup`)

    if (needsCleanup === 0) {
      return NextResponse.json({
        success: true,
        message: 'All locations are already clean',
        results: {
          total: locations.length,
          needsCleanup: 0,
          alreadyClean: locations.length,
          updated: 0,
          failed: 0,
          changes: []
        }
      })
    }

    // Apply changes if not dry-run
    let updated = 0
    let failed = 0

    if (!dryRun) {
      console.log(`💾 Applying changes...`)

      for (const result of results) {
        const { error: updateError } = await supabase
          .from('locations')
          .update({ name: result.newName })
          .eq('id', result.id)

        if (updateError) {
          console.error(`  ❌ Failed to update ${result.id}`)
          failed++
        } else {
          updated++
          if (verbose) {
            console.log(`  ✅ Updated: ${result.oldName} → ${result.newName}`)
          }
        }
      }

      console.log(`✅ Cleanup complete: ${updated} updated, ${failed} failed`)
    } else {
      console.log(`🔍 DRY RUN: No changes made`)
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `DRY RUN: Would update ${needsCleanup} locations`
        : `Successfully updated ${updated} locations`,
      results: {
        total: locations.length,
        needsCleanup,
        alreadyClean: locations.length - needsCleanup,
        updated,
        failed,
        changes: results.slice(0, 10) // Return first 10 changes
      },
      dryRun
    })

  } catch (error) {
    console.error(`❌ Error in cleanup:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

