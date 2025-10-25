/**
 * API Route: Refetch & Repopulate Location Data
 * POST /api/admin/refetch-location
 * 
 * Admin-only endpoint to refetch location data using the new smart fallback system
 * - Fetches fresh images (Brave → Reddit → Backend Cache → User Uploads)
 * - Fetches restaurants, activities, description, weather
 * - Avoids duplications
 * - Repopulates the entire location
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/utils/adminCheck'
import {
  fetchLocationImageHighQuality,
  fetchLocationGalleryWithSmartFallback
} from '@/lib/services/enhancedImageService'
import { validateImageData } from '@/lib/services/imageValidationService'
import {
  enhanceActivitiesWithAttractions,
  getEnhancedDescription,
  getLocationMetadata
} from '@/lib/services/locationDataService'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin permissions
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { locationId, locationName } = await request.json()

    if (!locationId || !locationName) {
      return NextResponse.json(
        { success: false, error: 'Missing locationId or locationName' },
        { status: 400 }
      )
    }

    console.log(`🔄 [ADMIN] Refetching location: ${locationName} (${locationId})`)

    // Fetch location from database
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (fetchError || !location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Found location: ${location.name}`)

    // CRITICAL FIX: Auto-fix BAD slugs (overly long or missing country)
    // Examples:
    // - "marrakesh-pachalik-de-marrakech-marrakesh-prefecture-marrakech-safi-morocco" → "marrakesh-morocco"
    // - "lofthus" → "lofthus-norway"
    let updatedSlug = location.slug
    let needsSlugFix = false

    // Check 1: Overly long slug (> 3 parts = bad administrative hierarchy)
    const slugParts = location.slug.split('-')
    const isOverlyLong = slugParts.length > 3

    // Check 2: Missing country context (single word slug)
    const missingCountry = slugParts.length === 1 && location.country

    needsSlugFix = isOverlyLong || missingCountry

    if (needsSlugFix) {
      // Generate CLEAN slug: city name + country (if needed)
      const cityName = location.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const countryName = location.country.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      // List of ambiguous cities that need country context
      const ambiguousCities = ['paris', 'london', 'berlin', 'rome', 'athens', 'springfield', 'portland']
      const needsCountry = ambiguousCities.includes(cityName) || isOverlyLong || missingCountry

      const newSlug = needsCountry ? `${cityName}-${countryName}` : cityName

      console.log(`🔧 Auto-fixing slug:`)
      console.log(`   Old: "${location.slug}" (${slugParts.length} parts)`)
      console.log(`   New: "${newSlug}" (clean)`)

      // Check if new slug already exists
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', newSlug)
        .maybeSingle()

      if (!existingLocation || existingLocation.id === locationId) {
        // Update slug in database
        const { error: slugUpdateError } = await supabase
          .from('locations')
          .update({ slug: newSlug })
          .eq('id', locationId)

        if (!slugUpdateError) {
          console.log(`✅ Slug updated successfully!`)
          updatedSlug = newSlug
          location.slug = newSlug // Update local reference
        } else {
          console.error(`⚠️ Failed to update slug:`, slugUpdateError)
        }
      } else {
        console.log(`⚠️ Slug "${newSlug}" already exists (different location), keeping original`)
      }
    } else {
      console.log(`✅ Slug looks good: "${location.slug}"`)
    }

    // CRITICAL FIX: Construct CLEAN location query for image/data fetching
    // Use location name + region + country for accurate geocoding
    // CRITICAL: Must include region to disambiguate locations with same name
    // Example: "Lofthus Norway" → Oslo (wrong), "Lofthus, Vestland, Norway" → correct Lofthus
    const fullLocationQuery = location.region && location.country
      ? `${location.name}, ${location.region}, ${location.country}`
      : location.country
        ? `${location.name} ${location.country}`
        : location.name

    console.log(`🔍 Using full location query: "${fullLocationQuery}" (name: "${location.name}", region: "${location.region || 'N/A'}", country: "${location.country}")`)

    // CRITICAL: Re-geocode location to verify coordinates are correct
    // Legacy locations might have wrong coordinates (e.g., "Lofthus" in USA instead of Norway)
    console.log(`📍 Verifying location coordinates...`)
    const { geocodeLocation } = await import('@/lib/services/geocodingService')
    const geoData = await geocodeLocation(fullLocationQuery)

    let coordinatesUpdated = false
    if (geoData) {
      // Check if coordinates are significantly different (> 1 degree = ~111km)
      const latDiff = Math.abs(geoData.lat - (location.latitude || 0))
      const lngDiff = Math.abs(geoData.lng - (location.longitude || 0))

      if (latDiff > 1 || lngDiff > 1 || !location.latitude || !location.longitude) {
        console.log(`⚠️ Coordinates mismatch detected!`)
        console.log(`   Old: ${location.latitude}, ${location.longitude}`)
        console.log(`   New: ${geoData.lat}, ${geoData.lng}`)
        console.log(`   Updating to correct coordinates...`)

        // CRITICAL FIX: Clean region field - remove non-Latin characters
        const rawRegion = geoData.region || location.region
        const cleanRegion = rawRegion
          ? rawRegion.split(/[⵿-⵿]/)[0].trim()
                     .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
                     .replace(/[\u2D30-\u2D7F]/g, '')
                     .trim()
          : null

        if (rawRegion !== cleanRegion) {
          console.log(`🧹 Cleaned region: "${rawRegion}" → "${cleanRegion}"`)
        }

        // Update coordinates in database
        const { error: coordUpdateError } = await supabase
          .from('locations')
          .update({
            latitude: geoData.lat,
            longitude: geoData.lng,
            country: geoData.country || location.country,
            region: cleanRegion,
            city: geoData.city || location.city
          })
          .eq('id', locationId)

        if (!coordUpdateError) {
          console.log(`✅ Coordinates updated successfully!`)
          location.latitude = geoData.lat
          location.longitude = geoData.lng
          location.country = geoData.country || location.country
          location.region = cleanRegion || location.region
          coordinatesUpdated = true
        } else {
          console.error(`⚠️ Failed to update coordinates:`, coordUpdateError)
        }
      } else {
        console.log(`✅ Coordinates are correct (within 1 degree)`)
      }
    } else {
      console.warn(`⚠️ Could not geocode "${fullLocationQuery}", keeping existing coordinates`)
    }

    // Step 1: Refetch featured image with ENHANCED hierarchical fallback
    console.log(`🖼️ Refetching featured image with hierarchical fallback...`)
    console.log(`   Using: name="${location.name}", region="${location.region || 'N/A'}", country="${location.country}"`)
    let featuredImage = await fetchLocationImageHighQuality(
      location.name,  // CRITICAL: Pass ONLY location name, not fullLocationQuery
      undefined,
      location.region,
      location.country
      // Note: Additional data (district, county, continent) could be added here
      // if we extract it from location data or geocoding results
    )

    // Step 2: Refetch gallery images with smart fallback + hierarchical fallback
    console.log(`🖼️ Refetching gallery images with hierarchical fallback...`)
    console.log(`   Using: name="${location.name}", region="${location.region || 'N/A'}", country="${location.country}"`)
    let galleryImages = await fetchLocationGalleryWithSmartFallback(
      locationId,
      location.name,  // CRITICAL: Pass ONLY location name, not fullLocationQuery
      20,
      location.region,
      location.country
    )

    // Step 2.5: If no featured image but have gallery, use first gallery image
    if (!featuredImage && galleryImages.length > 0) {
      console.log(`📸 No featured image found, using first gallery image as featured`)
      featuredImage = galleryImages[0]
    }

    // Step 3: Validate images
    const validation = validateImageData({
      featured_image: featuredImage,
      gallery_images: galleryImages
    })

    console.log(`✅ Images validated: ${validation.gallery_images.length} images`)
    if (featuredImage) {
      console.log(`✅ Featured image: ${featuredImage.substring(0, 100)}...`)
    } else {
      console.warn(`⚠️ No featured image found!`)
    }

    // Step 4: Refetch restaurants
    console.log(`🍽️ Refetching restaurants...`)
    const { data: existingRestaurants } = await supabase
      .from('restaurants')
      .select('id')
      .eq('location_id', locationId)

    let restaurantsCount = existingRestaurants?.length || 0

    // Step 5: Refetch activities
    console.log(`🎯 Refetching activities...`)
    const { data: existingActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('location_id', locationId)

    let activitiesCount = existingActivities?.length || 0

    // Step 6: Refetch description
    console.log(`📖 Refetching description...`)
    let description = location.description
    try {
      // Use full location query for better description accuracy
      const enhancedDesc = await getEnhancedDescription(fullLocationQuery)
      if (enhancedDesc) {
        description = enhancedDesc
        console.log(`✅ Updated description`)
      }
    } catch (error) {
      console.error(`⚠️ Failed to fetch description:`, error)
    }

    // Step 7: Update location in database
    console.log(`💾 Updating location in database...`)
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        featured_image: validation.featured_image,
        gallery_images: validation.gallery_images,
        description: description,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)

    if (updateError) {
      console.error(`❌ Update error:`, updateError)
      return NextResponse.json(
        { success: false, error: `Failed to update location: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Step 8: ALWAYS invalidate cache after refetch (CRITICAL!)
    // Cache must be cleared even if slug didn't change, because images/data changed
    console.log(`🗑️ Invalidating cache for location...`)

    const { deleteCached, CacheKeys } = await import('@/lib/upstash')
    const { revalidatePath } = await import('next/cache')

    // Invalidate Upstash cache (FIRST - data source)
    await deleteCached(CacheKeys.location(location.slug))
    await deleteCached(`${CacheKeys.location(location.slug)}:related`)

    // If slug was updated, also invalidate old slug
    if (needsSlugFix && updatedSlug !== location.slug) {
      console.log(`🗑️ Also invalidating old slug cache...`)
      const oldSlug = locationName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      await deleteCached(CacheKeys.location(oldSlug))
      await deleteCached(`${CacheKeys.location(oldSlug)}:related`)

      // Invalidate Next.js cache for both old and new slugs
      revalidatePath(`/locations/${oldSlug}`)
      revalidatePath(`/locations/${updatedSlug}`)
    } else {
      // Invalidate Next.js cache for current slug
      revalidatePath(`/locations/${location.slug}`)
    }

    // Always invalidate locations list page
    revalidatePath('/locations')

    console.log(`✅ Cache invalidated!`)

    console.log(`✅ Location refetched and repopulated successfully!`)

    // Build detailed message
    let updateMessage = `Location "${locationName}" has been refetched and repopulated`
    if (needsSlugFix) updateMessage += ` (slug updated to "${updatedSlug}")`
    if (coordinatesUpdated) updateMessage += ` (coordinates corrected)`

    return NextResponse.json({
      success: true,
      message: updateMessage,
      results: {
        images: validation.gallery_images.length,
        restaurants: restaurantsCount,
        activities: activitiesCount,
        description: description ? 'Updated' : 'Unchanged',
        slugUpdated: needsSlugFix,
        newSlug: needsSlugFix ? updatedSlug : undefined,
        coordinatesUpdated: coordinatesUpdated
      }
    })

  } catch (error) {
    console.error(`❌ Error refetching location:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

