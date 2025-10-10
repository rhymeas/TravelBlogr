/**
 * Background Location Update API
 * Updates existing locations with missing or stale data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  checkLocationNeedsUpdate,
  fixActivityDescriptions
} from '@/lib/services/locationUpdateService'
import { fetchLocationImage, fetchLocationGallery } from '@/lib/services/robustImageService'
import {
  fetchLocationImageHighQuality,
  fetchLocationGalleryHighQuality
} from '@/lib/services/enhancedImageService'
import { getEnhancedDescription } from '@/lib/services/locationDataService'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

interface UpdateRequest {
  locationId: string
  locationName: string
  force?: boolean // Force update even if not needed
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateRequest = await request.json()
    const { locationId, locationName, force = false } = body

    if (!locationId || !locationName) {
      return NextResponse.json(
        { success: false, error: 'Location ID and name are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    console.log(`🔄 Starting update for: ${locationName}`)

    // Get current location data
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('*, activities(*)')
      .eq('id', locationId)
      .single()

    if (fetchError || !location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    // Check if update is needed
    const updateStatus = checkLocationNeedsUpdate(location)
    
    if (!force && !updateStatus.needsUpdate) {
      return NextResponse.json({
        success: true,
        message: 'Location is up to date',
        status: updateStatus
      })
    }

    console.log(`📋 Update needed:`, updateStatus.missingData)

    const updates: any = {}
    const results: string[] = []

    // 1. Update images if needed (HIGH QUALITY)
    if (updateStatus.missingData.includes('images')) {
      try {
        console.log(`🖼️ Updating images with HIGH QUALITY versions...`)

        const featuredImage = await fetchLocationImageHighQuality(locationName)
        const allGalleryImages = await fetchLocationGalleryHighQuality(locationName, 20)

        const galleryImages = allGalleryImages.slice(0, 6)

        updates.featured_image = featuredImage
        updates.gallery_images = galleryImages
        results.push(`✅ Updated ${galleryImages.length} images`)
      } catch (error) {
        console.error('Error updating images:', error)
        results.push('⚠️ Failed to update images')
      }
    }

    // 2. Update description if needed
    if (updateStatus.missingData.includes('description')) {
      try {
        console.log(`📖 Updating description...`)
        
        // Try WikiVoyage first
        const wikiVoyageResponse = await fetch(
          `https://en.wikivoyage.org/api/rest_v1/page/summary/${encodeURIComponent(locationName)}`
        )
        
        let description = ''
        let travelGuideUrl = null
        
        if (wikiVoyageResponse.ok) {
          const wikiVoyageData = await wikiVoyageResponse.json()
          if (wikiVoyageData.extract) {
            description = wikiVoyageData.extract
            travelGuideUrl = wikiVoyageData.content_urls?.desktop?.page
          }
        }
        
        if (!description) {
          description = await getEnhancedDescription(locationName)
        }
        
        updates.description = description
        if (travelGuideUrl) {
          updates.travel_guide_url = travelGuideUrl
        }
        
        results.push('✅ Updated description')
      } catch (error) {
        console.error('Error updating description:', error)
        results.push('⚠️ Failed to update description')
      }
    }

    // 3. Fix activity descriptions
    if (updateStatus.missingData.includes('activity_descriptions')) {
      try {
        console.log(`🎯 Fixing activity descriptions...`)
        const fixed = await fixActivityDescriptions(locationId, locationName)
        results.push(`✅ Fixed ${fixed} activity descriptions`)
      } catch (error) {
        console.error('Error fixing activities:', error)
        results.push('⚠️ Failed to fix activity descriptions')
      }
    }

    // 4. Update metadata timestamp
    updates.last_data_refresh = new Date().toISOString()
    updates.data_sources = {
      ...location.data_sources,
      last_update: 'background_refresh'
    }

    // Save updates
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('locations')
        .update(updates)
        .eq('id', locationId)

      if (updateError) {
        console.error('Error saving updates:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to save updates' },
          { status: 500 }
        )
      }
    }

    console.log(`✅ Update complete for: ${locationName}`)

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${locationName}`,
      results,
      updated: Object.keys(updates)
    })

  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Update failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Check if location needs update
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'Location ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { data: location, error } = await supabase
      .from('locations')
      .select('*, activities(*)')
      .eq('id', locationId)
      .single()

    if (error || !location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    const status = checkLocationNeedsUpdate(location)

    return NextResponse.json({
      success: true,
      status
    })

  } catch (error) {
    console.error('Check update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check update status' },
      { status: 500 }
    )
  }
}

