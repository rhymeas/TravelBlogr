/**
 * Automated Background Job: Fix Missing Images
 * 
 * This cron job runs periodically to:
 * 1. Find locations without images
 * 2. Fetch images using the robust image service
 * 3. Update the database
 * 
 * Can be triggered:
 * - Manually via API call
 * - Automatically via Vercel Cron (vercel.json)
 * - On-demand from admin panel
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchLocationImage, fetchLocationGallery } from '@/lib/services/robustImageService'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 [CRON] Starting automated image fix job...')

    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find locations without images
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, country, region, featured_image')
      .or('featured_image.is.null,featured_image.eq.')
      .limit(10) // Process 10 at a time to avoid timeout

    if (error) {
      console.error('❌ [CRON] Error fetching locations:', error)
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }

    if (!locations || locations.length === 0) {
      console.log('✅ [CRON] All locations have images!')
      return NextResponse.json({ 
        success: true, 
        message: 'All locations have images',
        processed: 0 
      })
    }

    console.log(`📸 [CRON] Found ${locations.length} locations without images`)

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    // Process each location
    for (const location of locations) {
      console.log(`\n🖼️ [CRON] Processing: ${location.name}, ${location.country}`)

      try {
        let featuredImage: string | null = null

        // Try multiple search strategies
        const searchTerms = [
          `${location.name} ${location.country} cityscape`,
          `${location.name} ${location.country} landmark`,
          `${location.name} ${location.region || location.country}`,
          `${location.name} aerial view`,
          `${location.name} skyline`,
          location.name
        ]

        // Try each search term
        for (const term of searchTerms) {
          if (featuredImage) break

          console.log(`  🔍 Trying: "${term}"`)
          featuredImage = await fetchLocationImage(term)

          if (featuredImage) {
            console.log(`  ✅ Found image with: "${term}"`)
            break
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Fallback to placeholder if all sources fail
        if (!featuredImage) {
          const seed = location.name.toLowerCase().replace(/\s+/g, '-')
          featuredImage = `https://picsum.photos/seed/${seed}/1200/800`
          console.log(`  ⚠️ Using placeholder image`)
        }

        // Fetch gallery images (20 images for consistency with manual updates)
        let galleryImages: string[] = []
        try {
          galleryImages = await fetchLocationGallery(location.name, 20)
          console.log(`  🖼️ Fetched ${galleryImages.length} gallery images`)
        } catch (error) {
          console.error(`  ⚠️ Gallery fetch failed:`, error)
        }

        // Update database
        const { error: updateError } = await supabase
          .from('locations')
          .update({ 
            featured_image: featuredImage,
            gallery_images: galleryImages.length > 0 ? galleryImages : null,
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
          console.log(`  ✅ Updated ${location.name}`)
          results.success++
          results.details.push({
            location: location.name,
            status: 'success',
            imageUrl: featuredImage,
            galleryCount: galleryImages.length
          })
        }

        // Rate limiting between locations
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
    console.error('❌ [CRON] Fatal error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}

