/**
 * Validate and Fix Location Images
 *
 * This script:
 * 1. Checks all existing location images against new exclusion rules
 * 2. Identifies B&W, military, night, statue images
 * 3. Re-fetches images for locations with problematic images
 * 4. Updates database with new, filtered images
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fetchLocationImageHighQuality, fetchLocationGalleryHighQuality } from '../apps/web/lib/services/enhancedImageService'

// Load environment variables from apps/web/.env.local
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Keywords to detect problematic images
const PROBLEMATIC_KEYWORDS = [
  // Black & White
  'black-and-white', 'monochrome', 'grayscale', 'b-w', 'bw',
  // Military
  'military', 'army', 'soldier', 'war', 'tank', 'weapon', 'uniform', 'troops',
  // Night
  'night', 'evening', 'dark', 'nighttime', 'illuminated',
  // Statues
  'statue', 'sculpture', 'monument-statue', 'bronze', 'marble',
  // People
  'portrait', 'selfie', 'crowd',
]

/**
 * Check if an image URL contains problematic keywords
 */
function isProblematicImage(url: string): boolean {
  const urlLower = url.toLowerCase()
  return PROBLEMATIC_KEYWORDS.some(keyword => urlLower.includes(keyword))
}

/**
 * Validate and fix images for a single location
 */
async function validateAndFixLocation(location: any): Promise<{
  locationName: string
  hadProblems: boolean
  featuredImageFixed: boolean
  galleryImagesFixed: number
}> {
  console.log(`\n🔍 Checking: ${location.name}`)
  
  let hadProblems = false
  let featuredImageFixed = false
  let galleryImagesFixed = 0

  // Check featured image
  if (location.featured_image && isProblematicImage(location.featured_image)) {
    console.log(`  ⚠️ Featured image has problematic content`)
    hadProblems = true
    
    try {
      console.log(`  🔄 Fetching new featured image...`)
      const newFeaturedImage = await fetchLocationImageHighQuality(
        location.name,
        undefined,
        location.region,
        location.country
      )
      
      if (newFeaturedImage && newFeaturedImage !== '/placeholder-location.svg') {
        await supabase
          .from('locations')
          .update({ featured_image: newFeaturedImage })
          .eq('id', location.id)
        
        console.log(`  ✅ Featured image updated`)
        featuredImageFixed = true
      }
    } catch (error) {
      console.error(`  ❌ Failed to update featured image:`, error)
    }
  }

  // Check gallery images
  const galleryImages = location.gallery_images || []
  const problematicGalleryImages = galleryImages.filter((img: string) => isProblematicImage(img))
  
  if (problematicGalleryImages.length > 0) {
    console.log(`  ⚠️ Found ${problematicGalleryImages.length}/${galleryImages.length} problematic gallery images`)
    hadProblems = true
    
    try {
      console.log(`  🔄 Fetching new gallery images (target: 20)...`)
      const newGalleryImages = await fetchLocationGalleryHighQuality(
        location.name,
        20,
        location.region,
        location.country
      )
      
      if (newGalleryImages.length >= 10) {
        await supabase
          .from('locations')
          .update({ gallery_images: newGalleryImages })
          .eq('id', location.id)
        
        console.log(`  ✅ Gallery updated with ${newGalleryImages.length} new images`)
        galleryImagesFixed = newGalleryImages.length
      } else {
        console.log(`  ⚠️ Only found ${newGalleryImages.length} images, keeping existing`)
      }
    } catch (error) {
      console.error(`  ❌ Failed to update gallery:`, error)
    }
  }

  if (!hadProblems) {
    console.log(`  ✅ All images look good!`)
  }

  return {
    locationName: location.name,
    hadProblems,
    featuredImageFixed,
    galleryImagesFixed
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting image validation and fixing...\n')
  console.log('📋 Exclusion rules:')
  console.log('   - Black & White images')
  console.log('   - Military/Army/War images')
  console.log('   - Night/Dark images')
  console.log('   - Statue/Sculpture close-ups')
  console.log('   - People portraits\n')

  // Fetch all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, country, region, featured_image, gallery_images')
    .order('name')

  if (error) {
    console.error('❌ Error fetching locations:', error)
    process.exit(1)
  }

  if (!locations || locations.length === 0) {
    console.log('⚠️ No locations found')
    process.exit(0)
  }

  console.log(`📍 Found ${locations.length} locations to check\n`)
  console.log('=' .repeat(60))

  const results = []
  
  for (const location of locations) {
    const result = await validateAndFixLocation(location)
    results.push(result)
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 SUMMARY:\n')
  
  const locationsWithProblems = results.filter(r => r.hadProblems)
  const featuredImagesFixed = results.filter(r => r.featuredImageFixed).length
  const totalGalleryImagesFixed = results.reduce((sum, r) => sum + r.galleryImagesFixed, 0)

  console.log(`Total locations checked: ${results.length}`)
  console.log(`Locations with problems: ${locationsWithProblems.length}`)
  console.log(`Featured images fixed: ${featuredImagesFixed}`)
  console.log(`Gallery images fixed: ${totalGalleryImagesFixed}`)
  
  if (locationsWithProblems.length > 0) {
    console.log('\n📝 Locations that were updated:')
    locationsWithProblems.forEach(r => {
      console.log(`  - ${r.locationName}`)
    })
  }

  console.log('\n✅ Done!')
}

main().catch(console.error)

