/**
 * Refresh Vilnius image with improved search
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchPexelsImage(searchTerm: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY

  if (!apiKey) {
    console.log('❌ No Pexels API key found')
    return null
  }

  try {
    console.log(`🔍 Searching Pexels for: "${searchTerm}"`)
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=10&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey
        }
      }
    )

    if (!response.ok) {
      console.log(`❌ Pexels API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.photos && data.photos.length > 0) {
      // Filter for high-quality images
      const qualityPhotos = data.photos.filter((photo: any) => {
        const width = photo.width
        const height = photo.height
        const aspectRatio = width / height
        return width >= 1920 && aspectRatio >= 1.3 && aspectRatio <= 2.5
      })

      const selectedPhoto = qualityPhotos[0] || data.photos[0]
      
      console.log(`✅ Found image: ${selectedPhoto.width}x${selectedPhoto.height}`)
      console.log(`   URL: ${selectedPhoto.src.large2x}`)
      console.log(`   Photographer: ${selectedPhoto.photographer}`)
      
      return selectedPhoto.src.large2x || selectedPhoto.src.large
    }

    console.log('❌ No photos found')
    return null
  } catch (error) {
    console.error('Pexels error:', error)
    return null
  }
}

async function refreshVilniusImage() {
  console.log('🔄 Refreshing Vilnius image...\n')

  // Try multiple search terms
  const searchTerms = [
    'Vilnius cityscape skyline',
    'Vilnius old town architecture',
    'Vilnius cathedral square',
    'Vilnius aerial view city',
    'Vilnius Lithuania landmark'
  ]

  let imageUrl: string | null = null

  for (const term of searchTerms) {
    imageUrl = await fetchPexelsImage(term)
    if (imageUrl) {
      console.log(`\n✅ Success with search term: "${term}"`)
      break
    }
    console.log(`\n⚠️  No results for: "${term}"\n`)
  }

  if (!imageUrl) {
    console.log('❌ Failed to find any suitable image for Vilnius')
    return
  }

  // Update database
  console.log('\n💾 Updating database...')
  
  const { data, error } = await supabase
    .from('locations')
    .update({ 
      featured_image: imageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'vilnius')
    .select()

  if (error) {
    console.error('❌ Database error:', error)
    return
  }

  console.log('✅ Successfully updated Vilnius image!')
  console.log('\nUpdated location:', data)
}

refreshVilniusImage().catch(console.error)

