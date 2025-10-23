import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { deleteCached, CacheKeys } from '@/lib/upstash'
import { revalidatePath } from 'next/cache'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase clients
    const authClient = await createServerSupabase()      // cookie-based, for auth only
    const supabase = createServiceSupabase()             // service role, bypasses RLS for updates

    // Check authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

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

    // Track contribution in location_contributions table
    try {
      await supabase
        .from('location_contributions')
        .insert({
          user_id: user.id,
          location_id: location.id,
          contribution_type: 'image_featured',
          field_edited: 'featured_image',
          change_snippet: `Set featured image`,
          new_value: { image_url: imageUrl }
        })
      console.log('✅ Contribution tracked')
    } catch (contributionError) {
      console.log('⚠️ Failed to track contribution (non-critical):', contributionError)
    }

    // CRITICAL: Invalidate Upstash cache
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

