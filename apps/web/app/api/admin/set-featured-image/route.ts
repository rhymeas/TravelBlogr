import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()

    const { locationSlug, imageUrl } = await request.json()

    if (!locationSlug || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing locationSlug or imageUrl' },
        { status: 400 }
      )
    }

    console.log(`🌟 Setting featured image for ${locationSlug}`)
    console.log(`   New featured: ${imageUrl.substring(0, 60)}...`)

    // Get the location
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('id, name, featured_image, gallery_images')
      .eq('slug', locationSlug)
      .single()

    if (fetchError || !location) {
      console.error('❌ Location not found:', locationSlug)
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    console.log(`   Previous featured: ${location.featured_image?.substring(0, 60)}...`)

    // Prepare update
    const updates: any = {
      featured_image: imageUrl,
      updated_at: new Date().toISOString()
    }

    // Ensure the image is in gallery_images array
    const galleryImages = location.gallery_images || []
    if (!galleryImages.includes(imageUrl)) {
      console.log(`   Adding to gallery_images (not present)`)
      updates.gallery_images = [imageUrl, ...galleryImages]
    }

    // Update the featured image
    const { error: updateError } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', location.id)

    if (updateError) {
      console.error('❌ Error updating featured image:', updateError)
      return NextResponse.json(
        { error: 'Failed to update featured image' },
        { status: 500 }
      )
    }

    console.log(`✅ Featured image updated successfully!`)

    return NextResponse.json({
      success: true,
      message: 'Featured image updated successfully',
      featuredImage: imageUrl,
      addedToGallery: !galleryImages.includes(imageUrl)
    })

  } catch (error) {
    console.error('Set featured image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

