/**
 * Bulk Update Images API
 * Updates all locations with high-quality images
 * 
 * Call: POST /api/admin/bulk-update-images
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  fetchLocationImageHighQuality, 
  fetchLocationGalleryHighQuality 
} from '@/lib/services/enhancedImageService'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST() {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  try {
    // Get all locations
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, slug, country')
      .order('created_at', { ascending: false })

    if (error || !locations || locations.length === 0) {
      return NextResponse.json(
        { error: 'No locations found', details: error },
        { status: 404 }
      )
    }

    const results = []
    let updated = 0
    let failed = 0

    for (const location of locations) {
      try {
        console.log(`📍 Processing: ${location.name}`)

        // Fetch high-quality images
        const featuredImage = await fetchLocationImageHighQuality(location.name)
        const galleryImages = await fetchLocationGalleryHighQuality(location.name, 20)

        console.log(`  ✅ Featured: ${featuredImage !== '/placeholder-location.svg' ? 'Found' : 'Placeholder'}`)
        console.log(`  ✅ Gallery: ${galleryImages.length} images`)

        // Update database
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            featured_image: featuredImage,
            gallery_images: galleryImages,
            updated_at: new Date().toISOString()
          })
          .eq('id', location.id)

        if (updateError) {
          console.error(`  ❌ Error updating ${location.name}:`, updateError)
          failed++
          results.push({
            location: location.name,
            status: 'failed',
            error: updateError.message
          })
        } else {
          updated++
          results.push({
            location: location.name,
            status: 'success',
            featured: featuredImage !== '/placeholder-location.svg',
            galleryCount: galleryImages.length
          })
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error: any) {
        console.error(`  ❌ Error processing ${location.name}:`, error)
        failed++
        results.push({
          location: location.name,
          status: 'failed',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: locations.length,
        updated,
        failed
      },
      results
    })

  } catch (error: any) {
    console.error('Bulk update error:', error)
    return NextResponse.json(
      { error: 'Bulk update failed', details: error.message },
      { status: 500 }
    )
  }
}

