import { NextRequest, NextResponse } from 'next/server'
import { searchImages as braveSearchImages } from '@/lib/services/braveSearchService'

interface RedditImage {
  url: string
  title: string
  subreddit: string
  score: number
  permalink: string
}

interface BraveImage {
  url: string
  thumbnail: string
  title: string
  source: string
}

interface FlickrImage {
  url: string
  title: string
  author: string
  link: string
  tags: string
}

interface LegacyImage {
  url: string
  source: string
  title: string
}

/**
 * ULTRA-FILTERED REDDIT METHOD: Only city, architecture, location, environment images
 * Uses STRICT filtering to ensure ONLY landscape/cityscape/architecture photos
 */
async function fetchRedditImagesSmart(locationName: string, count: number = 20): Promise<RedditImage[]> {
  const images: RedditImage[] = []

  try {
    console.log(`Testing Reddit images for "${locationName}" using ULTRA-FILTERED method`)

    // STRATEGY: Search travel photography subreddits with location name
    // This is MORE PRECISE than searching for location-specific subreddits
    const travelSubreddits = [
      'CityPorn',        // Urban landscapes
      'EarthPorn',       // Natural landscapes
      'ArchitecturePorn', // Buildings
      'VillagePorn',     // Small towns
      'TravelPics',      // Travel photography
      'travel',          // General travel
      'itookapicture',   // Photography
      'pics'             // General high-quality photos
    ]

    console.log(`Searching ${travelSubreddits.length} travel subreddits for "${locationName}"`)

    // Search each subreddit for the location name
    for (const subreddit of travelSubreddits) {
      if (images.length >= count) break

      // Search within subreddit for location name
      const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(locationName)}&restrict_sr=1&sort=top&t=all&limit=50`

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0; +https://travelblogr.com)'
        }
      })

      if (!response.ok) {
        console.log(`Failed to search r/${subreddit}:`, response.status)
        continue
      }

      const data = await response.json()
      const posts = data.data?.children || []

      console.log(`r/${subreddit}: Found ${posts.length} posts for "${locationName}"`)

      // ULTRA-STRICT FILTERING
      const validPosts = posts.filter((post: any) => {
        const p = post.data
        const title = (p.title || '').toLowerCase()
        const url = (p.url || '').toLowerCase()

        // 1. MUST be an image
        const isImage = p.post_hint === 'image' ||
                       p.is_gallery ||
                       url.match(/\.(jpg|jpeg|png|webp)$/i)
        if (!isImage) return false

        // 2. REJECT: People, faces, selfies, portraits
        const rejectPeople = [
          'selfie', 'portrait', 'me ', 'my ', 'i ', 'myself',
          'face', 'person', 'people', 'crowd', 'tourist',
          'wedding', 'bride', 'groom', 'couple', 'family',
          'cosplay', 'costume', 'outfit', 'wearing'
        ]
        if (rejectPeople.some(kw => title.includes(kw))) return false

        // 3. REJECT: Food, restaurants, meals
        const rejectFood = [
          'food', 'meal', 'dish', 'restaurant', 'cafe', 'coffee',
          'breakfast', 'lunch', 'dinner', 'dessert', 'pizza',
          'burger', 'sushi', 'ramen', 'cuisine', 'recipe',
          'cooking', 'ate', 'eating', 'delicious', 'tasty'
        ]
        if (rejectFood.some(kw => title.includes(kw))) return false

        // 4. REJECT: Art, drawings, renders, digital content
        const rejectArt = [
          'drawing', 'painting', 'art', 'sketch', 'illustration',
          'render', 'rendered', '3d', 'digital', 'photoshop',
          'edited', 'composite', 'manipulation', 'ai generated',
          'midjourney', 'dalle', 'stable diffusion', 'anime', 'manga',
          'cartoon', 'comic', 'meme', 'funny', 'lol'
        ]
        if (rejectArt.some(kw => title.includes(kw))) return false

        // 5. REJECT: Animals, pets, wildlife (unless landscape context)
        const rejectAnimals = [
          'dog', 'cat', 'pet', 'puppy', 'kitten', 'bird',
          'animal', 'wildlife', 'zoo', 'aquarium', 'fish'
        ]
        if (rejectAnimals.some(kw => title.includes(kw))) return false

        // 6. REJECT: Indoor, interiors, museums
        const rejectIndoor = [
          'museum', 'gallery', 'exhibition', 'interior', 'inside',
          'room', 'bedroom', 'bathroom', 'kitchen', 'office',
          'hotel room', 'apartment', 'sleek'
        ]
        if (rejectIndoor.some(kw => title.includes(kw))) return false

        // 7. REJECT: Screenshots, graphs, maps, diagrams
        const rejectDigital = [
          'screenshot', 'graph', 'chart', 'map', 'diagram',
          'infographic', 'data', 'statistics', 'guide'
        ]
        if (rejectDigital.some(kw => title.includes(kw))) return false

        // 8. REJECT: Questions, discussions, text posts
        const rejectText = [
          'question', 'help', 'advice', 'recommend', 'suggestion',
          'what', 'where', 'how', 'why', 'when', 'should i',
          'anyone know', 'does anyone', 'can someone'
        ]
        if (rejectText.some(kw => title.includes(kw))) return false

        // 9. POSITIVE SIGNALS: Prefer these keywords (optional boost)
        const preferKeywords = [
          'view', 'skyline', 'cityscape', 'landscape', 'architecture',
          'building', 'street', 'downtown', 'city', 'town',
          'sunset', 'sunrise', 'night', 'evening', 'morning',
          'aerial', 'panorama', 'vista', 'scenery', 'beautiful'
        ]
        const hasPositiveSignal = preferKeywords.some(kw => title.includes(kw))

        // 10. Score-based filtering: Prefer higher scores
        const hasGoodScore = p.score >= 50

        // Pass if has positive signal OR good score
        return hasPositiveSignal || hasGoodScore
      })

      console.log(`r/${subreddit}: Filtered to ${validPosts.length} valid environment images`)

      // Add valid images
      for (const post of validPosts) {
        if (images.length >= count) break

        const p = post.data
        const imageUrl = p.url || p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&')

        if (imageUrl) {
          images.push({
            url: imageUrl,
            title: p.title,
            subreddit: p.subreddit,
            score: p.score,
            permalink: `https://reddit.com${p.permalink}`
          })
        }
      }
    }

    // Sort by score (highest first)
    images.sort((a, b) => b.score - a.score)

    console.log(`✅ Found ${images.length} ULTRA-FILTERED Reddit images`)
    return images.slice(0, count)

  } catch (error) {
    console.error('❌ Ultra-filtered Reddit method error:', error)
    return []
  }
}

/**
 * CURRENT METHOD: Search specific travel subreddits
 */
async function fetchRedditImagesCurrent(locationName: string, count: number = 10): Promise<RedditImage[]> {
  const images: RedditImage[] = []

  const subreddits = [
    'itookapicture',
    'travelphotography',
    'earthporn',
    'cityporn',
    'villageporn',
    'architectureporn'
  ]

  try {
    for (const subreddit of subreddits) {
      if (images.length >= count) break

      const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(locationName)}&restrict_sr=1&sort=top&limit=25`

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0; +https://travelblogr.com)'
        }
      })

      if (!response.ok) continue

      const data = await response.json()
      const posts = data?.data?.children || []

      for (const post of posts) {
        if (images.length >= count) break

        const postData = post.data
        const imageUrl = postData.url

        // Only accept direct image URLs
        if (!imageUrl || !imageUrl.match(/\.(jpg|jpeg|png|webp)$/i)) continue

        // Filter out low-quality or irrelevant images
        const title = (postData.title || '').toLowerCase()
        const excludeKeywords = ['meme', 'comic', 'cartoon', 'drawing', 'painting', 'art', 'render', '3d']
        if (excludeKeywords.some(kw => title.includes(kw))) continue

        images.push({
          url: imageUrl,
          title: postData.title,
          subreddit: postData.subreddit,
          score: postData.score,
          permalink: `https://reddit.com${postData.permalink}`
        })
      }
    }

    return images

  } catch (error) {
    console.error('❌ Reddit current method error:', error)
    return []
  }
}



/**
 * LEGACY METHOD: Enhanced Image Service (Pexels, Unsplash, Wikimedia, etc.)
 * This is the current production image fetcher used in /plan
 */
async function fetchLegacyImages(locationName: string, count: number = 20): Promise<LegacyImage[]> {
  const images: LegacyImage[] = []

  try {
    // Import the enhanced image service
    const { fetchLocationGalleryHighQuality } = await import('@/lib/services/enhancedImageService')

    console.log(`Fetching legacy images for "${locationName}"`)

    const imageUrls = await fetchLocationGalleryHighQuality(locationName, count)

    console.log(`Found ${imageUrls.length} legacy images for "${locationName}"`)

    for (const url of imageUrls) {
      images.push({
        url,
        source: 'Legacy Service',
        title: `${locationName} - Enhanced Image Service`
      })
    }

    return images

  } catch (error) {
    console.error('❌ Legacy method error:', error)
    return []
  }
}

/**
 * FLICKR ULTRA-FILTERED METHOD: ONLY city, architecture, location, environment images
 * Uses same strict filtering as Reddit ULTRA method
 */
async function fetchFlickrImages(locationName: string, count: number = 20): Promise<FlickrImage[]> {
  const images: FlickrImage[] = []

  try {
    console.log(`Fetching Flickr images for "${locationName}" with ULTRA-FILTERING`)

    // Flickr public feed - NO API KEY REQUIRED!
    const searchUrl = `https://api.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(locationName)}&format=json&nojsoncallback=1`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0; +https://travelblogr.com)'
      }
    })

    if (!response.ok) {
      console.error('Flickr API error:', response.status)
      return []
    }

    const data = await response.json()
    const items = data?.items || []

    console.log(`Found ${items.length} Flickr photos for "${locationName}"`)

    // ULTRA-STRICT FILTERING (same as Reddit ULTRA)
    for (const item of items) {
      if (images.length >= count) break

      // Get image URL (use larger size if available)
      const imageUrl = item.media?.m
      if (!imageUrl) continue

      // Replace _m.jpg with _b.jpg for larger size
      const largerUrl = imageUrl.replace('_m.jpg', '_b.jpg').replace('_m.png', '_b.png')

      const title = (item.title || '').toLowerCase()
      const tags = (item.tags || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      const combined = `${title} ${tags} ${description}`

      // LIGHTER FILTERING for Flickr (only reject obvious bad content)
      // Flickr tags are usually good, so we don't need to be as strict as Reddit

      // 1. REJECT: People portraits (but allow cityscapes with people in background)
      const rejectPeople = ['selfie', 'portrait', 'face', 'wedding', 'bride', 'groom']
      if (rejectPeople.some(kw => combined.includes(kw))) continue

      // 2. REJECT: Food close-ups
      const rejectFood = ['food', 'meal', 'dish', 'pizza', 'burger', 'sushi', 'recipe', 'cooking']
      if (rejectFood.some(kw => combined.includes(kw))) continue

      // 3. REJECT: Art/digital content
      const rejectArt = ['drawing', 'painting', 'sketch', 'render', '3d', 'digital art', 'anime', 'cartoon', 'meme']
      if (rejectArt.some(kw => combined.includes(kw))) continue

      // If passed basic filters, include the image
      images.push({
        url: largerUrl,
        title: item.title || 'Untitled',
        author: item.author || 'Unknown',
        link: item.link || '',
        tags: item.tags || ''
      })
    }

    console.log(`✅ Filtered to ${images.length} ULTRA-FILTERED Flickr images`)

    return images

  } catch (error) {
    console.error('❌ Flickr method error:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const location = searchParams.get('location') || 'Tokyo'
  const method = searchParams.get('method') || 'current'

  console.log(`Testing images for "${location}" using ${method} method`)

  // Handle Brave API method (replaces current method)
  if (method === 'brave') {
    try {
      const braveResults = await braveSearchImages(location, 20)
      const braveImages: BraveImage[] = braveResults.map((img: any) => ({
        url: img.url,
        thumbnail: img.thumbnail || img.url,
        title: img.title || location,
        source: 'Brave Search API'
      }))
      return NextResponse.json({
        location,
        method,
        count: braveImages.length,
        images: braveImages
      })
    } catch (error) {
      console.error('Brave API error:', error)
      return NextResponse.json({
        location,
        method,
        count: 0,
        images: [],
        error: 'Brave API failed'
      })
    }
  }

  if (method === 'flickr') {
    const flickrImages = await fetchFlickrImages(location, 20)
    return NextResponse.json({
      location,
      method,
      count: flickrImages.length,
      images: flickrImages
    })
  }

  if (method === 'legacy') {
    const legacyImages = await fetchLegacyImages(location, 20)
    return NextResponse.json({
      location,
      method,
      count: legacyImages.length,
      images: legacyImages
    })
  }

  // Reddit methods
  let images: RedditImage[] = []

  if (method === 'current') {
    images = await fetchRedditImagesCurrent(location, 10)
  } else if (method === 'smart') {
    images = await fetchRedditImagesSmart(location, 20)
  }

  return NextResponse.json({
    location,
    method,
    count: images.length,
    images
  })
}

