/**
 * Fix all British Columbia locations with proper images using enhanced image service
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Enhanced filter keywords
const REJECT_KEYWORDS = [
  'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
  'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
  'laughing', 'smiling', 'nude', 'naked',
  'black-and-white', 'monochrome', 'grayscale', 'b-w', 'bw',
  'statue', 'sculpture', 'bronze', 'marble',
  'night', 'evening', 'dark', 'nighttime', 'illuminated',
  'car', 'vehicle', 'bus', 'train', 'taxi',
  'military', 'army', 'soldier', 'war', 'weapon',
  'silhouette', 'shadow', 'backlit',
  'bridge', 'bridges', 'overpass',
  'sport', 'sports', 'football', 'soccer',
  'facade', 'building-facade',
  'transparent', 'png', 'cutout'
]

async function fetchOpenverseImages(searchTerm: string, count: number = 20): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(searchTerm)}&license=by,by-sa,cc0&size=large&orientation=landscape&page_size=${count * 2}`,
      { headers: { 'User-Agent': 'TravelBlogr/1.0', 'Accept': 'application/json' } }
    )
    if (!response.ok) return []
    const data = await response.json()
    
    const filtered = data.results?.filter((img: any) => {
      const title = (img.title || '').toLowerCase()
      const tags = (img.tags || []).map((t: any) => t.name?.toLowerCase() || '').join(' ')
      const combined = `${title} ${tags}`
      return !REJECT_KEYWORDS.some(kw => combined.includes(kw))
    }) || []
    
    const images = filtered.slice(0, count).map((img: any) => img.url).filter((url: string) => url)
    console.log(`  Openverse: ${images.length} images for "${searchTerm}"`)
    return images
  } catch (e) {
    console.error('  Openverse error:', e)
    return []
  }
}

async function fetchWikimediaImages(searchTerm: string, count: number = 10): Promise<string[]> {
  try {
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*&srlimit=${count * 2}`
    )
    if (!response.ok) return []
    const data = await response.json()
    
    const images: string[] = []
    for (const result of data.query?.search || []) {
      if (images.length >= count) break
      
      const pageTitle = result.title
      const imageResponse = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=url|size&iiurlwidth=2000&format=json&origin=*`
      )
      if (!imageResponse.ok) continue
      
      const imageData = await imageResponse.json()
      const pages = imageData.query?.pages
      if (!pages) continue
      
      const page = Object.values(pages)[0] as any
      const imageInfo = page?.imageinfo?.[0]
      const url = imageInfo?.thumburl || imageInfo?.url
      
      if (url && !REJECT_KEYWORDS.some(kw => url.toLowerCase().includes(kw))) {
        images.push(url)
      }
      
      await new Promise(r => setTimeout(r, 200))
    }
    
    console.log(`  Wikimedia: ${images.length} images for "${searchTerm}"`)
    return images
  } catch (e) {
    console.error('  Wikimedia error:', e)
    return []
  }
}

async function fetchWikipediaImage(searchTerm: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    )
    if (!response.ok) return null
    const data = await response.json()
    
    const url = data.originalimage?.source || data.thumbnail?.source?.replace(/\/\d+px-/, '/2000px-')
    if (url && !REJECT_KEYWORDS.some(kw => url.toLowerCase().includes(kw))) {
      console.log(`  Wikipedia: Found image for "${searchTerm}"`)
      return url
    }
    return null
  } catch {
    return null
  }
}

async function fixLocation(slug: string, name: string, searchTerms: string[]) {
  console.log(`\n📍 Fixing: ${name}`)
  console.log(`   Slug: ${slug}`)
  
  const allImages: string[] = []
  
  // Fetch from multiple sources
  for (const term of searchTerms) {
    console.log(`\n  Searching: "${term}"`)
    
    // Openverse
    const openverseImages = await fetchOpenverseImages(term, 10)
    allImages.push(...openverseImages)
    
    if (allImages.length >= 20) break
    await new Promise(r => setTimeout(r, 500))
    
    // Wikimedia
    if (allImages.length < 20) {
      const wikimediaImages = await fetchWikimediaImages(term, 5)
      allImages.push(...wikimediaImages)
    }
    
    if (allImages.length >= 20) break
    await new Promise(r => setTimeout(r, 500))
  }
  
  // Wikipedia featured image
  const wikiImage = await fetchWikipediaImage(searchTerms[0])
  if (wikiImage && !allImages.includes(wikiImage)) {
    allImages.unshift(wikiImage)
  }
  
  // Deduplicate and limit
  const uniqueImages = [...new Set(allImages)].slice(0, 20)
  
  console.log(`\n  ✅ Total images: ${uniqueImages.length}`)
  
  if (uniqueImages.length === 0) {
    console.log(`  ⚠️ No images found, skipping update`)
    return
  }
  
  // Update database
  const featuredImage = uniqueImages[0]
  const { error } = await supabase
    .from('locations')
    .update({
      featured_image: featuredImage,
      gallery_images: uniqueImages,
      updated_at: new Date().toISOString()
    })
    .eq('slug', slug)
  
  if (error) {
    console.log(`  ❌ Update failed:`, error.message)
  } else {
    console.log(`  ✅ Updated successfully!`)
    console.log(`     Featured: ${featuredImage.substring(0, 60)}...`)
    console.log(`     Gallery: ${uniqueImages.length} images`)
  }
}

async function fixAllBCLocations() {
  console.log('🚀 Fixing British Columbia Locations\n')
  console.log('=' .repeat(60))
  
  // Define all BC locations with their search terms
  const locations = [
    {
      slug: 'squamish',
      name: 'Squamish, British Columbia, Canada',
      searchTerms: [
        'Squamish British Columbia',
        'Squamish BC Canada landscape',
        'Squamish mountains',
        'Stawamus Chief Squamish',
        'Squamish outdoor recreation'
      ]
    },
    {
      slug: 'kelowna',
      name: 'Kelowna, British Columbia, Canada',
      searchTerms: [
        'Kelowna British Columbia',
        'Kelowna Okanagan Lake',
        'Kelowna cityscape',
        'Kelowna vineyards',
        'Kelowna waterfront'
      ]
    },
    {
      slug: 'sechelt',
      name: 'Sechelt, British Columbia, Canada',
      searchTerms: [
        'Sechelt British Columbia',
        'Sechelt Sunshine Coast',
        'Sechelt beach',
        'Sechelt waterfront',
        'Sechelt BC landscape'
      ]
    },
    {
      slug: 'sunshine-coast-regional-district',
      name: 'Sunshine Coast Regional District, British Columbia, Canada',
      searchTerms: [
        'Sunshine Coast British Columbia',
        'Sunshine Coast BC',
        'Sunshine Coast landscape',
        'Sunshine Coast beaches',
        'Sunshine Coast nature'
      ]
    },
    {
      slug: 'regional-district-of-central-okanagan',
      name: 'Regional District of Central Okanagan, British Columbia, Canada',
      searchTerms: [
        'Okanagan Valley British Columbia',
        'Okanagan Lake',
        'Central Okanagan landscape',
        'Okanagan vineyards',
        'Okanagan wine country'
      ]
    }
  ]
  
  for (const location of locations) {
    await fixLocation(location.slug, location.name, location.searchTerms)
    await new Promise(r => setTimeout(r, 1000)) // Rate limiting
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`\n✅ Completed fixing ${locations.length} BC locations!`)
}

fixAllBCLocations()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

