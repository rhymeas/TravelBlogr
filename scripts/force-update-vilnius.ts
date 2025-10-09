/**
 * FORCE update Vilnius with Pexels/Unsplash ONLY
 * Wikimedia has too many problematic images that don't have keywords in URLs
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PEXELS_API_KEY = process.env.PEXELS_API_KEY!
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!

// COMPREHENSIVE filter keywords
const REJECT_KEYWORDS = [
  // People (EXPANDED)
  'person', 'woman', 'man', 'people', 'portrait', 'face', 'selfie', 'crowd',
  'human', 'lady', 'gentleman', 'boy', 'girl', 'child', 'tourist', 'traveler',
  // Interiors
  'bedroom', 'living room', 'interior', 'furniture', 'couch', 'bed', 'room',
  // Vehicles
  'car', 'vehicle', 'road trip', 'dashboard', 'bus', 'train', 'taxi',
  // Statues & Art
  'statue', 'sculpture', 'bronze', 'marble statue',
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
  'bridge', 'bridges', 'overpass', 'viaduct'
]

async function fetchPexelsImages(searchTerm: string, count: number = 20): Promise<string[]> {
  const images: string[] = []
  
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=${count * 2}&orientation=landscape`,
      { headers: { 'Authorization': PEXELS_API_KEY } }
    )
    
    if (!response.ok) return []
    const data = await response.json()
    
    if (!data.photos) return []
    
    // SMART FILTERING
    const filtered = data.photos.filter((p: any) => {
      const alt = (p.alt || '').toLowerCase()
      
      // Reject problematic keywords
      if (REJECT_KEYWORDS.some(kw => alt.includes(kw))) return false
      
      // Reject B&W indicators
      if (alt.includes('black') || alt.includes('white') || alt.includes('gray') || alt.includes('grey')) return false
      
      return true
    })
    
    filtered.forEach((p: any) => {
      if (images.length < count) {
        images.push(p.src.original || p.src.large2x)
      }
    })
    
    console.log(`✅ Pexels: ${images.length}/${data.photos.length} relevant for "${searchTerm}"`)
  } catch (e) {
    console.error('Pexels error:', e)
  }
  
  return images
}

async function fetchUnsplashImages(searchTerm: string, count: number = 20): Promise<string[]> {
  const images: string[] = []
  
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=${count * 2}&orientation=landscape`,
      { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    )
    
    if (!response.ok) return []
    const data = await response.json()
    
    if (!data.results) return []
    
    // SMART FILTERING
    const filtered = data.results.filter((r: any) => {
      const desc = (r.description || r.alt_description || '').toLowerCase()
      
      // Reject problematic keywords
      if (REJECT_KEYWORDS.some(kw => desc.includes(kw))) return false
      
      // Reject B&W indicators
      if (desc.includes('black') || desc.includes('white') || desc.includes('gray') || desc.includes('grey')) return false
      
      return true
    })
    
    filtered.forEach((r: any) => {
      if (images.length < count) {
        images.push(r.urls.full || r.urls.regular)
      }
    })
    
    console.log(`✅ Unsplash: ${images.length}/${data.results.length} relevant for "${searchTerm}"`)
  } catch (e) {
    console.error('Unsplash error:', e)
  }
  
  return images
}

async function forceUpdateVilnius() {
  console.log('🚀 FORCE UPDATE: Vilnius (Pexels + Unsplash ONLY)')
  console.log('   Avoiding Wikimedia due to unfiltered military/war images\n')
  
  const allImages: string[] = []
  
  // Search terms
  const terms = [
    'Vilnius Lithuania cityscape',
    'Vilnius skyline',
    'Vilnius old town',
    'Vilnius architecture',
    'Vilnius cathedral',
    'Vilnius aerial view',
    'Vilnius panorama',
    'Vilnius city view'
  ]
  
  // Fetch from Pexels
  console.log('📸 Fetching from Pexels...')
  for (const term of terms) {
    const images = await fetchPexelsImages(term, 5)
    allImages.push(...images)
    if (allImages.length >= 20) break
    await new Promise(r => setTimeout(r, 500))
  }
  
  // Fetch from Unsplash if needed
  if (allImages.length < 20) {
    console.log('\n📸 Fetching from Unsplash...')
    for (const term of terms) {
      const images = await fetchUnsplashImages(term, 5)
      allImages.push(...images)
      if (allImages.length >= 20) break
      await new Promise(r => setTimeout(r, 500))
    }
  }
  
  // Deduplicate
  const uniqueImages = [...new Set(allImages)].slice(0, 20)
  
  console.log(`\n✅ Total unique images: ${uniqueImages.length}`)
  
  // Get featured image (first one)
  const featuredImage = uniqueImages[0] || '/placeholder-location.svg'
  
  // Update database
  console.log('\n💾 Updating database...')
  const { error } = await supabase
    .from('locations')
    .update({
      featured_image: featuredImage,
      gallery_images: uniqueImages,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'vilnius')
  
  if (error) {
    console.error('❌ Database error:', error)
  } else {
    console.log('✅ Vilnius updated successfully!')
    console.log(`   Featured: ${featuredImage}`)
    console.log(`   Gallery: ${uniqueImages.length} images`)
    console.log('\n📋 Gallery URLs:')
    uniqueImages.forEach((img, i) => {
      console.log(`   ${i+1}. ${img.substring(0, 80)}...`)
    })
  }
}

forceUpdateVilnius()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

