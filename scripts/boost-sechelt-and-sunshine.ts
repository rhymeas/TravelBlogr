/**
 * Boost Sechelt images and update Sunshine Coast Regional with new filters
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(searchTerm)}&license=by,by-sa,cc0&size=large&orientation=landscape&page_size=${count * 3}`,
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

async function boostSechelt() {
  console.log('\n📍 Boosting Sechelt images...\n')
  
  const allImages: string[] = []
  
  // Try broader search terms
  const searchTerms = [
    'Sechelt Canada',
    'Sunshine Coast Canada beach',
    'British Columbia coast',
    'BC coastal town',
    'Sechelt Peninsula',
    'Georgia Strait British Columbia'
  ]
  
  for (const term of searchTerms) {
    if (allImages.length >= 20) break
    console.log(`  Searching: "${term}"`)
    const images = await fetchOpenverseImages(term, 10)
    allImages.push(...images)
    await new Promise(r => setTimeout(r, 500))
  }
  
  const uniqueImages = [...new Set(allImages)].slice(0, 20)
  console.log(`\n  ✅ Total images: ${uniqueImages.length}`)
  
  if (uniqueImages.length > 0) {
    const { error } = await supabase
      .from('locations')
      .update({
        featured_image: uniqueImages[0],
        gallery_images: uniqueImages,
        updated_at: new Date().toISOString()
      })
      .eq('slug', 'sechelt')
    
    if (error) {
      console.log(`  ❌ Update failed:`, error.message)
    } else {
      console.log(`  ✅ Sechelt updated with ${uniqueImages.length} images!`)
    }
  }
}

async function updateSunshineCoastRegional() {
  console.log('\n📍 Updating Sunshine Coast Regional with new filters...\n')
  
  const allImages: string[] = []
  
  const searchTerms = [
    'Sunshine Coast British Columbia',
    'Sunshine Coast BC Canada',
    'Gibsons BC',
    'Powell River BC',
    'Sunshine Coast nature'
  ]
  
  for (const term of searchTerms) {
    if (allImages.length >= 20) break
    console.log(`  Searching: "${term}"`)
    const images = await fetchOpenverseImages(term, 10)
    allImages.push(...images)
    await new Promise(r => setTimeout(r, 500))
  }
  
  const uniqueImages = [...new Set(allImages)].slice(0, 20)
  console.log(`\n  ✅ Total images: ${uniqueImages.length}`)
  
  if (uniqueImages.length > 0) {
    const { error } = await supabase
      .from('locations')
      .update({
        featured_image: uniqueImages[0],
        gallery_images: uniqueImages,
        updated_at: new Date().toISOString()
      })
      .eq('slug', 'sunshine-coast-regional')
    
    if (error) {
      console.log(`  ❌ Update failed:`, error.message)
    } else {
      console.log(`  ✅ Sunshine Coast Regional updated with ${uniqueImages.length} images!`)
    }
  }
}

async function main() {
  console.log('🚀 Boosting BC Location Images\n')
  console.log('='.repeat(60))
  
  await boostSechelt()
  await new Promise(r => setTimeout(r, 1000))
  
  await updateSunshineCoastRegional()
  
  console.log('\n' + '='.repeat(60))
  console.log('\n✅ Done!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

