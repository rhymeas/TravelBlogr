/**
 * Admin Refetch Location API
 * Comprehensive endpoint for refetching location data with granular options
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import {
  fetchLocationImageHighQuality,
  fetchLocationGalleryHighQuality
} from '@/lib/services/enhancedImageService'
import { fetchActivityImage } from '@/lib/services/robustImageService'
import { fetchActivityLink } from '@/lib/services/activityLinkService'
import { translateContent } from '@/lib/services/contentTranslationService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const body = await request.json()
    const {
      locationSlug,
      refetchImages,
      refetchActivityImages,
      refetchActivityLinks,
      translateContent: shouldTranslate,
      locationName,
      locationCountry
    } = body

    if (!locationSlug) {
      return NextResponse.json(
        { success: false, error: 'Location slug is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Refetching data for: ${locationSlug}`)

    // Get location from database
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('*')
      .eq('slug', locationSlug)
      .single()

    if (fetchError || !location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    const results: any = {
      success: true,
      location: location.name
    }

    // 1. Refetch Images
    if (refetchImages) {
      console.log('🖼️ Refetching location images...')
      
      const featuredImage = await fetchLocationImageHighQuality(location.name)
      const galleryImages = await fetchLocationGalleryHighQuality(location.name, 20)

      await supabase
        .from('locations')
        .update({
          featured_image: featuredImage,
          gallery_images: galleryImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)

      results.featuredImage = featuredImage
      results.galleryCount = galleryImages.length
    }

    // 2. Refetch Activity Images
    if (refetchActivityImages || refetchImages) {
      console.log('🎯 Refetching activity images...')
      
      const { data: activities } = await supabase
        .from('location_activity_links')
        .select('id, activity_name, image_url')
        .eq('location_id', location.id)
        .or('image_url.is.null,image_url.eq.')
        .limit(20)

      let activityImagesFixed = 0
      
      if (activities && activities.length > 0) {
        for (const activity of activities) {
          try {
            const imageUrl = await fetchActivityImage(
              activity.activity_name,
              location.name,
              location.country
            )
            
            if (imageUrl && imageUrl !== '/placeholder-activity.svg') {
              await supabase
                .from('location_activity_links')
                .update({
                  image_url: imageUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', activity.id)
              
              activityImagesFixed++
            }
          } catch (err) {
            console.error(`Failed to fetch image for ${activity.activity_name}:`, err)
          }
          
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      results.activityImagesFixed = activityImagesFixed
    }

    // 3. Refetch Activity Links
    if (refetchActivityLinks) {
      console.log('🔗 Refetching activity links...')
      
      const { data: activities } = await supabase
        .from('location_activity_links')
        .select('id, activity_name, link_url')
        .eq('location_id', location.id)
        .or('link_url.is.null,link_url.eq.')
        .limit(20)

      let activityLinksFixed = 0
      
      if (activities && activities.length > 0) {
        for (const activity of activities) {
          try {
            const linkData = await fetchActivityLink(
              activity.activity_name,
              locationName || location.name,
              locationCountry || location.country
            )
            
            if (linkData && linkData.url) {
              await supabase
                .from('location_activity_links')
                .update({
                  link_url: linkData.url,
                  source: linkData.source,
                  type: linkData.type,
                  updated_at: new Date().toISOString()
                })
                .eq('id', activity.id)
              
              activityLinksFixed++
            }
          } catch (err) {
            console.error(`Failed to fetch link for ${activity.activity_name}:`, err)
          }
          
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      results.activityLinksFixed = activityLinksFixed
    }

    // 4. Translate Content
    if (shouldTranslate) {
      console.log('🌐 Translating content...')
      
      let translatedItems = 0

      // Translate location description
      if (location.description) {
        const translated = await translateContent(location.description, location.id, 'location_description')
        if (translated.wasTranslated) {
          await supabase
            .from('locations')
            .update({
              description: translated.translatedText,
              original_description: location.description,
              original_language: translated.detectedLanguage,
              updated_at: new Date().toISOString()
            })
            .eq('id', location.id)
          
          translatedItems++
        }
      }

      // Translate activity names and descriptions
      const { data: activities } = await supabase
        .from('location_activity_links')
        .select('id, activity_name, description')
        .eq('location_id', location.id)
        .limit(20)

      if (activities) {
        for (const activity of activities) {
          let updated = false
          const updates: any = {}

          // Translate activity name
          if (activity.activity_name) {
            const translatedName = await translateContent(
              activity.activity_name,
              activity.id,
              'activity_name'
            )
            if (translatedName.wasTranslated) {
              updates.activity_name = translatedName.translatedText
              updates.original_activity_name = activity.activity_name
              updated = true
              translatedItems++
            }
          }

          // Translate activity description
          if (activity.description) {
            const translatedDesc = await translateContent(
              activity.description,
              activity.id,
              'activity_description'
            )
            if (translatedDesc.wasTranslated) {
              updates.description = translatedDesc.translatedText
              updates.original_description = activity.description
              updated = true
              translatedItems++
            }
          }

          if (updated) {
            await supabase
              .from('location_activity_links')
              .update({
                ...updates,
                updated_at: new Date().toISOString()
              })
              .eq('id', activity.id)
          }

          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      results.translatedItems = translatedItems
    }

    console.log('✅ Refetch complete:', results)

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('Refetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Refetch failed'
      },
      { status: 500 }
    )
  }
}

