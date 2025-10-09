/**
 * Fix Okanagan images - fetch proper landscape/cityscape images
 * Using Wikimedia/Wikipedia with better search terms
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

// Fetch from Wikimedia
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

// Fetch from Openverse
async function fetchOpenverseImages(searchTerm: string, count: number = 10): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(searchTerm)}&license=by,by-sa,cc0&size=large&orientation=landscape&page_size=${count}`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0',
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) return []
    const data = await response.json()
    const images = data.results?.map((img: any) => img.url).filter((url: string) => url) || []
    
    if (images.length > 0) {
      console.log(`✅ Openverse: Found ${images.length} images for "${searchTerm}"`)
    }
    return images
  } catch {
    return []
  }
}

async function fixOkanagan() {
  console.log('🚀 Fixing Okanagan images')
  console.log('   Using: Wikimedia, Wikipedia, Openverse')
  console.log('   Search terms: Okanagan Valley, Kelowna, British Columbia\n')
  
  const allImages: string[] = []
  
  // Better search terms for Okanagan region
  const searchTerms = [
    'Okanagan Valley British Columbia',
    'Okanagan Lake Canada',
    'Kelowna British Columbia',
    'Okanagan wine country',
    'Okanagan Valley vineyard',
    'Okanagan Valley landscape',
    'Kelowna cityscape',
    'Okanagan Valley panorama'
  ]
  
  // Fetch from Openverse
  console.log('📸 Fetching from Openverse...')
  for (const term of searchTerms) {
    const images = await fetchOpenverseImages(term, 5)
    allImages.push(...images)
    if (allImages.length >= 20) break
    await new Promise(r => setTimeout(r, 300))
  }
  
  // Fetch from Wikipedia
  console.log('\n📸 Fetching from Wikipedia...')
  const wikiTerms = [
    'Okanagan',
    'Kelowna',
    'Okanagan Lake',
    'Okanagan Valley'
  ]
  
  for (const term of wikiTerms) {
    const img = await fetchWikipediaHighRes(term)
    if (img && !allImages.includes(img)) {
      allImages.push(img)
      console.log(`✅ Wikipedia: Found for "${term}"`)
    }
    if (allImages.length >= 20) break
    await new Promise(r => setTimeout(r, 300))
  }
  
  // Fetch from Wikimedia
  if (allImages.length < 20) {
    console.log('\n📸 Fetching from Wikimedia...')
    for (const term of searchTerms) {
      const img = await fetchWikimediaHighRes(term)
      if (img && !allImages.includes(img)) {
        allImages.push(img)
        console.log(`✅ Wikimedia: Found for "${term}"`)
      }
      if (allImages.length >= 20) break
      await new Promise(r => setTimeout(r, 300))
    }
  }
  
  // Deduplicate
  const uniqueImages = [...new Set(allImages)].slice(0, 20)
  
  console.log(`\n✅ Total unique images: ${uniqueImages.length}`)
  
  // Use first image as featured
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
    .eq('slug', 'regional-district-of-central-okanagan')
  
  if (error) {
    console.error('❌ Database error:', error)
  } else {
    console.log('✅ Okanagan updated successfully!')
    console.log(`   Featured: ${featuredImage}`)
    console.log(`   Gallery: ${uniqueImages.length} images`)
    console.log('\n📋 First 5 gallery URLs:')
    uniqueImages.slice(0, 5).forEach((img, i) => {
      console.log(`   ${i+1}. ${img.substring(0, 80)}...`)
    })
  }
}

fixOkanagan()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

