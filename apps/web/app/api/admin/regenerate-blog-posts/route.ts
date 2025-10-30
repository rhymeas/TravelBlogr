import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { searchImages as braveSearchImages } from '@/lib/services/braveSearchService'
import { fetchRedditImages as fetchRedditUltraImages } from '@/lib/services/enhancedImageService'
import { fetchActivityData } from '@/lib/services/braveActivityService'
import { getLocationIntelligence } from '@/lib/services/locationIntelligenceService'

/**
 * POST /api/admin/regenerate-blog-posts
 * 
 * Regenerate all blog posts with:
 * - Brave API + Reddit ULTRA images
 * - POI suggestions and links
 * - Activity/restaurant images
 * 
 * Query params:
 * - dryRun: boolean (default: false)
 * - limit: number (default: all)
 * - forceImages: boolean (default: false) - regenerate even if images exist
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dryRun = searchParams.get('dryRun') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const forceImages = searchParams.get('forceImages') === 'true'

    console.log('🚀 Blog Post Regeneration API')
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
    console.log(`Limit: ${limit || 'ALL'}`)
    console.log(`Force Images: ${forceImages}`)

    const supabase = await createServerSupabase()

    // Fetch blog posts
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: posts, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: 'No blog posts found', count: 0 })
    }

    console.log(`📊 Found ${posts.length} blog posts`)

    const results = []

    // Process each post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      console.log(`\n[${i + 1}/${posts.length}] Processing: ${post.title}`)

      try {
        const result = await regenerateBlogPost(post, { dryRun, forceImages })
        results.push(result)
      } catch (error: any) {
        console.error(`Error processing post ${post.id}:`, error)
        results.push({
          id: post.id,
          title: post.title,
          success: false,
          error: error.message
        })
      }

      // Rate limiting - wait 1 second between posts
      if (i < posts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: 'Regeneration complete',
      mode: dryRun ? 'dry-run' : 'live',
      total: posts.length,
      success: successCount,
      failed: failureCount,
      results
    })
  } catch (error: any) {
    console.error('Fatal error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Extract destination from blog post
 */
function extractDestination(post: any): string | null {
  // Try content.destination
  if (post.content?.destination) {
    return post.content.destination
  }

  // Try tags
  if (post.tags && post.tags.length > 0) {
    return post.tags[0]
  }

  // Try title
  const titleMatch = post.title.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
  if (titleMatch) {
    return titleMatch[1]
  }

  return null
}

/**
 * Fetch featured image from Brave + Reddit ULTRA
 *
 * 🎯 NOTE: Uses simple query (not optimized strategy)
 * For better results with POI/activity images, consider using:
 * - fetchActivityData() from braveActivityService
 * - Optimized query strategy from docs/BRAVE_QUERY_FINAL_STRATEGY.md
 *
 * ⚠️ IMPORTANT: Always use `thumbnail` property from Brave results!
 * See docs/BRAVE_API_IMAGE_AUDIT.md
 */
async function fetchFeaturedImage(query: string): Promise<string | null> {
  try {
    console.log(`  🔍 Searching images for: "${query}"`)

    // Priority #1: Brave API (simple query)
    // TODO: Consider using optimized query strategy for better results
    const braveImages = await braveSearchImages(query, 5)
    if (braveImages.length > 0) {
      console.log(`  ✅ Found ${braveImages.length} Brave images`)
      // ✅ Use thumbnail (Brave CDN URL) not url (source page URL)
      return braveImages[0].thumbnail || braveImages[0].url
    }

    // Priority #2: Reddit ULTRA
    const redditImages = await fetchRedditUltraImages(query, 5)
    if (redditImages.length > 0) {
      console.log(`  ✅ Found ${redditImages.length} Reddit ULTRA images`)
      return redditImages[0]
    }

    console.log(`  ⚠️ No images found`)
    return null
  } catch (error) {
    console.error(`  ❌ Error fetching featured image:`, error)
    return null
  }
}

/**
 * Fetch gallery images from Brave + Reddit ULTRA
 *
 * 🎯 NOTE: Uses simple query (not optimized strategy)
 * See fetchFeaturedImage() comments for optimization suggestions
 *
 * ⚠️ IMPORTANT: Always use `thumbnail` property from Brave results!
 */
async function fetchGalleryImages(query: string, count: number = 10): Promise<string[]> {
  try {
    const allImages: string[] = []

    // Brave API (50% of images)
    const braveImages = await braveSearchImages(query, Math.ceil(count * 0.5))
    // ✅ Use thumbnail (Brave CDN URL) not url (source page URL)
    allImages.push(...braveImages.map(img => img.thumbnail || img.url))

    // Reddit ULTRA (30% of images)
    const redditImages = await fetchRedditUltraImages(query, Math.ceil(count * 0.3))
    allImages.push(...redditImages)

    console.log(`  ✅ Found ${allImages.length} gallery images`)
    return allImages.slice(0, count)
  } catch (error) {
    console.error(`  ❌ Error fetching gallery images:`, error)
    return []
  }
}

/**
 * Enhance blog post content with POIs and links
 */
async function enhanceContent(post: any, destination: string): Promise<any> {
  try {
    console.log(`  🎯 Enhancing content for: ${destination}`)

    const content = post.content || {}

    // Fetch POIs
    let pois: any[] = []
    if (destination) {
      try {
        const intel = await getLocationIntelligence(destination, true)
        pois = intel.pois.slice(0, 10)
        console.log(`  ✅ Found ${pois.length} POIs`)
      } catch (error) {
        console.log(`  ⚠️ Could not fetch POIs`)
      }
    }

    // Enhance days with activity images
    if (content.days && Array.isArray(content.days)) {
      for (const day of content.days) {
        if (day.activities && Array.isArray(day.activities)) {
          for (let i = 0; i < day.activities.length; i++) {
            const activity = day.activities[i]
            if (typeof activity === 'string') {
              try {
                const activityData = await fetchActivityData(activity, destination, 1)
                if (activityData.images.length > 0) {
                  day.activities[i] = {
                    name: activity,
                    image: activityData.images[0].url,
                    links: activityData.links
                  }
                  console.log(`    ✅ Enhanced activity: ${activity}`)
                }
              } catch (error) {
                // Keep as string if fetch fails
              }
            }
          }
        }
      }
    }

    // Add POIs to content
    if (pois.length > 0) {
      content.pois = pois.map(poi => ({
        name: poi.name,
        description: poi.description,
        category: poi.category,
        coordinates: poi.coordinates
      }))
    }

    return content
  } catch (error) {
    console.error(`  ❌ Error enhancing content:`, error)
    return post.content
  }
}

/**
 * Regenerate a single blog post
 */
async function regenerateBlogPost(
  post: any,
  options: { dryRun: boolean; forceImages: boolean }
): Promise<any> {
  const destination = extractDestination(post)
  if (!destination) {
    console.log(`  ⚠️ Could not extract destination - skipping`)
    return {
      id: post.id,
      title: post.title,
      success: false,
      skipped: true,
      reason: 'No destination found'
    }
  }

  console.log(`  📍 Destination: ${destination}`)

  // Fetch featured image
  let featuredImage = post.featured_image
  if (!featuredImage || options.forceImages) {
    featuredImage = await fetchFeaturedImage(`${destination} travel ${post.title}`)
  }

  // Fetch gallery images
  const galleryImages = await fetchGalleryImages(destination, 10)

  // Enhance content
  const enhancedContent = await enhanceContent(post, destination)

  // Update blog post
  if (!options.dryRun) {
    const supabase = await createServerSupabase()
    const { error } = await supabase
      .from('blog_posts')
      .update({
        featured_image: featuredImage,
        gallery_images: galleryImages,
        content: enhancedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id)

    if (error) {
      console.error(`  ❌ Error updating post:`, error)
      return {
        id: post.id,
        title: post.title,
        success: false,
        error: error.message
      }
    }

    console.log(`  ✅ Updated successfully!`)
  } else {
    console.log(`  🔍 DRY RUN - Would update`)
  }

  return {
    id: post.id,
    title: post.title,
    success: true,
    destination,
    featuredImage: !!featuredImage,
    galleryImagesCount: galleryImages.length,
    poisCount: enhancedContent.pois?.length || 0
  }
}

