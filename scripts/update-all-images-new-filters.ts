/**
 * Update ALL existing locations with new enhanced filters
 * Filters: sport, facade, bus, transparent, nude, woman, laughing
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// NEW COMPREHENSIVE filter keywords
const PROBLEMATIC_KEYWORDS = [
  // People
  'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
  'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
  'laughing', 'smiling', 'nude', 'naked',
  // Black & White
  'black-and-white', 'monochrome', 'grayscale', 'b-w', 'bw', 'greyscale',
  // Statues
  'statue', 'sculpture', 'monument-statue', 'bronze', 'marble',
  // Night
  'night', 'evening', 'dark', 'nighttime', 'illuminated',
  // Vehicles
  'car', 'taxi', 'vehicle', 'automobile', 'traffic', 'bus', 'train',
  // Military
  'military', 'army', 'soldier', 'war', 'tank', 'weapon', 'uniform', 'troops',
  // Silhouettes
  'silhouette', 'silhouetted', 'shadow', 'backlit',
  // Bridges
  'bridge', 'bridges', 'overpass', 'viaduct',
  // Sports
  'sport', 'sports', 'football', 'soccer', 'basketball', 'tennis',
  // Architecture Details
  'facade', 'building-facade', 'wall', 'door',
  // Image Quality
  'transparent', 'png', 'cutout', 'isolated'
]

function isProblematicImage(url: string): boolean {
  const urlLower = url.toLowerCase()
  return PROBLEMATIC_KEYWORDS.some(keyword => urlLower.includes(keyword))
}

async function updateAllLocations() {
  console.log('🔍 Fetching all locations...\n')
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, featured_image, gallery_images')
    .order('name')
  
  if (error || !locations) {
    console.error('❌ Error fetching locations:', error)
    return
  }
  
  console.log(`📊 Total locations: ${locations.length}\n`)
  
  let updatedCount = 0
  let skippedCount = 0
  
  for (const location of locations) {
    console.log(`\n📍 Checking: ${location.name}`)
    
    let needsUpdate = false
    let newFeaturedImage = location.featured_image
    let newGalleryImages = location.gallery_images || []
    
    // Check featured image
    if (location.featured_image && isProblematicImage(location.featured_image)) {
      console.log(`   ❌ Featured image has problematic keywords`)
      needsUpdate = true
      // Try to use first good gallery image as featured
      const goodGalleryImage = newGalleryImages.find((img: string) => !isProblematicImage(img))
      if (goodGalleryImage) {
        newFeaturedImage = goodGalleryImage
        console.log(`   ✅ Replaced featured with gallery image`)
      } else {
        newFeaturedImage = '/placeholder-location.svg'
        console.log(`   ⚠️ No good replacement, using placeholder`)
      }
    }
    
    // Check gallery images
    const originalGalleryCount = newGalleryImages.length
    newGalleryImages = newGalleryImages.filter((img: string) => !isProblematicImage(img))
    
    if (newGalleryImages.length < originalGalleryCount) {
      const removed = originalGalleryCount - newGalleryImages.length
      console.log(`   ❌ Removed ${removed} problematic gallery images`)
      needsUpdate = true
    }
    
    if (needsUpdate) {
      // Update database
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          featured_image: newFeaturedImage,
          gallery_images: newGalleryImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)
      
      if (updateError) {
        console.log(`   ❌ Update failed:`, updateError.message)
      } else {
        console.log(`   ✅ Updated successfully`)
        console.log(`      Featured: ${newFeaturedImage === '/placeholder-location.svg' ? 'PLACEHOLDER' : 'OK'}`)
        console.log(`      Gallery: ${newGalleryImages.length} images`)
        updatedCount++
      }
    } else {
      console.log(`   ✅ No problematic images found`)
      skippedCount++
    }
  }
  
  console.log(`\n\n📊 SUMMARY:`)
  console.log(`   Total locations: ${locations.length}`)
  console.log(`   Updated: ${updatedCount}`)
  console.log(`   Skipped (clean): ${skippedCount}`)
}

updateAllLocations()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

