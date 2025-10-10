import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Force dynamic rendering for cron routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Background Cron Job: Fix Missing Regions
 *
 * Automatically fetches and updates missing regions for locations
 * using Nominatim reverse geocoding API.
 *
 * Features:
 * - Processes in small batches (5 locations per run)
 * - Rate limiting (1 second delay between requests)
 * - Respects Nominatim usage policy
 * - Runs every 6 hours
 */
export async function GET(request: Request) {
  // Initialize Supabase client at runtime (not build time)
  const supabase = createServerSupabase()
  console.log('🌍 [CRON] Starting automated region fix job...')

  try {
    // Find locations without regions (limit to 5 per batch)
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, country, region, latitude, longitude')
      .or('region.is.null,region.eq.Unknown Region,region.eq.')
      .limit(5)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!locations || locations.length === 0) {
      console.log('✅ [CRON] No locations need region updates')
      return NextResponse.json({
        success: true,
        message: 'No locations need updates',
        processed: 0
      })
    }

    console.log(`📍 [CRON] Found ${locations.length} locations without regions`)

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    // Process each location with rate limiting
    for (const location of locations) {
      console.log(`\n🔍 [CRON] Processing: ${location.name}, ${location.country}`)

      try {
        // Skip if no coordinates
        if (!location.latitude || !location.longitude) {
          console.log(`  ⚠️ Skipping: No coordinates available`)
          results.skipped++
          results.details.push({
            location: location.name,
            status: 'skipped',
            reason: 'No coordinates'
          })
          continue
        }

        // Fetch region from Nominatim reverse geocoding
        const region = await fetchRegionFromNominatim(
          parseFloat(location.latitude),
          parseFloat(location.longitude),
          location.name
        )

        if (!region) {
          console.log(`  ⚠️ Could not determine region`)
          results.failed++
          results.details.push({
            location: location.name,
            status: 'failed',
            reason: 'Region not found'
          })
          continue
        }

        // Update database
        const { error: updateError } = await supabase
          .from('locations')
          .update({ 
            region,
            updated_at: new Date().toISOString()
          })
          .eq('id', location.id)

        if (updateError) {
          console.error(`  ❌ Update failed:`, updateError)
          results.failed++
          results.details.push({
            location: location.name,
            status: 'failed',
            error: updateError.message
          })
        } else {
          console.log(`  ✅ Updated ${location.name} → ${region}`)
          results.success++
          results.details.push({
            location: location.name,
            status: 'success',
            region
          })
        }

        // Rate limiting: 1 second delay between requests (Nominatim policy)
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error: any) {
        console.error(`  ❌ Error processing ${location.name}:`, error)
        results.failed++
        results.details.push({
          location: location.name,
          status: 'error',
          error: error.message
        })
      }
    }

    console.log('\n✅ [CRON] Job complete:', results)

    return NextResponse.json({
      success: true,
      message: `Processed ${locations.length} locations`,
      results
    })

  } catch (error: any) {
    console.error('❌ [CRON] Job failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Fetch region from Nominatim reverse geocoding API
 */
async function fetchRegionFromNominatim(
  lat: number,
  lng: number,
  locationName: string
): Promise<string | null> {
  try {
    console.log(`  📡 Querying Nominatim for coordinates: ${lat}, ${lng}`)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0 (https://travelblogr.com)'
        }
      }
    )

    if (!response.ok) {
      console.error(`  ❌ Nominatim API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (!data || !data.address) {
      console.error(`  ❌ No address data returned`)
      return null
    }

    // Extract region with comprehensive fallback strategy
    // Priority: state > region > province > county > district > ISO code
    const region = data.address.state ||
                  data.address.region ||
                  data.address.province ||
                  data.address.county ||
                  data.address.district ||
                  data.address['ISO3166-2-lvl4']?.split('-')[1] || // Extract from ISO code
                  null

    if (region) {
      console.log(`  ✅ Found region: ${region}`)
    } else {
      console.log(`  ⚠️ No region found in address data`)
    }

    return region

  } catch (error) {
    console.error(`  ❌ Nominatim fetch error:`, error)
    return null
  }
}

