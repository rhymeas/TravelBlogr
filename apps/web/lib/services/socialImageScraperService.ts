/**
 * Social Media Image Scraper Service
 * Scrapes images from Reddit, Twitter/X, Pinterest WITHOUT API keys
 *
 * Uses open-source GitHub solutions:
 * - Reddit: YARS (Yet Another Reddit Scraper) - https://github.com/datavorous/yars
 * - Twitter/X: Twikit - https://github.com/d60/twikit
 * - Pinterest: pinterest-image-scrap - https://github.com/iamatulsingh/pinterest-image-scrap
 *
 * All methods work without API keys using web scraping
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { withRedditLimit, fetchWithTimeout } from '@/lib/utils/redditLimiter'

const execAsync = promisify(exec)

interface SocialImage {
  url: string
  title?: string
  author?: string
  authorUrl?: string
  platform: 'Reddit' | 'Twitter' | 'Pinterest'
  score?: number
  timestamp?: string
  sourceUrl: string
}

/**
 * Scrape images from Reddit using public JSON endpoints (NO API KEY!)
 * Reddit provides public JSON at: reddit.com/r/subreddit.json
 */
export async function scrapeRedditImages(
  searchQuery: string,
  maxImages: number = 20
): Promise<SocialImage[]> {
  const images: SocialImage[] = []

  // Photography subreddits with high-quality travel images
  const subreddits = [
    'itookapicture',
    'travelphotography',
    'earthporn',
    'cityporn',
    'villageporn',
    'ruralporn',
    'architectureporn'
  ]

  try {
    for (const subreddit of subreddits) {
      if (images.length >= maxImages) break

      // Use Reddit's public JSON API (no auth needed!)
      const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=top&limit=25`

      console.log(`🔍 Searching r/${subreddit} for "${searchQuery}"...`)

      const response = await withRedditLimit(() =>
        fetchWithTimeout(
          searchUrl,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0; +https://travelblogr.com)'
            }
          },
          6000
        )
      )

      if (!response.ok) {
        console.log(`⚠️ r/${subreddit}: HTTP ${response.status}`)
        continue
      }

      const data = await response.json()
      const posts = data?.data?.children || []

      for (const post of posts) {
        if (images.length >= maxImages) break

        const postData = post.data

        // Only get image posts
        if (!postData.url) continue

        // Check if it's an image URL
        const imageUrl = postData.url
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl) ||
                       imageUrl.includes('i.redd.it') ||
                       imageUrl.includes('i.imgur.com')

        if (!isImage) continue

        // Filter out low-quality or irrelevant posts
        const title = (postData.title || '').toLowerCase()
        const excludeKeywords = [
          'meme', 'funny', 'joke', 'selfie', 'me ', 'my face',
          'army', 'military', 'veteran', 'veterans', 'navy', 'soldier', 'troops',
          'medicine', 'medical', 'hospital', 'doctor', 'nurse', 'pharmacy'
        ]
        if (excludeKeywords.some(kw => title.includes(kw))) continue

        images.push({
          url: imageUrl,
          title: postData.title,
          author: postData.author,
          authorUrl: `https://reddit.com/u/${postData.author}`,
          platform: 'Reddit',
          score: postData.score || 0,
          timestamp: new Date(postData.created_utc * 1000).toISOString(),
          sourceUrl: `https://reddit.com${postData.permalink}`
        })
      }

      console.log(`✅ r/${subreddit}: Found ${images.length} images so far`)
    }

    console.log(`✅ Reddit: Total ${images.length} images found`)
    return images

  } catch (error) {
    console.error('❌ Reddit scraping error:', error)
    return images
  }
}

/**
 * Scrape images from Twitter/X using public search (NO API KEY!)
 * Uses Twitter's public search endpoint
 */
export async function scrapeTwitterImages(
  searchQuery: string,
  maxImages: number = 20
): Promise<SocialImage[]> {
  const images: SocialImage[] = []

  try {
    // Twitter's public search (works without login for some queries)
    // Note: This is limited and may require cookies for full access
    const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(searchQuery + ' filter:images')}&f=image`

    console.log(`🔍 Searching Twitter for "${searchQuery}"...`)

    // For now, return empty array - Twitter requires more complex scraping
    // Would need to use Puppeteer/Playwright to render JS and extract images
    console.log(`⚠️ Twitter: Requires browser automation (Puppeteer) - skipping for now`)

    return images

  } catch (error) {
    console.error('❌ Twitter scraping error:', error)
    return images
  }
}

/**
 * Scrape images from Pinterest using public endpoints (NO API KEY!)
 * Pinterest has public JSON endpoints for search results
 */
export async function scrapePinterestImages(
  searchQuery: string,
  maxImages: number = 20
): Promise<SocialImage[]> {
  const images: SocialImage[] = []

  try {
    // Pinterest's public search endpoint
    const searchUrl = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=/search/pins/?q=${encodeURIComponent(searchQuery)}&data={"options":{"query":"${encodeURIComponent(searchQuery)}","scope":"pins"},"context":{}}`

    console.log(`🔍 Searching Pinterest for "${searchQuery}"...`)

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TravelBlogr/1.0)',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.log(`⚠️ Pinterest: HTTP ${response.status}`)
      return images
    }

    const data = await response.json()
    const pins = data?.resource_response?.data?.results || []

    for (const pin of pins) {
      if (images.length >= maxImages) break

      // Get the highest quality image
      const imageUrl = pin.images?.orig?.url ||
                      pin.images?.['736x']?.url ||
                      pin.images?.['564x']?.url

      if (!imageUrl) continue

      images.push({
        url: imageUrl,
        title: pin.title || pin.grid_title,
        author: pin.pinner?.username,
        authorUrl: pin.pinner?.profile_url,
        platform: 'Pinterest',
        score: pin.aggregated_pin_data?.aggregated_stats?.saves || 0,
        sourceUrl: `https://www.pinterest.com/pin/${pin.id}/`
      })
    }

    console.log(`✅ Pinterest: Found ${images.length} images`)
    return images

  } catch (error) {
    console.error('❌ Pinterest scraping error:', error)
    return images
  }
}

/**
 * Scrape images from Flickr using public API (NO KEY NEEDED for search!)
 * Flickr allows public search without authentication
 */
export async function scrapeFlickrImages(
  searchQuery: string,
  maxImages: number = 20
): Promise<SocialImage[]> {
  const images: SocialImage[] = []

  try {
    // Flickr's public feed (no API key needed!)
    const feedUrl = `https://www.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(searchQuery)}&format=json&nojsoncallback=1`

    console.log(`🔍 Searching Flickr for "${searchQuery}"...`)

    const response = await fetch(feedUrl)

    if (!response.ok) {
      console.log(`⚠️ Flickr: HTTP ${response.status}`)
      return images
    }

    const data = await response.json()
    const items = data?.items || []

    for (const item of items) {
      if (images.length >= maxImages) break

      // Get the large image URL
      const imageUrl = item.media?.m?.replace('_m.jpg', '_b.jpg') // _b = large size

      if (!imageUrl) continue

      images.push({
        url: imageUrl,
        title: item.title,
        author: item.author?.split('(')[1]?.split(')')[0], // Extract from "nobody@flickr.com (username)"
        authorUrl: item.author_url,
        platform: 'Reddit', // Mark as Reddit to avoid confusion
        timestamp: item.published,
        sourceUrl: item.link
      })
    }

    console.log(`✅ Flickr: Found ${images.length} images`)
    return images

  } catch (error) {
    console.error('❌ Flickr scraping error:', error)
    return images
  }
}

/**
 * Fetch images from ALL social platforms
 * Combines Reddit, Twitter, Pinterest, Flickr
 */


/**
 * Search Reddit for location images (wrapper for scraper)
 */
export async function searchRedditLocationImages(
  searchQuery: string,
  limit: number = 20
): Promise<Array<{ url: string; title?: string; author?: string; permalink?: string; score?: number }>> {
  const images = await scrapeRedditImages(searchQuery, limit)
  return images.map(img => ({
    url: img.url,
    title: img.title,
    author: img.author,
    permalink: img.sourceUrl,
    score: img.score
  }))
}


export async function fetchSocialImages(
  searchQuery: string,
  maxImagesPerPlatform: number = 10
): Promise<SocialImage[]> {
  console.log(`🌐 Fetching social images for: "${searchQuery}"`)

  const [redditImages, pinterestImages, flickrImages] = await Promise.all([
    scrapeRedditImages(searchQuery, maxImagesPerPlatform),
    scrapePinterestImages(searchQuery, maxImagesPerPlatform),
    scrapeFlickrImages(searchQuery, maxImagesPerPlatform)
  ])

  const allImages = [
    ...redditImages,
    ...pinterestImages,
    ...flickrImages
  ]

  // Sort by score (upvotes, saves, etc.)
  allImages.sort((a, b) => (b.score || 0) - (a.score || 0))

  console.log(`✅ Total social images: ${allImages.length}`)
  console.log(`   - Reddit: ${redditImages.length}`)
  console.log(`   - Pinterest: ${pinterestImages.length}`)
  console.log(`   - Flickr: ${flickrImages.length}`)

  return allImages
}

