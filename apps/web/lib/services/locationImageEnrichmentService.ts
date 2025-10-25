/**
 * Location Image Enrichment Service
 * Auto-fetches and caches location images from Brave/Reddit when missing from database
 */

import { discoverLocationImages } from './imageDiscoveryService'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'
import { createServiceSupabase } from '@/lib/supabase-server'

interface LocationImageData {
  featured: string
  gallery: string[]
}

/**
 * Enrich location images - fetch from database, auto-fetch missing ones
 * @param locationNames - Array of location names
 * @returns Map of location name -> { featured, gallery }
 */
export async function enrichLocationImages(
  locationNames: string[]
): Promise<Record<string, LocationImageData>> {
  const supabase = createServiceSupabase()
  const enrichedImages: Record<string, LocationImageData> = {}

  console.log(`🖼️ Enriching images for ${locationNames.length} locations...`)

  // Step 1: Fetch from database
  const slugs = locationNames.map(name => slugify(name))
  const { data: locRows, error: locErr } = await supabase
    .from('locations')
    .select('name, slug, featured_image, gallery_images')
    .in('slug', slugs)

  const slugToName: Record<string, string> = {}
  locationNames.forEach(name => {
    slugToName[slugify(name)] = name
  })

  // Step 2: Process database results
  const missingLocations: string[] = []
  
  if (!locErr && locRows) {
    locRows.forEach((row: any) => {
      const locationName = slugToName[row.slug]
      const galleryArray = Array.isArray(row.gallery_images) ? row.gallery_images : []
      const featured = row.featured_image || (galleryArray.length > 0 ? galleryArray[0] : null)

      if (locationName) {
        if (featured) {
          enrichedImages[locationName] = {
            featured,
            gallery: galleryArray.length > 0 ? galleryArray : [featured]
          }
        } else {
          // No images in database - need to fetch
          missingLocations.push(locationName)
        }
      }
    })
  }

  // Add locations not found in database at all
  locationNames.forEach(name => {
    if (!enrichedImages[name] && !missingLocations.includes(name)) {
      missingLocations.push(name)
    }
  })

  console.log(`✅ Found ${Object.keys(enrichedImages).length} locations with images in database`)
  console.log(`🔍 Need to fetch images for ${missingLocations.length} locations`)

  // Step 3: Auto-fetch missing images from Brave/Reddit
  if (missingLocations.length > 0) {
    await Promise.all(
      missingLocations.map(async (locationName) => {
        try {
          // Use cache to avoid repeated API calls
          const cachedImages = await getOrSet(
            CacheKeys.imageDiscovery(locationName, 10),
            async () => {
              console.log(`🌐 Fetching images for "${locationName}" from Brave/Reddit...`)
              const images = await discoverLocationImages(locationName, undefined, 10)
              return images
            },
            CacheTTL.LONG // 24 hours
          )

          if (cachedImages && cachedImages.length > 0) {
            enrichedImages[locationName] = {
              featured: cachedImages[0].url,
              gallery: cachedImages.slice(0, 10).map(img => img.url)
            }
            console.log(`✅ Auto-fetched ${cachedImages.length} images for "${locationName}"`)

            // Optionally: Save to database for future use (background task)
            saveImagesToDatabase(locationName, cachedImages[0].url, cachedImages.slice(0, 10).map(img => img.url))
          } else {
            console.log(`⚠️ No images found for "${locationName}"`)
          }
        } catch (error) {
          console.error(`❌ Error fetching images for "${locationName}":`, error)
        }
      })
    )
  }

  console.log(`🎉 Enrichment complete: ${Object.keys(enrichedImages).length}/${locationNames.length} locations have images`)

  return enrichedImages
}

/**
 * Save images to database (background task, don't await)
 */
async function saveImagesToDatabase(
  locationName: string,
  featuredImage: string,
  galleryImages: string[]
) {
  try {
    const supabase = createServiceSupabase()
    const slug = slugify(locationName)

    // Check if location exists
    const { data: existing } = await supabase
      .from('locations')
      .select('id, featured_image, gallery_images')
      .eq('slug', slug)
      .single()

    if (existing) {
      // Update only if no images exist
      if (!existing.featured_image && (!existing.gallery_images || existing.gallery_images.length === 0)) {
        await supabase
          .from('locations')
          .update({
            featured_image: featuredImage,
            gallery_images: galleryImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        console.log(`💾 Saved images to database for "${locationName}"`)
      }
    }
  } catch (error) {
    console.error(`❌ Error saving images to database for "${locationName}":`, error)
  }
}

/**
 * Slugify location name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Get single location images (for location pages)
 */
export async function getLocationImagesEnriched(
  locationSlug: string
): Promise<LocationImageData | null> {
  const supabase = createServiceSupabase()

  // Step 1: Try database
  const { data: location, error } = await supabase
    .from('locations')
    .select('name, slug, featured_image, gallery_images')
    .eq('slug', locationSlug)
    .single()

  if (error || !location) {
    console.error('Location not found:', locationSlug)
    return null
  }

  const galleryArray = Array.isArray(location.gallery_images) ? location.gallery_images : []
  const featured = location.featured_image || (galleryArray.length > 0 ? galleryArray[0] : null)

  // Step 2: If no images, auto-fetch
  if (!featured) {
    console.log(`🔍 No images in database for "${location.name}", auto-fetching...`)
    
    const images = await discoverLocationImages(location.name, undefined, 10)
    
    if (images && images.length > 0) {
      const enrichedData = {
        featured: images[0].url,
        gallery: images.slice(0, 10).map(img => img.url)
      }

      // Save to database (background)
      saveImagesToDatabase(location.name, enrichedData.featured, enrichedData.gallery)

      return enrichedData
    }

    return null
  }

  return {
    featured,
    gallery: galleryArray.length > 0 ? galleryArray : [featured]
  }
}

