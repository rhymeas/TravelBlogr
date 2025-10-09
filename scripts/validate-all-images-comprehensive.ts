/**
 * Comprehensive Image Validation & Fixing Script
 * 
 * Validates ALL existing location images against quality filters:
 * - Black & white images
 * - Statues/sculptures
 * - Cars/vehicles
 * - Night/dark images
 * - People/portraits
 * - Silhouettes
 * - Bridges
 * - Military/war images
 * 
 * Re-fetches images using enhanced service with ALL platforms
 */

import { createClient } from '@supabase/supabase-js'
import { fetchLocationImageHighQuality, fetchLocationGalleryHighQuality } from '../apps/web/lib/services/enhancedImageService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Comprehensive filter keywords
const PROBLEMATIC_KEYWORDS = [
  // Black & White
  'black-and-white', 'monochrome', 'grayscale', 'b-w', 'bw', 'greyscale',
  // People (EXPANDED)
  'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
  'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
  // Statues & Sculptures
  'statue', 'sculpture', 'monument-statue', 'bronze', 'marble',
  // Night & Dark
  'night', 'evening', 'dark', 'nighttime', 'illuminated',
  // Vehicles
  'car', 'taxi', 'vehicle', 'automobile', 'traffic', 'bus', 'train',
  // Military & War
  'military', 'army', 'soldier', 'war', 'tank', 'weapon', 'uniform', 'troops',
  // Silhouettes
  'silhouette', 'silhouetted', 'shadow', 'backlit',
  // Bridges
  'bridge', 'bridges', 'overpass', 'viaduct'
]

function isProblematicImage(url: string): boolean {
  const urlLower = url.toLowerCase()
  return PROBLEMATIC_KEYWORDS.some(keyword => urlLower.includes(keyword))
}

async function validateAndFixLocation(location: any, stats: any) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`📍 ${location.name}, ${location.country}`)
  console.log('='.repeat(70))

  let needsUpdate = false
  let newFeaturedImage = location.featured_image
  let newGalleryImages = location.gallery_images || []

  // 1. Check featured image
  if (location.featured_image && isProblematicImage(location.featured_image)) {
    console.log(`❌ Featured image is problematic`)
    console.log(`   URL: ${location.featured_image.substring(0, 80)}...`)
    
    console.log(`🔄 Fetching new featured image from ALL platforms...`)
    newFeaturedImage = await fetchLocationImageHighQuality(
      location.name,
      undefined,
      location.region,
      location.country
    )
    
    if (newFeaturedImage !== location.featured_image) {
      console.log(`✅ New featured image: ${newFeaturedImage.substring(0, 80)}...`)
      needsUpdate = true
      stats.featuredFixed++
    }
  } else {
    console.log(`✅ Featured image OK`)
  }

  // 2. Check gallery images
  const galleryImages = location.gallery_images || []
  const problematicGalleryImages = galleryImages.filter((img: string) => 
    isProblematicImage(img)
  )

  if (problematicGalleryImages.length > 0) {
    console.log(`❌ Found ${problematicGalleryImages.length}/${galleryImages.length} problematic gallery images`)
    problematicGalleryImages.forEach((img: string, i: number) => {
      console.log(`   ${i + 1}. ${img.substring(0, 80)}...`)
    })
    
    console.log(`🔄 Fetching 20 new gallery images from ALL platforms...`)
    console.log(`   Using: Pexels, Unsplash, Wikimedia, Wikipedia, Openverse, Europeana`)
    
    newGalleryImages = await fetchLocationGalleryHighQuality(
      location.name,
      20,
      location.region,
      location.country
    )
    
    console.log(`✅ New gallery: ${newGalleryImages.length} images`)
    needsUpdate = true
    stats.galleryFixed++
  } else if (galleryImages.length < 10) {
    console.log(`⚠️ Gallery has only ${galleryImages.length} images (target: 20)`)
    console.log(`🔄 Fetching more images...`)
    
    newGalleryImages = await fetchLocationGalleryHighQuality(
      location.name,
      20,
      location.region,
      location.country
    )
    
    console.log(`✅ New gallery: ${newGalleryImages.length} images`)
    needsUpdate = true
    stats.galleryFixed++
  } else {
    console.log(`✅ Gallery OK (${galleryImages.length} images)`)
  }

  // 3. Update database if needed
  if (needsUpdate) {
    console.log(`\n💾 Updating database...`)
    const { error } = await supabase
      .from('locations')
      .update({
        featured_image: newFeaturedImage,
        gallery_images: newGalleryImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

    if (error) {
      console.error(`❌ Database update failed:`, error)
      stats.failed++
    } else {
      console.log(`✅ Database updated successfully`)
      stats.updated++
    }
  } else {
    console.log(`\n✅ No updates needed`)
    stats.skipped++
  }
}

async function validateAllLocations() {
  console.log('🚀 COMPREHENSIVE IMAGE VALIDATION & FIXING')
  console.log('=' .repeat(70))
  console.log('Checking ALL locations for problematic images:')
  console.log('  ❌ Black & white')
  console.log('  ❌ Statues/sculptures')
  console.log('  ❌ Cars/vehicles')
  console.log('  ❌ Night/dark images')
  console.log('  ❌ People/portraits')
  console.log('  ❌ Silhouettes')
  console.log('  ❌ Bridges')
  console.log('  ❌ Military/war')
  console.log('\n✅ Using ALL platforms:')
  console.log('  • Pexels (unlimited, high quality)')
  console.log('  • Unsplash (50/hour, high quality)')
  console.log('  • Wikimedia Commons (free, high-res)')
  console.log('  • Wikipedia (free, original images)')
  console.log('  • Openverse (800M+ images, free)')
  console.log('  • Europeana (50M+ cultural heritage)')
  console.log('=' .repeat(70))

  // Get all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, region, country, featured_image, gallery_images')
    .order('created_at', { ascending: false })

  if (error || !locations || locations.length === 0) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  console.log(`\n📍 Found ${locations.length} locations to check\n`)

  const stats = {
    total: locations.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    featuredFixed: 0,
    galleryFixed: 0
  }

  // Process each location
  for (const location of locations) {
    await validateAndFixLocation(location, stats)
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Final summary
  console.log(`\n${'='.repeat(70)}`)
  console.log('📊 FINAL SUMMARY')
  console.log('='.repeat(70))
  console.log(`Total locations checked: ${stats.total}`)
  console.log(`✅ Updated: ${stats.updated}`)
  console.log(`⏭️  Skipped (no issues): ${stats.skipped}`)
  console.log(`❌ Failed: ${stats.failed}`)
  console.log(`\nDetails:`)
  console.log(`  Featured images fixed: ${stats.featuredFixed}`)
  console.log(`  Gallery sets fixed: ${stats.galleryFixed}`)
  console.log('='.repeat(70))
}

// Run the validation
validateAllLocations()
  .then(() => {
    console.log('\n✅ Validation complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

