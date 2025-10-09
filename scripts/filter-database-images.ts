/**
 * Filter out unwanted images from all locations in database
 * Removes images with: bugs, insects, signs, trees, cedar
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Complete filter keywords (matching enhancedImageService.ts)
const REJECT_KEYWORDS = [
  // People
  'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
  'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
  'laughing', 'smiling', 'nude', 'naked',
  // Interiors
  'bedroom', 'living room', 'interior', 'furniture', 'couch', 'bed', 'room',
  // Vehicles & Transport
  'car', 'vehicle', 'food', 'dish', 'meal', 'restaurant interior', 'bus', 'train',
  // Close-ups & Details
  'close-up', 'closeup', 'detail', 'macro',
  // Statues & Art
  'statue', 'sculpture', 'monument statue', 'bronze', 'marble statue',
  // Night & Dark
  'night', 'evening', 'dark', 'nighttime', 'illuminated', 'lights at night',
  // Street level
  'street view', 'sidewalk', 'pavement', 'crosswalk', 'pedestrian',
  // Black & White
  'black and white', 'monochrome', 'grayscale', 'b&w', 'bw',
  // Military & War
  'military', 'army', 'soldier', 'war', 'tank', 'weapon', 'uniform', 'troops',
  // Silhouettes
  'silhouette', 'silhouetted', 'shadow', 'backlit',
  // Bridges
  'bridge', 'bridges', 'overpass', 'viaduct',
  // Sports & Activities
  'sport', 'sports', 'football', 'soccer', 'basketball', 'tennis',
  // Architecture Details
  'facade', 'building facade', 'wall', 'door',
  // Image Quality
  'transparent', 'png', 'cutout', 'isolated',
  // Nature Close-ups (ENHANCED)
  'tree', 'trees', 'leaf', 'leaves', 'branch', 'trunk', 'forest floor', 'cedar',
  'animal', 'animals', 'bird', 'birds', 'wildlife', 'dog', 'cat', 'pet',
  'insect', 'insects', 'bug', 'bugs', 'butterfly', 'bee', 'spider',
  'sky only', 'clouds only', 'sunset', 'sunrise', 'dawn', 'dusk',
  // Signs & Text (NEW)
  'sign', 'signs', 'signage', 'text', 'billboard'
]

function shouldRejectImage(url: string): boolean {
  const urlLower = url.toLowerCase()
  return REJECT_KEYWORDS.some(keyword => urlLower.includes(keyword))
}

async function filterAllLocations() {
  console.log('🔍 Filtering images from all locations...\n')
  console.log('Filter keywords:', REJECT_KEYWORDS.length)
  console.log('=' .repeat(60))
  
  // Get all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, slug, name, featured_image, gallery_images')
    .order('name')
  
  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }
  
  if (!locations || locations.length === 0) {
    console.log('No locations found')
    return
  }
  
  console.log(`\nFound ${locations.length} locations\n`)
  
  let totalLocationsUpdated = 0
  let totalImagesRemoved = 0
  
  for (const location of locations) {
    const originalGallery = location.gallery_images || []
    const originalFeatured = location.featured_image
    
    if (originalGallery.length === 0 && !originalFeatured) {
      continue // Skip locations with no images
    }
    
    // Filter gallery images
    const filteredGallery = originalGallery.filter((url: string) => !shouldRejectImage(url))
    
    // Check featured image
    let newFeaturedImage = originalFeatured
    if (originalFeatured && shouldRejectImage(originalFeatured)) {
      // Featured image is bad, use first good gallery image
      newFeaturedImage = filteredGallery[0] || null
    }
    
    const removedCount = originalGallery.length - filteredGallery.length
    const featuredChanged = originalFeatured !== newFeaturedImage
    
    if (removedCount > 0 || featuredChanged) {
      console.log(`\n📍 ${location.name}`)
      console.log(`   Slug: ${location.slug}`)
      console.log(`   Gallery: ${originalGallery.length} → ${filteredGallery.length} (removed ${removedCount})`)
      
      if (featuredChanged) {
        console.log(`   Featured: CHANGED`)
        if (originalFeatured) {
          console.log(`     Old: ${originalFeatured.substring(0, 60)}...`)
        }
        if (newFeaturedImage) {
          console.log(`     New: ${newFeaturedImage.substring(0, 60)}...`)
        } else {
          console.log(`     New: NULL (no valid images!)`)
        }
      }
      
      // Show removed images
      if (removedCount > 0) {
        const removedImages = originalGallery.filter((url: string) => shouldRejectImage(url))
        console.log(`   Removed images:`)
        removedImages.forEach((url: string, i: number) => {
          const matchedKeywords = REJECT_KEYWORDS.filter(kw => url.toLowerCase().includes(kw))
          console.log(`     ${i + 1}. ${url.substring(0, 70)}...`)
          console.log(`        Matched: ${matchedKeywords.join(', ')}`)
        })
      }
      
      // Update database
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          featured_image: newFeaturedImage,
          gallery_images: filteredGallery,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)
      
      if (updateError) {
        console.log(`   ❌ Update failed:`, updateError.message)
      } else {
        console.log(`   ✅ Updated successfully`)
        totalLocationsUpdated++
        totalImagesRemoved += removedCount
      }
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   Total locations: ${locations.length}`)
  console.log(`   Locations updated: ${totalLocationsUpdated}`)
  console.log(`   Images removed: ${totalImagesRemoved}`)
  console.log(`   Locations skipped: ${locations.length - totalLocationsUpdated}`)
}

async function main() {
  console.log('🚀 Database Image Filter\n')
  console.log('This will remove images containing:')
  console.log('  - Trees, cedar, leaves, branches')
  console.log('  - Bugs, insects, animals, birds')
  console.log('  - Signs, signage, text, billboards')
  console.log('  - And 90+ other unwanted categories\n')
  
  await filterAllLocations()
  
  console.log('\n✅ Done!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

