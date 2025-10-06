/**
 * Script to update all existing locations with proper images
 * Uses the robust image service with multiple fallbacks
 *
 * Run from project root: node --loader tsx scripts/update-location-images.ts
 */

// Load environment variables
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Location {
  id: string
  name: string
  slug: string
  country: string
  featured_image: string | null
  gallery_images: string[] | null
}

async function updateLocationImages() {
  console.log('🚀 Starting location image update...\n')

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
      skipped++
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
        failed++
      } else {
        console.log(`  ✅ Successfully updated ${location.name}`)
        updated++
      }

      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`  ❌ Error processing ${location.name}:`, error)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log(`  ✅ Updated: ${updated}`)
  console.log(`  ⏭️ Skipped: ${skipped}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  📍 Total: ${locations.length}`)
  console.log('='.repeat(60))
}

// Run the script
updateLocationImages()
  .then(() => {
    console.log('\n✅ Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

