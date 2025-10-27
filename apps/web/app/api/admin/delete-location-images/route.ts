import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { deleteCached, CacheKeys } from '@/lib/upstash'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  console.log('🗑️ BULK DELETE IMAGES API CALLED')

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

    const { locationSlug, imageUrls } = await request.json()
    console.log('📝 Request data:', { locationSlug, imageCount: imageUrls?.length })

    if (!locationSlug || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Missing locationSlug or imageUrls' },
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
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Remove all specified images from gallery
    const updatedGallery = currentGallery.filter((img: string) => !imageUrls.includes(img))
    updates.gallery_images = updatedGallery

    // If featured image is being deleted, set a new one
    if (imageUrls.includes(location.featured_image)) {
      updates.featured_image = updatedGallery[0] || null
      console.log('✅ Featured image was deleted, new featured:', updates.featured_image?.substring(0, 60))
    }

    // Update the location
    const { error: updateError } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', location.id)

    if (updateError) {
      console.error('Error deleting images:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete images' },
        { status: 500 }
      )
    }

    console.log(`✅ Deleted ${imageUrls.length} images from gallery`)

    // Track contribution in location_contributions table
    try {
      await supabase
        .from('location_contributions')
        .insert({
          user_id: user.id,
          location_id: location.id,
          contribution_type: 'image_delete',
          field_edited: 'gallery_images',
          change_snippet: `Deleted ${imageUrls.length} images`,
          old_value: { image_urls: imageUrls }
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
      message: `${imageUrls.length} images removed from gallery`,
      deletedCount: imageUrls.length,
      remainingImages: updatedGallery.length,
      newFeaturedImage: updates.featured_image
    })

  } catch (error) {
    console.error('Bulk delete images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

