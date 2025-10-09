#!/usr/bin/env tsx

/**
 * Remove Bug and Unwanted Images from Database
 * 
 * Scans all location images and removes:
 * - Insects/bugs (beetles, butterflies, spiders, etc.)
 * - Animals/wildlife
 * - Plants/flowers/trees
 * - Signs/text
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Comprehensive filter keywords
const REJECT_KEYWORDS = [
  // Insects & Bugs
  'insect', 'insects', 'bug', 'bugs', 'butterfly', 'bee', 'spider', 'beetle', 'moth', 'fly',
  'grylloblatta', 'scudderi', 'ant', 'wasp', 'mosquito', 'dragonfly', 'grasshopper',
  
  // Animals & Wildlife
  'animal', 'animals', 'bird', 'birds', 'wildlife', 'dog', 'cat', 'pet', 'mammal',
  'deer', 'bear', 'wolf', 'fox', 'rabbit', 'squirrel', 'raccoon', 'moose', 'elk',
  
  // Plants & Nature Close-ups
  'tree', 'trees', 'leaf', 'leaves', 'branch', 'trunk', 'forest floor', 'cedar', 'pine',
  'flower', 'flowers', 'plant', 'plants', 'flora', 'botanical', 'blossom', 'petal',
  
  // Signs & Text
  'sign', 'signs', 'signage', 'text', 'billboard', 'plaque', 'notice'
]

function shouldRejectImage(url: string): { reject: boolean; reason?: string } {
  const urlLower = url.toLowerCase()
  
  for (const keyword of REJECT_KEYWORDS) {
    if (urlLower.includes(keyword)) {
      return { reject: true, reason: keyword }
    }
  }
  
  return { reject: false }
}

async function removeUnwantedImages() {
  console.log('🔍 Scanning all locations for unwanted images...\n')

  // Fetch all locations
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, featured_image, gallery_images')
    .order('name')

  if (error) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  if (!locations || locations.length === 0) {
    console.log('No locations found')
    return
  }

  console.log(`Found ${locations.length} locations\n`)

  let totalRemoved = 0
  let locationsUpdated = 0

  for (const location of locations) {
    let updated = false
    let removedCount = 0
    const removedReasons: string[] = []

    // Check featured image
    let newFeaturedImage = location.featured_image
    if (location.featured_image) {
      const check = shouldRejectImage(location.featured_image)
      if (check.reject) {
        console.log(`   ❌ Featured: ${check.reason}`)
        newFeaturedImage = null
        removedCount++
        removedReasons.push(`featured (${check.reason})`)
        updated = true
      }
    }

    // Check gallery images
    let newGalleryImages = location.gallery_images || []
    if (Array.isArray(newGalleryImages) && newGalleryImages.length > 0) {
      const originalCount = newGalleryImages.length
      const filtered = newGalleryImages.filter((url: string) => {
        const check = shouldRejectImage(url)
        if (check.reject) {
          console.log(`   ❌ Gallery: ${check.reason} - ${url.substring(0, 80)}...`)
          removedCount++
          removedReasons.push(`gallery (${check.reason})`)
          return false
        }
        return true
      })

      if (filtered.length < originalCount) {
        newGalleryImages = filtered
        updated = true
      }
    }

    if (updated) {
      console.log(`\n📍 ${location.name}`)
      console.log(`   Removed: ${removedCount} images`)
      console.log(`   Reasons: ${removedReasons.join(', ')}`)

      // If featured image was removed, try to use first gallery image
      if (!newFeaturedImage && newGalleryImages.length > 0) {
        newFeaturedImage = newGalleryImages[0]
        console.log(`   ✅ Set new featured from gallery`)
      }

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
        console.error(`   ❌ Error updating ${location.name}:`, updateError)
      } else {
        console.log(`   ✅ Updated successfully`)
        console.log(`   Remaining images: ${newGalleryImages.length}`)
        totalRemoved += removedCount
        locationsUpdated++
      }
      console.log('')
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log(`   Total locations: ${locations.length}`)
  console.log(`   Locations updated: ${locationsUpdated}`)
  console.log(`   Images removed: ${totalRemoved}`)
  console.log(`   Locations skipped: ${locations.length - locationsUpdated} (already clean)`)
  console.log('='.repeat(60))

  // Verify results
  console.log('\n🔍 Verifying results...')
  for (const location of locations) {
    const { data: updated } = await supabase
      .from('locations')
      .select('name, gallery_images')
      .eq('id', location.id)
      .single()

    if (updated) {
      console.log(`✅ ${updated.name}: ${updated.gallery_images?.length || 0} images`)
    }
  }
}

removeUnwantedImages()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

