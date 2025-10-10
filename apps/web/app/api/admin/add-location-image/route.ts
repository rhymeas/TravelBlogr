/**
 * API Route: Add Image to Location
 * Adds an image to a location's gallery
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locationSlug, imageUrl, source, platform } = body

    if (!locationSlug || !imageUrl) {
      return NextResponse.json(
        { error: 'Location slug and image URL are required' },
        { status: 400 }
      )
    }

    console.log(`📸 Adding image to location: ${locationSlug}`)

    // Get the location
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('id, slug, name, gallery_images, featured_image')
      .eq('slug', locationSlug)
      .single()

    if (fetchError || !location) {
      console.error('❌ Location not found:', locationSlug)
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Get current gallery images
    const currentGallery = location.gallery_images || []

    // Check if image already exists
    if (currentGallery.includes(imageUrl)) {
      console.log('⚠️ Image already in gallery')
      return NextResponse.json({
        success: true,
        message: 'Image already in gallery'
      })
    }

    // Add image to gallery
    const updatedGallery = [...currentGallery, imageUrl]

    // If no featured image, set this as featured
    const updates: any = {
      gallery_images: updatedGallery,
      updated_at: new Date().toISOString()
    }

    if (!location.featured_image) {
      updates.featured_image = imageUrl
      console.log('✨ Setting as featured image')
    }

    // Update location
    const { error: updateError } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', location.id)

    if (updateError) {
      console.error('❌ Error updating location:', updateError)
      return NextResponse.json(
        { error: 'Failed to update location' },
        { status: 500 }
      )
    }

    console.log(`✅ Image added to ${location.name} (${updatedGallery.length} total images)`)

    return NextResponse.json({
      success: true,
      message: 'Image added successfully',
      totalImages: updatedGallery.length,
      isFeatured: !location.featured_image
    })

  } catch (error) {
    console.error('❌ Error adding image:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

