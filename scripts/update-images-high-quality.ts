/**
 * Script to update locations with HIGH QUALITY images
 * 
 * Features:
 * - Fetches high-resolution images (2000px+)
 * - Gets 20 images per location
 * - Better search terms for location-specific content
 * - Filters out low-quality/irrelevant images
 * 
 * Run: npx tsx scripts/update-images-high-quality.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Import the enhanced image service
import { 
  fetchLocationImageHighQuality, 
  fetchLocationGalleryHighQuality 
} from '../apps/web/lib/services/enhancedImageService'

interface Location {
  id: string
  name: string
  slug: string
  country: string
  featured_image: string | null
  gallery_images: string[] | null
}

async function updateImagesHighQuality() {
  console.log('🚀 Starting HIGH QUALITY image update...\n')
  console.log('📋 Configuration:')
  console.log(`   - Target: 20 images per location`)
  console.log(`   - Min resolution: 1200x800px`)
  console.log(`   - Sources: Pixabay, Pexels, Unsplash, Wikimedia\n`)

  // Get all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, country, featured_image, gallery_images')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  if (!locations || locations.length === 0) {
    console.log('ℹ️ No locations found')
    return
  }

  console.log(`📍 Found ${locations.length} locations\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const location of locations as Location[]) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📍 Processing: ${location.name}, ${location.country}`)
    console.log('='.repeat(60))

    try {
      // Fetch HIGH QUALITY featured image
      console.log(`🖼️ Fetching HIGH-RES featured image...`)
      const featuredImage = await fetchLocationImageHighQuality(location.name)
      
      if (featuredImage === '/placeholder-location.svg') {
        console.log(`⚠️ Could not find high-quality featured image`)
      } else {
        console.log(`✅ Featured image: ${featuredImage.substring(0, 80)}...`)
      }

      // Fetch HIGH QUALITY gallery (20 images)
      console.log(`\n🖼️ Fetching 20 HIGH-RES gallery images...`)
      const galleryImages = await fetchLocationGalleryHighQuality(location.name, 20)
      
      console.log(`\n📊 Results:`)
      console.log(`   - Featured: ${featuredImage !== '/placeholder-location.svg' ? '✅' : '❌'}`)
      console.log(`   - Gallery: ${galleryImages.length} images`)
      
      if (galleryImages.length < 10) {
        console.log(`   ⚠️ Warning: Only found ${galleryImages.length} images (target: 20)`)
      }

      // Update database
      console.log(`\n💾 Updating database...`)
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          featured_image: featuredImage,
          gallery_images: galleryImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)

      if (updateError) {
        console.error(`❌ Error updating location:`, updateError)
        failed++
      } else {
        console.log(`✅ Successfully updated ${location.name}`)
        updated++
      }

      // Rate limiting delay (respect API limits)
      console.log(`⏳ Waiting 2 seconds before next location...`)
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error(`❌ Error processing ${location.name}:`, error)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 FINAL SUMMARY:')
  console.log('='.repeat(60))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️ Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📍 Total: ${locations.length}`)
  console.log('='.repeat(60))
}

// Run the script
updateImagesHighQuality()
  .then(() => {
    console.log('\n✅ Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

