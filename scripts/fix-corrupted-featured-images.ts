/**
 * Fix Corrupted Featured Images
 *
 * Fixes locations where featured_image contains region names or invalid data
 * instead of actual image URLs.
 *
 * Usage: npx tsx scripts/fix-corrupted-featured-images.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { fetchLocationImageHighQuality, fetchLocationGalleryHighQuality } from '../apps/web/lib/services/enhancedImageService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// API Health Check
interface APIHealth {
  brave: { status: 'ok' | 'error' | 'rate-limited'; message: string }
  reddit: { status: 'ok' | 'error' | 'rate-limited'; message: string }
}

const apiHealth: APIHealth = {
  brave: { status: 'ok', message: 'Ready' },
  reddit: { status: 'ok', message: 'Ready' }
}

/**
 * Check if a URL is valid
 */
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  
  // Must start with http/https
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  
  // Must not contain non-Latin characters (Arabic, Berber, etc.)
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u2D30-\u2D7F]/.test(url)) {
    return false
  }
  
  // Must have reasonable length
  if (url.length < 20 || url.length > 2000) return false
  
  return true
}

async function fixCorruptedImages() {
  console.log('🔍 Finding locations with corrupted featured images...\n')
  console.log('📊 Using HIGH-PRIORITY image sources:')
  console.log('   🥇 Priority #1: Brave Search API (fantastic high-quality images)')
  console.log('   🥈 Priority #2: Reddit ULTRA (10 strict filters for location-specific images)')
  console.log('   🥉 Priority #3+: Pexels, Unsplash, Wikimedia, Wikipedia, Openverse')
  console.log('   ⚠️ Graceful error handling for rate-limited/unavailable APIs\n')

  // Get all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, country, region, featured_image, gallery_images')
    .order('name')

  if (error || !locations) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  console.log(`📍 Found ${locations.length} locations\n`)

  let corrupted = 0
  let fixed = 0
  let skipped = 0
  let fetchErrors = 0

  for (const location of locations) {
    const isValid = isValidImageUrl(location.featured_image)

    if (!isValid && location.featured_image) {
      corrupted++
      console.log(`\n❌ Corrupted: ${location.name}`)
      console.log(`   Featured: "${location.featured_image.substring(0, 60)}..."`)

      // STRATEGY 1: Try to use first gallery image as featured
      const galleryImages = location.gallery_images || []
      const validGalleryImage = galleryImages.find((img: string) => isValidImageUrl(img))

      if (validGalleryImage) {
        console.log(`✅ Strategy 1: Using valid gallery image`)
        console.log(`   Image: "${validGalleryImage.substring(0, 60)}..."`)

        const { error: updateError } = await supabase
          .from('locations')
          .update({ featured_image: validGalleryImage })
          .eq('id', location.id)

        if (updateError) {
          console.error(`   ❌ Update failed:`, updateError)
          fetchErrors++
        } else {
          console.log(`   ✅ Fixed!`)
          fixed++
        }
      } else {
        // STRATEGY 2: Fetch fresh image using HIGH-PRIORITY sources (Brave → Reddit → Fallback)
        console.log(`⚠️ Strategy 2: Fetching fresh image using HIGH-PRIORITY sources...`)
        console.log(`   🥇 Trying Brave API + Reddit ULTRA...`)

        try {
          const freshImage = await fetchLocationImageHighQuality(
            location.name,
            undefined,
            location.region,
            location.country
          )

          if (freshImage && isValidImageUrl(freshImage)) {
            console.log(`✅ Fetched fresh image: "${freshImage.substring(0, 60)}..."`)

            const { error: updateError } = await supabase
              .from('locations')
              .update({ featured_image: freshImage })
              .eq('id', location.id)

            if (updateError) {
              console.error(`   ❌ Update failed:`, updateError)
              fetchErrors++
            } else {
              console.log(`   ✅ Fixed with fresh image!`)
              fixed++
            }
          } else {
            console.log(`⚠️ Fetched image invalid, clearing featured_image for fallback`)

            const { error: updateError } = await supabase
              .from('locations')
              .update({ featured_image: null })
              .eq('id', location.id)

            if (updateError) {
              console.error(`   ❌ Update failed:`, updateError)
              fetchErrors++
            } else {
              console.log(`   ✅ Cleared featured_image (will use fallback)`)
              fixed++
            }
          }
        } catch (fetchError: any) {
          // Graceful error handling for API failures
          const errorMsg = fetchError?.message || String(fetchError)

          if (errorMsg.includes('429') || errorMsg.includes('rate')) {
            console.error(`⚠️ API Rate Limited: ${errorMsg}`)
            apiHealth.brave.status = 'rate-limited'
            apiHealth.brave.message = 'Rate limit reached'
          } else if (errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED')) {
            console.error(`⚠️ API Timeout/Unavailable: ${errorMsg}`)
            apiHealth.brave.status = 'error'
            apiHealth.brave.message = 'API unavailable'
          } else {
            console.error(`❌ Fetch error: ${errorMsg}`)
          }

          console.log(`⚠️ Clearing featured_image for fallback generation`)

          const { error: updateError } = await supabase
            .from('locations')
            .update({ featured_image: null })
            .eq('id', location.id)

          if (updateError) {
            console.error(`   ❌ Update failed:`, updateError)
            fetchErrors++
          } else {
            console.log(`   ✅ Cleared featured_image (will use fallback)`)
            fixed++
          }
        }
      }
    } else if (isValid) {
      // Valid image
      skipped++
    }
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log(`📊 Summary:`)
  console.log(`   Total locations: ${locations.length}`)
  console.log(`   Corrupted: ${corrupted}`)
  console.log(`   Fixed: ${fixed}`)
  console.log(`   Skipped (valid): ${skipped}`)
  console.log(`   Fetch errors: ${fetchErrors}`)
  console.log(`${'='.repeat(70)}`)

  console.log(`\n🔍 API Health Status:`)
  console.log(`   Brave API: ${apiHealth.brave.status.toUpperCase()} - ${apiHealth.brave.message}`)
  console.log(`   Reddit ULTRA: ${apiHealth.reddit.status.toUpperCase()} - ${apiHealth.reddit.message}`)

  if (apiHealth.brave.status === 'rate-limited' || apiHealth.reddit.status === 'rate-limited') {
    console.log(`\n⚠️ WARNING: One or more APIs are rate-limited!`)
    console.log(`   This is normal - APIs have usage limits.`)
    console.log(`   Graceful fallback to lower-priority sources (Pexels, Unsplash, etc.)`)
    console.log(`   Try running this script again in a few minutes.`)
  }

  if (apiHealth.brave.status === 'error' || apiHealth.reddit.status === 'error') {
    console.log(`\n⚠️ WARNING: One or more APIs are unavailable!`)
    console.log(`   Check your internet connection or API status pages.`)
    console.log(`   Graceful fallback to lower-priority sources (Pexels, Unsplash, etc.)`)
  }

  if (fixed > 0) {
    console.log(`\n✅ Fixed ${fixed} corrupted featured images!`)
    console.log(`\n🔄 Next steps:`)
    console.log(`   1. Restart the dev server`)
    console.log(`   2. Visit location pages to verify images`)
    console.log(`   3. Run refetch button if needed`)
  } else {
    console.log(`\n✅ No corrupted images found!`)
  }
}

fixCorruptedImages().catch(console.error)

