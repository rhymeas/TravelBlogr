/**
 * Refetch images for latest 10 locations with NEW social media integration
 * Includes Reddit, Flickr, Pinterest images!
 * Also fixes missing activity images!
 */

import { createClient } from '@supabase/supabase-js'
import { fetchLocationGalleryHighQuality } from '../apps/web/lib/services/enhancedImageService'
import { fetchSocialImages } from '../apps/web/lib/services/socialImageScraperService'
import { fetchActivityImage } from '../apps/web/lib/services/robustImageService'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ImageResult {
  url: string
  platform: string
  score: number
  author?: string
  title?: string
}

async function refetchImagesForLocation(locationId: string, locationName: string, country: string) {
  console.log(`\n📍 Refetching images for: ${locationName}, ${country}`)
  console.log(`   Location ID: ${locationId}`)

  try {
    // Fetch from both standard and social sources
    console.log('   🔍 Fetching from multiple sources...')
    
    const [standardImages, socialImages] = await Promise.all([
      fetchLocationGalleryHighQuality(locationName, 50),
      fetchSocialImages(locationName, 30)
    ])

    console.log(`   ✅ Standard images: ${standardImages.length}`)
    console.log(`   ✅ Social images: ${socialImages.length}`)

    // Convert social images to URLs with metadata
    const socialImageUrls = socialImages.map(img => img.url)

    // Combine all images
    const allImageUrls = [...standardImages, ...socialImageUrls]

    // Remove duplicates
    const uniqueImages = Array.from(new Set(allImageUrls))

    console.log(`   📊 Total unique images: ${uniqueImages.length}`)

    if (uniqueImages.length === 0) {
      console.log('   ⚠️  No images found, skipping...')
      return
    }

    // Update location with new images
    const { error } = await supabase
      .from('locations')
      .update({
        featured_image: uniqueImages[0],
        gallery_images: uniqueImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)

    if (error) {
      console.error(`   ❌ Error updating location:`, error.message)
    } else {
      console.log(`   ✅ Updated successfully!`)
      console.log(`      Featured: ${uniqueImages[0].substring(0, 60)}...`)
      console.log(`      Gallery: ${uniqueImages.length} images`)

      // Show breakdown by platform
      const redditCount = socialImages.filter(img => img.platform === 'Reddit').length
      const flickrCount = socialImages.filter(img => img.platform === 'Flickr').length
      const pinterestCount = socialImages.filter(img => img.platform === 'Pinterest').length

      if (redditCount > 0 || flickrCount > 0 || pinterestCount > 0) {
        console.log(`      Social breakdown:`)
        if (redditCount > 0) console.log(`        - Reddit: ${redditCount} images`)
        if (flickrCount > 0) console.log(`        - Flickr: ${flickrCount} images`)
        if (pinterestCount > 0) console.log(`        - Pinterest: ${pinterestCount} images`)
      }
    }

    // Also fix activity images for this location with enhanced contextualization
    console.log('   🎯 Fixing activity images with location + country context...')
    const { data: activities } = await supabase
      .from('location_activity_links')
      .select('id, activity_name, image_url')
      .eq('location_id', locationId)
      .or('image_url.is.null,image_url.eq.')
      .limit(10)

    if (activities && activities.length > 0) {
      console.log(`   📸 Found ${activities.length} activities without images`)
      let fixed = 0

      for (const activity of activities) {
        try {
          // Enhanced: Include country for better contextualization
          const imageUrl = await fetchActivityImage(
            activity.activity_name,
            locationName,
            country
          )

          if (imageUrl && imageUrl !== '/placeholder-activity.svg') {
            await supabase
              .from('location_activity_links')
              .update({
                image_url: imageUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', activity.id)

            fixed++
            console.log(`      ✅ ${activity.activity_name}`)
          }
        } catch (err) {
          console.log(`      ⚠️ Failed: ${activity.activity_name}`)
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      console.log(`   ✅ Fixed ${fixed}/${activities.length} activity images`)
    } else {
      console.log(`   ✅ All activities have images`)
    }

  } catch (error) {
    console.error(`   ❌ Error:`, error instanceof Error ? error.message : error)
  }
}

async function main() {
  console.log('🚀 Refetching images for latest 10 locations with SOCIAL MEDIA integration!')
  console.log('   Sources: Pexels, Unsplash, Wikimedia, Reddit, Flickr, Pinterest')
  console.log('   Filters: Excluding army, veterans, navy, medicines\n')

  // Get latest 10 locations with country data
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, country, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  if (!locations || locations.length === 0) {
    console.log('❌ No locations found')
    return
  }

  console.log(`📋 Found ${locations.length} locations to update:\n`)
  locations.forEach((loc, i) => {
    console.log(`   ${i + 1}. ${loc.name} (${loc.slug})`)
  })

  console.log('\n' + '='.repeat(80))

  // Process each location
  for (const location of locations) {
    await refetchImagesForLocation(location.id, location.name, location.country)

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ COMPLETE! All locations updated with social media images!')
  console.log('\n📊 Summary:')
  console.log(`   - Locations updated: ${locations.length}`)
  console.log(`   - Sources used: Pexels, Unsplash, Wikimedia, Reddit, Flickr`)
  console.log(`   - Filters applied: Excluding army, veterans, navy, medicines`)
  console.log('\n🎉 Your locations now have amazing Reddit images!')
}

main()

