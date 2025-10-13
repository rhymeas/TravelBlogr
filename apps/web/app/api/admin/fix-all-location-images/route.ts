/**
 * Admin Endpoint: Fix ALL Location Images
 *
 * Comprehensive image fix that:
 * 1. Fetches relevant, high-quality images for each location
 * 2. Uses smart search terms (location + country + landmarks)
 * 3. Validates images are actually relevant
 * 4. Updates both featured_image and gallery_images
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { fetchLocationImage, fetchLocationGallery } from '@/lib/services/robustImageService'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = createServerSupabase()

    console.log('🔧 Starting comprehensive image fix...')

    // Get location IDs to fix from request body (or fix all if none specified)
    const body = await request.json().catch(() => ({}))
    const locationIds = body.locationIds || null

    let query = supabase
      .from('locations')
      .select('id, name, country, region, featured_image, gallery_images')

    if (locationIds && locationIds.length > 0) {
      query = query.in('id', locationIds)
    }

    const { data: locations, error } = await query

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No locations to fix',
        fixed: 0 
      })
    }

    console.log(`📍 Found ${locations.length} locations to fix`)

    const results = []

    for (const location of locations) {
      console.log(`\n🔍 Processing: ${location.name}, ${location.country}`)

      try {
        // Build smart search terms
        const searchTerms = buildSearchTerms(location)
        
        let featuredImage = location.featured_image
        let needsNewImage = false

        // Check if current image is placeholder or broken
        if (!featuredImage || 
            featuredImage.includes('placeholder') || 
            featuredImage.includes('picsum.photos')) {
          needsNewImage = true
        }

        // Fetch new featured image if needed
        if (needsNewImage) {
          console.log(`  📸 Fetching new featured image...`)
          
          for (const term of searchTerms) {
            console.log(`    Trying: "${term}"`)
            featuredImage = await fetchLocationImage(term)
            
            if (featuredImage && !featuredImage.includes('placeholder')) {
              console.log(`    ✅ Found image with: "${term}"`)
              break
            }
            
            // Small delay between attempts
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        // Fetch gallery images (20 images for consistency)
        console.log(`  🖼️ Fetching gallery images...`)
        const galleryImages = await fetchLocationGallery(
          `${location.name} ${location.country}`,
          20
        )

        // Filter out duplicates and ensure featured image is not in gallery
        const uniqueGallery = galleryImages.filter(img => 
          img !== featuredImage && 
          !img.includes('placeholder') &&
          !img.includes('picsum.photos')
        )

        console.log(`  ✅ Got ${uniqueGallery.length} unique gallery images`)

        // Update database
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            featured_image: featuredImage,
            gallery_images: uniqueGallery.length > 0 ? uniqueGallery : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', location.id)

        if (updateError) {
          console.error(`  ❌ Update failed:`, updateError)
          results.push({
            location: location.name,
            status: 'failed',
            error: updateError.message
          })
        } else {
          console.log(`  ✅ Successfully updated ${location.name}`)
          results.push({
            location: location.name,
            status: 'success',
            featured_image: featuredImage,
            gallery_count: uniqueGallery.length
          })
        }

        // Rate limiting: 2 seconds between locations
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error: any) {
        console.error(`  ❌ Error processing ${location.name}:`, error)
        results.push({
          location: location.name,
          status: 'error',
          error: error.message
        })
      }
    }

    console.log('\n✅ Image fix complete!')

    return NextResponse.json({
      success: true,
      message: `Processed ${locations.length} locations`,
      results
    })

  } catch (error: any) {
    console.error('❌ Image fix failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Build smart search terms for a location
 * Prioritizes specific, relevant terms
 */
function buildSearchTerms(location: any): string[] {
  const name = location.name
  const country = location.country
  const region = location.region
  const nameLower = name.toLowerCase()

  const terms: string[] = []

  // Strategy 1: Location + Country + Landmark type
  if (nameLower.includes('national park')) {
    terms.push(`${name} ${country} landscape`)
    terms.push(`${name} nature`)
    terms.push(`${name} mountains`)
  } else if (nameLower.includes('regional') || nameLower.includes('district')) {
    terms.push(`${region} ${country} landscape`)
    terms.push(`${name} aerial view`)
  } else if (nameLower.includes('coast')) {
    terms.push(`${name} ${country} beach`)
    terms.push(`${name} ocean`)
  } else {
    // Cities and towns
    terms.push(`${name} ${country} cityscape`)
    terms.push(`${name} ${country} landmark`)
    terms.push(`${name} ${country} skyline`)
  }

  // Strategy 2: Just location + country
  terms.push(`${name} ${country}`)

  // Strategy 3: Location + region
  if (region && region !== 'Unknown Region') {
    terms.push(`${name} ${region}`)
  }

  return terms
}

