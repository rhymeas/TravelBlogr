/**
 * Admin Endpoint: Bust Image Cache
 *
 * Adds a timestamp parameter to all featured_image URLs
 * to force browsers and Next.js to reload fresh images
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()

    console.log('💥 Busting image cache...')

    // Get all locations
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, featured_image')
      .not('featured_image', 'is', null)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No locations to update',
        updated: 0 
      })
    }

    console.log(`🔍 Found ${locations.length} locations with images`)

    const timestamp = Date.now()
    let updated = 0

    for (const location of locations) {
      let imageUrl = location.featured_image

      // Remove any existing cache-busting parameters
      imageUrl = imageUrl.split('?')[0].split('#')[0]

      // Add new timestamp parameter
      const separator = imageUrl.includes('?') ? '&' : '?'
      const newUrl = `${imageUrl}${separator}v=${timestamp}`

      // Update database
      const { error: updateError } = await supabase
        .from('locations')
        .update({ 
          featured_image: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)

      if (updateError) {
        console.error(`  ❌ Failed to update ${location.name}:`, updateError)
      } else {
        console.log(`  ✅ ${location.name}: Added cache buster`)
        updated++
      }
    }

    console.log(`\n✅ Cache busting complete! Updated ${updated} locations`)

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} locations with cache-busting parameters`,
      timestamp,
      updated
    })

  } catch (error: any) {
    console.error('❌ Cache busting failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

