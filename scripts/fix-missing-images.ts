/**
 * Fix Missing Images Script
 * Fetches images for locations that don't have featured_image
 */

import { createClient } from '@supabase/supabase-js'
import { fetchLocationImage } from '../apps/web/lib/services/robustImageService'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixMissingImages() {
  console.log('🔍 Finding locations with missing images...')

  // Get locations without images
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, country, region, featured_image')
    .or('featured_image.is.null,featured_image.eq.')
    .limit(20)

  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  if (!locations || locations.length === 0) {
    console.log('✅ All locations have images!')
    return
  }

  console.log(`📸 Found ${locations.length} locations without images`)

  for (const location of locations) {
    console.log(`\n🖼️ Fetching image for: ${location.name}, ${location.country}`)

    try {
      // Try multiple search terms
      const searchTerms = [
        `${location.name} ${location.country} cityscape`,
        `${location.name} ${location.country} landmark`,
        `${location.name} ${location.region || location.country}`,
        `${location.name} aerial view`,
        location.name
      ]

      let imageUrl: string | null = null

      for (const term of searchTerms) {
        console.log(`  🔍 Trying: "${term}"`)
        imageUrl = await fetchLocationImage(term)
        if (imageUrl) {
          console.log(`  ✅ Found image with: "${term}"`)
          break
        }
      }

      if (imageUrl) {
        // Update location with image
        const { error: updateError } = await supabase
          .from('locations')
          .update({ featured_image: imageUrl })
          .eq('id', location.id)

        if (updateError) {
          console.error(`  ❌ Error updating ${location.name}:`, updateError)
        } else {
          console.log(`  ✅ Updated ${location.name} with image`)
        }
      } else {
        console.log(`  ⚠️ No image found for ${location.name}`)
      }

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`  ❌ Error processing ${location.name}:`, error)
    }
  }

  console.log('\n✅ Done!')
}

fixMissingImages().catch(console.error)

