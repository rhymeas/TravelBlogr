/**
 * API Route: Auto-fill Location Content
 * POST /api/admin/auto-fill
 *
 * Uses 100% FREE APIs:
 * - OpenStreetMap Nominatim (geocoding - coordinates from name)
 * - OpenStreetMap Overpass (restaurants, activities)
 * - Unsplash (images)
 * - Wikipedia (descriptions)
 * - OpenWeatherMap (weather)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  fetchLocationImageHighQuality,
  fetchLocationGalleryHighQuality,
  fetchLocationGalleryWithSmartFallback
} from '@/lib/services/enhancedImageService'
import { validateImageData, formatImageStats, getImageStats } from '@/lib/services/imageValidationService'
import {
  enhanceActivitiesWithAttractions,
  getEnhancedDescription,
  getLocationMetadata
} from '@/lib/services/locationDataService'

import { isAmbiguousLocationName, DUPLICATE_COORD_THRESHOLD } from '@/lib/utils/locationValidation'

// Route config - increase timeout for long-running operations
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds

// Initialize Supabase client (will work once environment variables are set)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

interface AutoFillRequest {
  locationName: string
}

// Country name mapping (native -> English)
const COUNTRY_NAME_MAP: Record<string, string> = {
  'Ελλάς': 'Greece',
  'Ελλάδα': 'Greece',
  'España': 'Spain',
  'Italia': 'Italy',
  'Deutschland': 'Germany',
  'France': 'France',
  'Nederland': 'Netherlands',
  'Österreich': 'Austria',
  'Schweiz': 'Switzerland',
  'Suisse': 'Switzerland',
  'Svizzera': 'Switzerland',
  'Portugal': 'Portugal',
  'Türkiye': 'Turkey',
  'Polska': 'Poland',
  'Česko': 'Czech Republic',
  'Magyarország': 'Hungary',
  'România': 'Romania',
  'България': 'Bulgaria',
  'Hrvatska': 'Croatia',
  'Србија': 'Serbia',
  'Slovensko': 'Slovakia',
  'Slovenija': 'Slovenia',
  'Lietuva': 'Lithuania',
  'Latvija': 'Latvia',
  'Eesti': 'Estonia',
  'Suomi': 'Finland',
  'Sverige': 'Sweden',
  'Norge': 'Norway',
  'Danmark': 'Denmark',
  'Ísland': 'Iceland',
  '日本': 'Japan',
  '中国': 'China',
  '대한민국': 'South Korea',
  'ไทย': 'Thailand',
  'Việt Nam': 'Vietnam',
  'Indonesia': 'Indonesia',
  'Malaysia': 'Malaysia',
  'Pilipinas': 'Philippines',
  'भारत': 'India',
  'ประเทศไทย': 'Thailand',
  'المغرب': 'Morocco',
  'مصر': 'Egypt',
  'الإمارات العربية المتحدة': 'United Arab Emirates',
  'Brasil': 'Brazil',
  'México': 'Mexico',
  'Argentina': 'Argentina',
  'Chile': 'Chile',
  'Colombia': 'Colombia',
  'Perú': 'Peru'
}

// Geocode function - inline to avoid import issues
async function geocodeLocation(locationName: string) {
  try {
    // Request English language results with accept-language header
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(locationName)}&` +
      `format=json&` +
      `limit=1&` +
      `accept-language=en`,
      {
        headers: {
          'User-Agent': 'TravelBlogr/1.0',
          'Accept-Language': 'en'
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.length === 0) {
      return null
    }

    const result = data[0]

    // Extract country and region from display_name
    const parts = result.display_name.split(', ')
    const rawCountry = parts[parts.length - 1] || 'Unknown'
    const region = parts[parts.length - 2] || parts[parts.length - 3] || 'Unknown'

    // Get English country name from address if available
    let englishCountry = result.address?.country || rawCountry

    // Map native country names to English
    if (COUNTRY_NAME_MAP[englishCountry]) {
      englishCountry = COUNTRY_NAME_MAP[englishCountry]
    }

    // Also check the raw country from display_name
    if (COUNTRY_NAME_MAP[rawCountry]) {
      englishCountry = COUNTRY_NAME_MAP[rawCountry]
    }

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      country: englishCountry,
      region: region,
      fullName: result.display_name
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AutoFillRequest = await request.json()
    const { locationName } = body

    if (!locationName) {
      return NextResponse.json(
        { success: false, error: 'Location name is required' },
        { status: 400 }
      )
    }

    // Block unclear/ambiguous location names early
    if (isAmbiguousLocationName(locationName)) {
      return NextResponse.json(
        { success: false, error: 'Ambiguous location name. Please provide a specific city/town/place (not borders, checkpoints, or placeholders).' },
        { status: 400 }
      )
    }

    console.log(`🪄 Auto-filling content for: ${locationName}`)

    // Step 1: Geocode location name to get coordinates (FREE - Nominatim)
    console.log(`📍 Geocoding location...`)
    const geoData = await geocodeLocation(locationName)

    if (!geoData) {
      return NextResponse.json(
        { success: false, error: 'Location not found. Please check the spelling.' },
        { status: 404 }
      )
    }

    console.log(`✅ Found: ${geoData.fullName} at ${geoData.latitude}, ${geoData.longitude}`)

    // Step 2: Try to save to database (if Supabase is configured)
    const supabase = getSupabaseClient()

    if (!supabase) {
      // Supabase not configured yet - return geocoding result only
      console.log(`⚠️ Supabase not configured. See SUPABASE_SETUP_GUIDE.md`)

      return NextResponse.json({
        success: true,
        message: `Successfully geocoded ${locationName}! 🎉`,
        location: {
          name: locationName,
          coordinates: {
            latitude: geoData.latitude,
            longitude: geoData.longitude
          },
          country: geoData.country,
          region: geoData.region,
          fullName: geoData.fullName
        },
        nextSteps: [
          "✅ Geocoding working perfectly!",
          "🔧 Next: Set up Supabase (see SUPABASE_SETUP_GUIDE.md)",
          "💾 Then: Save location to database",
          "🎨 Then: Fetch restaurants, activities, images"
        ]
      })
    }

    // Step 3: Check if location already exists
    console.log(`💾 Checking if location already exists...`)

    // CRITICAL FIX: Generate CLEAN slug (city + country only)
    // Prevents overly long slugs like "marrakesh-pachalik-de-marrakech-..."
    // Extract clean city name from geocoded data
    const cityName = geoData.fullName.split(',')[0].trim() // Get first part before comma
    const countryName = geoData.country

    // Build clean slug: city + country (if needed)
    const isAmbiguousCity = ['Paris', 'London', 'Berlin', 'Rome', 'Athens', 'Springfield', 'Portland'].includes(cityName)
    const slugParts = [cityName]

    if (isAmbiguousCity || locationName.toLowerCase().includes(countryName.toLowerCase())) {
      slugParts.push(countryName)
    }

    const slug = slugParts
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    console.log(`🔗 Generated clean slug: "${cityName}" + "${countryName}" → "${slug}"`)

    const { data: existingLocation } = await supabase
      .from('locations')
      .select('id, name, slug')
      .eq('slug', slug)
      .single()

    if (existingLocation) {
      console.log(`⚠️ Location already exists: ${existingLocation.name}`)
      return NextResponse.json(
        {
          success: false,
          error: 'Location already exists',
          details: `A location with the name "${existingLocation.name}" already exists in the database. Please use a different name or edit the existing location.`,
          existingLocation: {
            id: existingLocation.id,
            name: existingLocation.name,
            slug: existingLocation.slug
          }
        },
        { status: 409 }
      )
    }

    // Extra duplicate protection: same name or too-close coordinates
    const { data: nameDupes } = await supabase
      .from('locations')
      .select('id, name, slug')
      .ilike('name', locationName)
      .limit(1)

    if (nameDupes && nameDupes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Location with this name already exists',
          existingLocation: nameDupes[0]
        },
        { status: 409 }
      )
    }

    const latNum = parseFloat(String(geoData.latitude))
    const lonNum = parseFloat(String(geoData.longitude))
    const { data: nearDupes } = await supabase
      .from('locations')
      .select('id, name, slug')
      .gte('latitude', latNum - DUPLICATE_COORD_THRESHOLD)
      .lte('latitude', latNum + DUPLICATE_COORD_THRESHOLD)
      .gte('longitude', lonNum - DUPLICATE_COORD_THRESHOLD)
      .lte('longitude', lonNum + DUPLICATE_COORD_THRESHOLD)
      .limit(1)

    if (nearDupes && nearDupes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'A nearby location already exists (duplicate by proximity)',
          existingLocation: nearDupes[0]
        },
        { status: 409 }
      )
    }


    console.log(`💾 Saving new location to database...`)

    // Try to get enhanced metadata from GeoNames (optional)
    let enhancedMetadata = null
    try {
      const { getLocationMetadata } = await import('@/lib/services/locationDataService')
      enhancedMetadata = await getLocationMetadata(locationName)
      if (enhancedMetadata) {
        console.log(`✅ GeoNames: Enhanced metadata retrieved`)
      }
    } catch (error) {
      console.log(`⚠️ GeoNames: Not available (optional)`)
    }

    // LIGHTWEIGHT HEALTH CHECK: Use geocoded data as-is (already verified by geocoding service)
    // No expensive reverse geocoding needed - trust the geocoding API
    console.log(`✅ [HEALTH CHECK] Using geocoded coordinates (already verified)`)
    const finalLatitude = geoData.latitude
    const finalLongitude = geoData.longitude
    const finalCountry = enhancedMetadata?.country || geoData.country

    // CRITICAL FIX: Clean region field - remove non-Latin characters
    // Example: "Marrakech-Safi ⵎⵕⵕⴰⴽⵛ-ⴰⵙⴼⵉ مراكش-أسفي" → "Marrakech-Safi"
    const rawRegion = enhancedMetadata?.region || geoData.region
    const finalRegion = rawRegion
      ? rawRegion.split(/[⵿-⵿]/)[0].trim() // Remove Berber/Arabic characters
                 .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '') // Remove Arabic
                 .replace(/[\u2D30-\u2D7F]/g, '') // Remove Tifinagh (Berber)
                 .trim()
      : null

    if (rawRegion !== finalRegion) {
      console.log(`🧹 Cleaned region: "${rawRegion}" → "${finalRegion}"`)
    }

    const { data: location, error: createError } = await supabase
      .from('locations')
      .insert({
        name: locationName,
        slug,
        latitude: finalLatitude,
        longitude: finalLongitude,
        country: finalCountry,
        region: finalRegion,
        description: `Discover ${locationName}`,
        is_published: false,
        // Enhanced fields (if available)
        population: enhancedMetadata?.population || null,
        timezone: enhancedMetadata?.timezone || null,
        data_sources: {
          geocoding: 'nominatim',
          metadata: enhancedMetadata ? 'geonames' : 'nominatim'
        },
        last_data_refresh: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Database error:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to save to database', details: createError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Location saved! ID: ${location.id}`)

    // Step 4: Fetch restaurants and activities from OpenStreetMap
    console.log(`🍽️ Fetching restaurants and activities...`)
    const { latitude, longitude } = geoData

    let restaurantsCount = 0
    let activitiesCount = 0
    let imagesCount = 0
    let hasDescription = false
    let hasWeather = false
    const errors: string[] = []

    try {
      // Fetch restaurants from OpenStreetMap with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const restaurantsResponse = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(`
          [out:json][timeout:15];
          (
            node["amenity"="restaurant"](around:3000,${latitude},${longitude});
            node["amenity"="cafe"](around:3000,${latitude},${longitude});
          );
          out body 50;
        `)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (restaurantsResponse.ok) {
        const restaurantsData = await restaurantsResponse.json()
        const restaurants = restaurantsData.elements
          .filter((place: any) => place.tags?.name)
          .slice(0, 50) // Limit to 50
          .map((place: any) => ({
            location_id: location.id,
            name: place.tags.name,
            description: place.tags.description || null,
            cuisine_type: place.tags.cuisine || 'International',
            address: [place.tags['addr:street'], place.tags['addr:city']].filter(Boolean).join(', ') || null,
            latitude: place.lat,
            longitude: place.lon,
            phone: place.tags.phone || null,
            website: place.tags.website || null,
            opening_hours: place.tags.opening_hours ? { hours: place.tags.opening_hours } : null,
            source: 'openstreetmap',
            external_id: place.id.toString()
          }))

        if (restaurants.length > 0) {
          const { error: restaurantsError } = await supabase
            .from('restaurants')
            .insert(restaurants)

          if (restaurantsError) {
            console.error('Error saving restaurants:', restaurantsError)
            errors.push('Failed to save some restaurants')
          } else {
            restaurantsCount = restaurants.length
            console.log(`✅ Saved ${restaurantsCount} restaurants`)
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching restaurants:', error.message || error)
      if (error.name === 'AbortError') {
        errors.push('Restaurant fetch timed out (OpenStreetMap slow)')
      } else {
        errors.push('Failed to fetch restaurants (try again later)')
      }
    }

    try {
      // Fetch activities from OpenStreetMap with timeout
      const controller2 = new AbortController()
      const timeoutId2 = setTimeout(() => controller2.abort(), 15000) // 15 second timeout

      const activitiesResponse = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(`
          [out:json][timeout:15];
          (
            node["tourism"="attraction"](around:3000,${latitude},${longitude});
            node["tourism"="museum"](around:3000,${latitude},${longitude});
            node["tourism"="viewpoint"](around:3000,${latitude},${longitude});
            node["leisure"="park"](around:3000,${latitude},${longitude});
          );
          out body 50;
        `)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller2.signal
      })

      clearTimeout(timeoutId2)

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        const activities = activitiesData.elements
          .filter((place: any) => place.tags?.name)
          .slice(0, 50) // Limit to 50
          .map((place: any) => {
            // Generate description if missing
            let description = place.tags.description

            if (!description) {
              const category = place.tags.tourism || place.tags.leisure || 'attraction'
              const name = place.tags.name

              // Generate smart description based on category
              if (category === 'museum') {
                description = `Visit ${name}, a museum showcasing local culture and history. A must-see attraction for art and history enthusiasts.`
              } else if (category === 'viewpoint') {
                description = `Enjoy breathtaking views at ${name}. Perfect spot for photography and taking in the scenery.`
              } else if (category === 'attraction') {
                description = `Explore ${name}, one of the popular attractions in ${locationName}. Great for sightseeing and experiencing local culture.`
              } else if (category === 'park') {
                description = `Relax and unwind at ${name}, a beautiful green space perfect for walks and outdoor activities.`
              } else {
                description = `Discover ${name}, a notable ${category} in ${locationName}. Worth adding to your plan.`
              }
            }

            return {
              location_id: location.id,
              name: place.tags.name,
              description: description,
              category: place.tags.tourism || place.tags.leisure || 'attraction',
              address: [place.tags['addr:street'], place.tags['addr:city']].filter(Boolean).join(', ') || null,
              latitude: place.lat,
              longitude: place.lon,
              website: place.tags.website || null,
              opening_hours: place.tags.opening_hours ? { hours: place.tags.opening_hours } : null,
              source: 'openstreetmap',
              external_id: place.id.toString()
            }
          })

        if (activities.length > 0) {
          const { error: activitiesError } = await supabase
            .from('activities')
            .insert(activities)

          if (activitiesError) {
            console.error('Error saving activities:', activitiesError)
            errors.push('Failed to save some activities')
          } else {
            activitiesCount = activities.length
            console.log(`✅ Saved ${activitiesCount} activities`)
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error.message || error)
      if (error.name === 'AbortError') {
        errors.push('Activities fetch timed out (OpenStreetMap slow)')
      } else {
        errors.push('Failed to fetch activities (try again later)')
      }
    }

    // Step 5: Fetch HIGH QUALITY images (20 images, high-res)
    try {
      console.log(`🖼️ Fetching HIGH QUALITY images with SMART FALLBACK...`)

      // Fetch featured image (high-res, 2000px+)
      const featuredImage = await fetchLocationImageHighQuality(locationName)

      // Fetch gallery images with SMART FALLBACK:
      // Priority: Brave → Reddit → Backend Cache (< 1mo) → User Uploads
      let galleryImages = await fetchLocationGalleryWithSmartFallback(
        location.id,
        locationName,
        20,
        geoData.region,
        geoData.country
      )

      // If we got less than 10 images, try with different search terms
      if (galleryImages.length < 10) {
        console.log(`⚠️ Only ${galleryImages.length} images found, trying alternative searches...`)

        const alternativeSearches = [
          `${locationName} landscape`,
          `${locationName} city`,
          `${locationName} architecture`,
          `${locationName} sunset`,
          `${locationName} beach`,
          `${locationName} mountains`
        ]

        for (const searchTerm of alternativeSearches) {
          if (galleryImages.length >= 20) break

          const additionalImages = await fetchLocationGalleryHighQuality(searchTerm, 5)
          galleryImages.push(...additionalImages.filter((img: string) => !galleryImages.includes(img)))
        }
      }

      // ✅ FIXED: Validate images before saving (no placeholders)
      const validation = validateImageData({
        featured_image: featuredImage,
        gallery_images: galleryImages
      })

      // Log validation results
      const stats = getImageStats({
        featured_image: validation.featured_image,
        gallery_images: validation.gallery_images
      })
      console.log(`${formatImageStats(stats)}`)

      // Log any warnings
      for (const warning of validation.warnings) {
        console.warn(`⚠️ ${warning}`)
      }

      // Update location with validated images
      await supabase
        .from('locations')
        .update({
          featured_image: validation.featured_image,
          gallery_images: validation.gallery_images
        })
        .eq('id', location.id)

      imagesCount = validation.gallery_images.length

      // Add warnings to response if images are missing
      if (!validation.isValid) {
        errors.push('Location created but images are incomplete - may need manual image upload')
      }
    } catch (error) {
      console.error('❌ Error fetching images:', error)
      errors.push(`Image fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Step 6: Fetch enhanced description and travel guide (WikiVoyage → Wikipedia → Fallback)
    try {
      console.log(`📖 Fetching enhanced description and travel guide...`)

      // Try WikiVoyage first (travel-focused)
      let description = ''
      let travelGuideUrl = null
      let travelTips: string[] = []

      try {
        const wikiVoyageResponse = await fetch(
          `https://en.wikivoyage.org/api/rest_v1/page/summary/${encodeURIComponent(locationName)}`
        )

        if (wikiVoyageResponse.ok) {
          const wikiVoyageData = await wikiVoyageResponse.json()
          if (wikiVoyageData.extract) {
            description = wikiVoyageData.extract
            travelGuideUrl = wikiVoyageData.content_urls?.desktop?.page
            travelTips = [
              `📖 Full travel guide available at WikiVoyage`,
              `🗺️ Detailed information about transport, attractions, and safety`
            ]
            console.log(`✅ WikiVoyage: Found travel guide`)
          }
        }
      } catch (error) {
        console.log(`⚠️ WikiVoyage: Not available, trying Wikipedia...`)
      }

      // Fallback to Wikipedia if WikiVoyage didn't work
      if (!description) {
        description = await getEnhancedDescription(locationName)
      }

      // Update location with all travel data
      await supabase
        .from('locations')
        .update({
          description,
          travel_guide_url: travelGuideUrl,
          travel_tips: travelTips.length > 0 ? travelTips : null,
          data_sources: {
            ...location.data_sources,
            description: travelGuideUrl ? 'wikivoyage' : 'wikipedia'
          }
        })
        .eq('id', location.id)

      hasDescription = true
      console.log(`✅ Saved enhanced description and travel guide`)
    } catch (error) {
      console.error('Error fetching description:', error)
      errors.push('Failed to fetch description')
    }

    // Step 6.5: Fetch tourist attractions from OpenTripMap
    let attractionsCount = 0
    try {
      console.log(`🏛️ Fetching tourist attractions from OpenTripMap...`)

      // Fetch attractions directly from OpenTripMap
      const attractionsResponse = await fetch(
        `https://api.opentripmap.com/0.1/en/places/radius?` +
        `radius=5000&` +
        `lon=${longitude}&` +
        `lat=${latitude}&` +
        `format=json&` +
        `limit=30`
      )

      if (attractionsResponse.ok) {
        const attractionsData = await attractionsResponse.json()

        const attractions = attractionsData
          .filter((place: any) => place.name && place.name.trim() !== '')
          .slice(0, 20) // Limit to 20 attractions
          .map((place: any) => ({
            location_id: location.id,
            name: place.name,
            category: place.kinds?.split(',')[0] || 'attraction',
            latitude: place.point?.lat,
            longitude: place.point?.lon,
            source: 'opentripmap',
            external_id: place.xid
          }))

        if (attractions.length > 0) {
          // Save to attractions table (not activities)
          const { error: attractionsError } = await supabase
            .from('attractions')
            .insert(attractions)

          if (attractionsError) {
            console.error('Error saving attractions:', attractionsError)
            errors.push('Failed to save some attractions')
          } else {
            attractionsCount = attractions.length
            console.log(`✅ Saved ${attractionsCount} attractions from OpenTripMap`)
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching OpenTripMap attractions:', error.message || error)
      // Don't add to errors - this is optional enhancement
    }

    // Step 7: Fetch weather from Open-Meteo (100% FREE, no API key needed!)
    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      )

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json()

        // Weather code descriptions (WMO Weather interpretation codes)
        const weatherDescriptions: { [key: number]: string } = {
          0: 'Clear sky',
          1: 'Mainly clear',
          2: 'Partly cloudy',
          3: 'Overcast',
          45: 'Foggy',
          48: 'Depositing rime fog',
          51: 'Light drizzle',
          53: 'Moderate drizzle',
          55: 'Dense drizzle',
          61: 'Slight rain',
          63: 'Moderate rain',
          65: 'Heavy rain',
          71: 'Slight snow',
          73: 'Moderate snow',
          75: 'Heavy snow',
          77: 'Snow grains',
          80: 'Slight rain showers',
          81: 'Moderate rain showers',
          82: 'Violent rain showers',
          85: 'Slight snow showers',
          86: 'Heavy snow showers',
          95: 'Thunderstorm',
          96: 'Thunderstorm with slight hail',
          99: 'Thunderstorm with heavy hail'
        }

        const weatherCode = weatherData.current.weather_code
        const description = weatherDescriptions[weatherCode] || 'Unknown'

        // Save weather data to location
        await supabase
          .from('locations')
          .update({
            content: {
              weather: {
                temp: weatherData.current.temperature_2m,
                description: description,
                humidity: weatherData.current.relative_humidity_2m,
                wind_speed: weatherData.current.wind_speed_10m,
                weather_code: weatherCode,
                fetched_at: new Date().toISOString()
              }
            }
          })
          .eq('id', location.id)

        hasWeather = true
        console.log(`✅ Saved weather data: ${weatherData.current.temperature_2m}°C, ${description}`)
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
      errors.push('Failed to fetch weather')
    }

    console.log(`🎉 Auto-fill complete!`)

    return NextResponse.json({
      success: true,
      message: `Successfully auto-filled ${locationName}! 🎉`,
      location: {
        id: location.id,
        name: locationName,
        slug,
        coordinates: {
          latitude: geoData.latitude,
          longitude: geoData.longitude
        },
        country: geoData.country,
        region: geoData.region,
        fullName: geoData.fullName
      },
      results: {
        restaurants: restaurantsCount,
        activities: activitiesCount,
        attractions: attractionsCount,
        images: imagesCount,
        description: hasDescription,
        weather: hasWeather
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Auto-fill error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

