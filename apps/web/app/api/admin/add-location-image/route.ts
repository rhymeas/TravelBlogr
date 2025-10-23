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

    const { locationSlug, imageUrl, storagePath, meta } = await request.json()

    if (!locationSlug || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing locationSlug or imageUrl' },
        { status: 400 }
      )
    }
    // Minimal validation for third-party sources
    const source = meta?.source
    if (source?.type === 'other' && (!source?.consent || !source?.name)) {
      return NextResponse.json(
        { error: 'Consent and source name required for third-party images' },
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
    const currentGallery: string[] = location.gallery_images || []

    // If image already there, no-op (idempotent)
    if (currentGallery.includes(imageUrl)) {
      return NextResponse.json({ success: true, message: 'Image already in gallery' })
    }

    // Prepare updates
    const updatedGallery = [imageUrl, ...currentGallery]
    const updates: any = {
      gallery_images: updatedGallery,
      updated_at: new Date().toISOString()
    }

    // If no featured image, set this as featured
    if (!location.featured_image) {
      updates.featured_image = imageUrl
      console.log('✨ Setting as featured image')
    }

    // Update location using service role (bypass RLS)
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

    // Track contribution (non-critical)
    try {
      await supabase
        .from('location_contributions')
        .insert({
          user_id: user.id,
          location_id: location.id,
          contribution_type: 'image_add',
          field_edited: 'gallery_images',
          change_snippet: 'Added image to gallery',
          new_value: {
            image_url: imageUrl,
            storage_path: storagePath || null,
            file_name: storagePath ? storagePath.split('/').pop() : null,
            meta: meta || null,
          }
        })
    } catch (contribErr) {
      console.log('⚠️ Failed to track contribution (non-critical):', contribErr)
    }

    // CRITICAL: Invalidate Upstash FIRST, then Next.js cache
    try {
      await deleteCached(CacheKeys.location(locationSlug))
      await deleteCached(`${CacheKeys.location(locationSlug)}:related`)
    } catch (cacheErr) {
      console.log('⚠️ Upstash cache invalidation failed (non-critical):', cacheErr)
    }

    try {
      revalidatePath(`/locations/${locationSlug}`)
      revalidatePath(`/locations/${locationSlug}/photos`)
      revalidatePath('/locations')
    } catch (revalidateErr) {
      console.log('⚠️ Next.js cache revalidation failed (non-critical):', revalidateErr)
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
