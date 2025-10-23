import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { deleteCached, CacheKeys } from '@/lib/upstash'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  console.log('🗑️ DELETE IMAGE API CALLED')

  try {
    // Initialize Supabase clients
    const authClient = await createServerSupabase()      // cookie-based, for auth only
    const supabase = createServiceSupabase()             // service role, bypasses RLS for updates

    // Check authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    console.log('🔐 Auth check:', { user: user?.email, error: authError })

    if (authError || !user) {
      console.log('❌ Unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { locationSlug, imageUrl } = await request.json()
    console.log('📝 Request data:', { locationSlug, imageUrl: imageUrl?.substring(0, 50) })

    if (!locationSlug || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing locationSlug or imageUrl' },
        { status: 400 }
      )
    }

    // Get the location
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('id, name, gallery_images, featured_image')
      .eq('slug', locationSlug)
      .single()

    if (fetchError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Get current gallery images
    const currentGallery = location.gallery_images || []

    console.log('🔍 Checking image in gallery:')
    console.log('   Image URL:', imageUrl)
    console.log('   Gallery has', currentGallery.length, 'images')
    console.log('   Featured image:', location.featured_image)

    // Check if image exists in gallery OR is the featured image
    const imageInGallery = currentGallery.includes(imageUrl)
    const isFeaturedImage = location.featured_image === imageUrl

    if (!imageInGallery && !isFeaturedImage) {
      console.log('❌ Image not found in gallery or featured image')
      console.log('   First 3 gallery URLs:', currentGallery.slice(0, 3))
      return NextResponse.json(
        {
          error: 'Image not found in gallery',
          debug: {
            imageUrl: imageUrl.substring(0, 100),
            galleryCount: currentGallery.length,
            featuredImage: location.featured_image?.substring(0, 100)
          }
        },
        { status: 404 }
      )
    }

    // Prepare update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Case 1: Image is in gallery_images array
    if (imageInGallery) {
      const updatedGallery = currentGallery.filter((img: string) => img !== imageUrl)
      updates.gallery_images = updatedGallery
      console.log('✅ Removed from gallery_images array')

      // If this was also the featured image, set a new one
      if (location.featured_image === imageUrl) {
        updates.featured_image = updatedGallery[0] || null
        console.log('✅ Updated featured_image to:', updates.featured_image?.substring(0, 60))
      }
    }
    // Case 2: Image is ONLY the featured image (not in gallery)
    else if (isFeaturedImage) {
      // Set featured to first gallery image, or null if no gallery images
      updates.featured_image = currentGallery[0] || null
      console.log('✅ Removed featured_image, new featured:', updates.featured_image?.substring(0, 60))
    }

    // Update the location
    const { error: updateError } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', location.id)

    if (updateError) {
      console.error('Error deleting image:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }

    const remainingCount = updates.gallery_images?.length ?? currentGallery.length

    // Track contribution in location_contributions table
    try {
      await supabase
        .from('location_contributions')
        .insert({
          user_id: user.id,
          location_id: location.id,
          contribution_type: 'image_delete',
          field_edited: 'gallery_images',
          change_snippet: `Deleted image`,
          old_value: { image_url: imageUrl }
        })
      console.log('✅ Contribution tracked')
    } catch (contributionError) {
      console.log('⚠️ Failed to track contribution (non-critical):', contributionError)
    }

    // CRITICAL: Invalidate Upstash cache first (before revalidatePath)
    try {
      await deleteCached(CacheKeys.location(locationSlug))
      await deleteCached(`${CacheKeys.location(locationSlug)}:related`)
      console.log('✅ Upstash cache invalidated for location')
    } catch (cacheError) {
      console.log('⚠️ Upstash cache invalidation failed (non-critical):', cacheError)
    }

    // Revalidate Next.js cache
    try {
      revalidatePath(`/locations/${locationSlug}`)
      revalidatePath(`/locations/${locationSlug}/photos`)
      revalidatePath('/locations')
      console.log('✅ Next.js cache revalidated for location pages')
    } catch (revalidateError) {
      console.log('⚠️ Next.js cache revalidation failed (non-critical):', revalidateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Image removed from gallery',
      remainingImages: remainingCount,
      newFeaturedImage: updates.featured_image,
      wasInGallery: imageInGallery,
      wasFeatured: isFeaturedImage
    })

  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

