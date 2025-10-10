/**
 * Admin Endpoint: Clean Gallery Images
 *
 * Removes placeholder images from gallery_images arrays
 * Keeps only real, relevant images
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = createServerSupabase()

    console.log('🧹 Starting gallery cleanup...')

    // Get all locations with gallery images
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, gallery_images, featured_image')
      .not('gallery_images', 'is', null)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No locations to clean',
        cleaned: 0 
      })
    }

    console.log(`📸 Found ${locations.length} locations with gallery images`)

    let cleaned = 0
    const results = []

    for (const location of locations) {
      const originalCount = location.gallery_images?.length || 0
      
      // Filter out placeholder images
      const cleanedImages = (location.gallery_images || []).filter((img: string) => 
        img && 
        !img.includes('picsum.photos') &&
        !img.includes('placeholder') &&
        img !== location.featured_image // Don't duplicate featured image
      )

      const newCount = cleanedImages.length

      // Only update if we removed something
      if (originalCount !== newCount) {
        const { error: updateError } = await supabase
          .from('locations')
          .update({ 
            gallery_images: cleanedImages.length > 0 ? cleanedImages : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', location.id)

        if (updateError) {
          console.error(`  ❌ Failed to update ${location.name}:`, updateError)
          results.push({
            location: location.name,
            status: 'failed',
            error: updateError.message
          })
        } else {
          console.log(`  ✅ ${location.name}: ${originalCount} → ${newCount} images`)
          cleaned++
          results.push({
            location: location.name,
            status: 'success',
            before: originalCount,
            after: newCount,
            removed: originalCount - newCount
          })
        }
      }
    }

    console.log(`\n✅ Cleanup complete! Cleaned ${cleaned} locations`)

    return NextResponse.json({
      success: true,
      message: `Cleaned ${cleaned} locations`,
      results
    })

  } catch (error: any) {
    console.error('❌ Cleanup failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

