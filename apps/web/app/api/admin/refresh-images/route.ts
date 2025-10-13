/**
 * API Route: Refresh Images for a Location
 * POST /api/admin/refresh-images
 * 
 * Forces a refresh of images for a specific location using the enhanced image service
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { fetchLocationImage, fetchLocationGallery } from '@/lib/services/robustImageService'
import {
  fetchLocationImageHighQuality,
  fetchLocationGalleryHighQuality
} from '@/lib/services/enhancedImageService'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = createServerSupabase()

    const body = await request.json()
    const { locationSlug } = body

    if (!locationSlug) {
      return NextResponse.json(
        { success: false, error: 'Location slug is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Refreshing images for: ${locationSlug}`)

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

    console.log(`📍 Found location: ${location.name}`)

    // Fetch new HIGH QUALITY images
    console.log('🖼️ Fetching HIGH-RES featured image...')
    const featuredImage = await fetchLocationImageHighQuality(location.name)

    console.log('🖼️ Fetching 20 HIGH-RES gallery images...')
    const galleryImages = await fetchLocationGalleryHighQuality(location.name, 20)

    // Update database
    console.log('💾 Updating database...')
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        featured_image: featuredImage,
        gallery_images: galleryImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update database' },
        { status: 500 }
      )
    }

    console.log('✅ Images refreshed successfully!')

    return NextResponse.json({
      success: true,
      data: {
        location: location.name,
        featured_image: featuredImage,
        gallery_count: galleryImages.length,
        gallery_images: galleryImages
      }
    })

  } catch (error) {
    console.error('Error refreshing images:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check current images
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = createServerSupabase()

    const { searchParams } = new URL(request.url)
    const locationSlug = searchParams.get('slug')

    if (!locationSlug) {
      return NextResponse.json(
        { success: false, error: 'Location slug is required' },
        { status: 400 }
      )
    }

    const { data: location, error } = await supabase
      .from('locations')
      .select('name, slug, featured_image, gallery_images')
      .eq('slug', locationSlug)
      .single()

    if (error || !location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: location
    })

  } catch (error) {
    console.error('Error fetching location images:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

