/**
 * Update Vilnius images only - filter out B&W, statues, cars
 * Uses the enhanced image service with Pexels/Unsplash
 */

import { createClient } from '@supabase/supabase-js'
import { fetchLocationImageHighQuality, fetchLocationGalleryHighQuality } from '../apps/web/lib/services/enhancedImageService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Check if image URL suggests it might be black & white, statue, or car
function shouldFilterImage(url: string, title: string = ''): boolean {
  const lowerUrl = url.toLowerCase()
  const lowerTitle = title.toLowerCase()
  const combined = lowerUrl + ' ' + lowerTitle
  
  // Filter out black & white indicators
  const bwKeywords = ['black_and_white', 'b&w', 'bw_', 'monochrome', 'grayscale', 'greyscale']
  if (bwKeywords.some(kw => combined.includes(kw))) {
    console.log(`  ⚠️ Filtered (B&W): ${title || url.substring(0, 50)}`)
    return true
  }
  
  // Filter out statues, sculptures, monuments (close-ups)
  const statueKeywords = ['statue', 'sculpture', 'monument', 'memorial', 'bust_of', 'gediminas']
  if (statueKeywords.some(kw => combined.includes(kw))) {
    console.log(`  ⚠️ Filtered (Statue): ${title || url.substring(0, 50)}`)
    return true
  }
  
  // Filter out cars, vehicles
  const vehicleKeywords = ['car', 'taxi', 'vehicle', 'automobile', 'traffic', 'bus']
  if (vehicleKeywords.some(kw => combined.includes(kw))) {
    console.log(`  ⚠️ Filtered (Vehicle): ${title || url.substring(0, 50)}`)
    return true
  }
  
  return false
}

// Fetch high-res from Wikimedia
async function fetchWikimediaHighRes(searchTerm: string): Promise<{ url: string; title: string } | null> {
  try {
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?` +
      `action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*`
    )
    if (!response.ok) return null
    const data = await response.json()
    if (!data.query?.search?.[0]) return null

    const pageTitle = data.query.search[0].title
    
    // Filter by title first
    if (shouldFilterImage('', pageTitle)) {
      return null
    }
    
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
    const url = imageInfo?.thumburl || imageInfo?.url
    
    if (!url) return null
    
    // Filter by URL
    if (shouldFilterImage(url, pageTitle)) {
      return null
    }
    
    return { url, title: pageTitle }
  } catch {
    return null
  }
}

// Fetch from Wikipedia
async function fetchWikipediaHighRes(searchTerm: string): Promise<{ url: string; title: string } | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    )
    if (!response.ok) return null
    const data = await response.json()

    let url: string | null = null
    if (data.originalimage?.source) {
      url = data.originalimage.source
    } else if (data.thumbnail?.source) {
      url = data.thumbnail.source.replace(/\/\d+px-/, '/2000px-')
    }
    
    if (!url) return null
    
    // Filter by URL and title
    if (shouldFilterImage(url, data.title || searchTerm)) {
      return null
    }
    
    return { url, title: data.title || searchTerm }
  } catch {
    return null
  }
}

// Generate search terms - focus on colorful cityscapes
function generateSearchTerms(locationName: string): string[] {
  return [
    `${locationName} cityscape`,
    `${locationName} skyline`,
    `${locationName} aerial view`,
    `${locationName} panorama`,
    `${locationName} old town`,
    `${locationName} architecture`,
    `${locationName} buildings`,
    `${locationName} cathedral`,
    `${locationName} church`,
    `${locationName} tower`,
    `${locationName} castle`,
    `${locationName} square`,
    `${locationName} city view`,
    `${locationName} downtown`,
    `${locationName} street`,
    `${locationName} urban landscape`,
    `${locationName} historic center`,
    `${locationName} river`,
    `${locationName} bridge`,
    `${locationName} park`,
    locationName
  ]
}

// Fetch gallery
async function fetchGallery(locationName: string, count: number = 20): Promise<string[]> {
  const allImages: string[] = []
  const searchTerms = generateSearchTerms(locationName)

  console.log(`🔍 Searching Wikimedia & Wikipedia (filtering B&W, statues, cars)...`)
  console.log(`   Target: ${count} images`)

  for (const term of searchTerms) {
    if (allImages.length >= count) break

    console.log(`   Trying: ${term}...`)

    // Try Wikimedia (multiple results)
    try {
      const response = await fetch(
        `https://commons.wikimedia.org/w/api.php?` +
        `action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=5&format=json&origin=*`
      )
      if (response.ok) {
        const data = await response.json()
        const results = data.query?.search || []

        for (const result of results) {
          if (allImages.length >= count) break

          const wikiResult = await fetchWikimediaHighRes(result.title)
          if (wikiResult && !allImages.includes(wikiResult.url)) {
            allImages.push(wikiResult.url)
            console.log(`     ✅ Found from Wikimedia`)
          }
        }
      }
    } catch (e) {
      // Continue
    }

    // Try Wikipedia
    const wpResult = await fetchWikipediaHighRes(term)
    if (wpResult && !allImages.includes(wpResult.url)) {
      allImages.push(wpResult.url)
      console.log(`     ✅ Found from Wikipedia`)
    }

    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log(`   Total found: ${allImages.length} images`)
  return allImages.slice(0, count)
}

async function updateVilnius() {
  console.log('🚀 Updating Vilnius images with enhanced quality filtering\n')
  console.log('   Using Pexels + Unsplash with smart filtering')
  console.log('   Filtering: B&W, statues, cars, night, people\n')

  // Get Vilnius location
  const { data: location, error } = await supabase
    .from('locations')
    .select('id, name, slug, region, country')
    .eq('slug', 'vilnius')
    .single()

  if (error || !location) {
    console.error('❌ Error fetching Vilnius:', error)
    return
  }

  console.log(`📍 Found: ${location.name}, ${location.country}\n`)

  try {
    // Fetch featured image using enhanced service
    console.log(`🖼️ Fetching featured image (hierarchical: city → region → country)...`)
    const featuredImage = await fetchLocationImageHighQuality(
      location.name,
      undefined,
      location.region,
      location.country
    )
    console.log(`✅ Featured: ${featuredImage}`)

    // Fetch gallery using enhanced service
    console.log(`\n🖼️ Fetching gallery (target: 20 images)...`)
    const galleryImages = await fetchLocationGalleryHighQuality(
      location.name,
      20,
      location.region,
      location.country
    )
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
    } else {
      console.log(`\n✅ Vilnius updated successfully!`)
      console.log(`   Featured: ${featuredImage}`)
      console.log(`   Gallery: ${galleryImages.length} images`)
    }

  } catch (error) {
    console.error(`❌ Error:`, error)
  }
}

updateVilnius()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

