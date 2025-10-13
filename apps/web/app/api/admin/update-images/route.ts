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

    console.log('🚀 Starting location image update...')

    // Get all locations
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, slug, country, featured_image, gallery_images')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching locations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({ message: 'No locations found' }, { status: 200 })
    }

    console.log(`📍 Found ${locations.length} locations`)

    const results = {
      updated: 0,
      skipped: 0,
      failed: 0,
      total: locations.length,
      details: [] as any[]
    }

    for (const location of locations) {
      console.log(`\n📍 Processing: ${location.name}, ${location.country}`)
      
      // Check if location already has valid images
      const hasValidFeaturedImage = 
        location.featured_image && 
        !location.featured_image.includes('placeholder') &&
        !location.featured_image.includes('.svg')
      
      const hasValidGallery = 
        location.gallery_images && 
        location.gallery_images.length > 0 &&
        !location.gallery_images[0].includes('placeholder')

      if (hasValidFeaturedImage && hasValidGallery) {
        console.log(`  ✅ Already has valid images, skipping`)
        results.skipped++
        results.details.push({
          name: location.name,
          status: 'skipped',
          reason: 'Already has valid images'
        })
        continue
      }

      try {
        // Fetch featured image
        let featuredImage = location.featured_image
        if (!hasValidFeaturedImage) {
          console.log(`  🖼️ Fetching featured image...`)
          featuredImage = await fetchLocationImage(location.name)
          console.log(`  ✅ Featured image: ${featuredImage.substring(0, 60)}...`)
        }

        // Fetch gallery images
        let galleryImages = location.gallery_images
        if (!hasValidGallery) {
          console.log(`  🖼️ Fetching gallery images...`)
          galleryImages = await fetchLocationGallery(location.name, 6)
          console.log(`  ✅ Gallery images: ${galleryImages.length} images`)
        }

        // Update database
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            featured_image: featuredImage,
            gallery_images: galleryImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', location.id)

        if (updateError) {
          console.error(`  ❌ Error updating location:`, updateError)
          results.failed++
          results.details.push({
            name: location.name,
            status: 'failed',
            error: updateError.message
          })
        } else {
          console.log(`  ✅ Successfully updated ${location.name}`)
          results.updated++
          results.details.push({
            name: location.name,
            status: 'updated',
            featuredImage: featuredImage?.substring(0, 60),
            galleryCount: galleryImages?.length || 0
          })
        }

        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error: any) {
        console.error(`  ❌ Error processing ${location.name}:`, error)
        results.failed++
        results.details.push({
          name: location.name,
          status: 'failed',
          error: error.message
        })
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Summary:')
    console.log(`  ✅ Updated: ${results.updated}`)
    console.log(`  ⏭️ Skipped: ${results.skipped}`)
    console.log(`  ❌ Failed: ${results.failed}`)
    console.log(`  📍 Total: ${results.total}`)
    console.log('='.repeat(60))

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    console.error('❌ Script failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

