/**
 * Update images using FREE sources (no API keys needed)
 * Uses Wikimedia Commons and Wikipedia only
 *
 * Run: NEXT_PUBLIC_SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/update-images-no-api-keys.ts
 * Or set them in your shell environment
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Fetch high-res from Wikimedia
async function fetchWikimediaHighRes(searchTerm: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?` +
      `action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`
    )
    if (!response.ok) return null
    const data = await response.json()
    if (!data.query?.search?.[0]) return null

    const pageTitle = data.query.search[0].title
    const imageResponse = await fetch(
      `https://commons.wikimedia.org/w/api.php?` +
      `action=query&titles=${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=url|size&iiurlwidth=2000&format=json&origin=*`
    )
    if (!imageResponse.ok) return null
    const imageData = await imageResponse.json()
    const pages = imageData.query?.pages
    if (!pages) return null

    const page = Object.values(pages)[0] as any
    const imageInfo = page?.imageinfo?.[0]
    return imageInfo?.thumburl || imageInfo?.url || null
  } catch {
    return null
  }
}

// Fetch from Wikipedia
async function fetchWikipediaHighRes(searchTerm: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    )
    if (!response.ok) return null
    const data = await response.json()

    if (data.originalimage?.source) {
      return data.originalimage.source
    }
    if (data.thumbnail?.source) {
      return data.thumbnail.source.replace(/\/\d+px-/, '/2000px-')
    }
    return null
  } catch {
    return null
  }
}

// Generate search terms
function generateSearchTerms(locationName: string): string[] {
  return [
    locationName,
    `${locationName} cityscape`,
    `${locationName} skyline`,
    `${locationName} aerial view`,
    `${locationName} landmark`,
    `${locationName} architecture`,
    `${locationName} panorama`,
    `${locationName} city center`,
    `${locationName} downtown`,
    `${locationName} historic district`,
    `${locationName} famous buildings`,
    `${locationName} tourist attractions`,
    `${locationName} monuments`,
    `${locationName} city view`,
    `${locationName} urban landscape`
  ]
}

// Fetch gallery
async function fetchGallery(locationName: string, count: number = 20): Promise<string[]> {
  const allImages: string[] = []
  const searchTerms = generateSearchTerms(locationName)

  console.log(`🔍 Searching Wikimedia & Wikipedia...`)

  for (const term of searchTerms) {
    if (allImages.length >= count) break

    // Try Wikimedia
    const wikiImage = await fetchWikimediaHighRes(term)
    if (wikiImage && !allImages.includes(wikiImage)) {
      allImages.push(wikiImage)
      console.log(`  ✅ Found: ${term}`)
    }

    // Try Wikipedia
    const wpImage = await fetchWikipediaHighRes(term)
    if (wpImage && !allImages.includes(wpImage)) {
      allImages.push(wpImage)
      console.log(`  ✅ Found: ${term}`)
    }

    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return allImages.slice(0, count)
}

async function updateAllLocations() {
  console.log('🚀 Updating images (Wikimedia/Wikipedia only - no API keys needed)\n')

  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, slug, country')
    .order('created_at', { ascending: false })

  if (error || !locations || locations.length === 0) {
    console.error('❌ Error fetching locations:', error)
    return
  }

  console.log(`📍 Found ${locations.length} locations\n`)

  let updated = 0
  let failed = 0

  for (const location of locations) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📍 ${location.name}, ${location.country}`)
    console.log('='.repeat(60))

    try {
      // Fetch featured image
      console.log(`🖼️ Fetching featured image...`)
      const featuredImage = await fetchWikipediaHighRes(location.name) || 
                           await fetchWikimediaHighRes(`${location.name} cityscape`) ||
                           '/placeholder-location.svg'
      
      if (featuredImage !== '/placeholder-location.svg') {
        console.log(`✅ Featured: Found`)
      } else {
        console.log(`⚠️ Featured: Using placeholder`)
      }

      // Fetch gallery
      console.log(`\n🖼️ Fetching gallery (target: 20 images)...`)
      const galleryImages = await fetchGallery(location.name, 20)
      console.log(`✅ Gallery: ${galleryImages.length} images found`)

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
        console.error(`❌ Database error:`, updateError)
        failed++
      } else {
        console.log(`✅ Updated successfully`)
        updated++
      }

      // Delay between locations
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`❌ Error:`, error)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Updated: ${updated}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📍 Total: ${locations.length}`)
  console.log('='.repeat(60))
}

updateAllLocations()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })

