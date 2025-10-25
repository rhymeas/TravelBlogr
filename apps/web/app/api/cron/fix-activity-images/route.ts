/**
 * Automated Background Job: Fix Missing Activity Images
 *
 * This cron job runs periodically to:
 * 1. Find activities without images in location_activity_links table
 * 2. Fetch images using the robust image service
 * 3. Update the database
 *
 * Can be triggered:
 * - Manually via API call
 * - Automatically via Railway Cron or GitHub Actions
 * - On-demand from admin panel
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { fetchActivityImage } from '@/lib/services/robustImageService'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max execution

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client at runtime (not build time)
    const supabase = await createServerSupabase()

    console.log('🔧 [CRON] Starting automated activity image fix job...')

    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find activities without images in location_activity_links table
    const { data: activities, error } = await supabase
      .from('location_activity_links')
      .select(`
        id,
        location_id,
        activity_name,
        image_url,
        locations!inner (
          id,
          name,
          country
        )
      `)
      .or('image_url.is.null,image_url.eq.')
      .limit(20) // Process 20 at a time to avoid timeout

    if (error) {
      console.error('❌ [CRON] Database error:', error)
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }

    if (!activities || activities.length === 0) {
      console.log('✅ [CRON] All activities have images!')
      return NextResponse.json({
        success: true,
        message: 'All activities have images',
        processed: 0
      })
    }

    console.log(`🔍 [CRON] Found ${activities.length} activities without images`)

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    // Process each activity
    for (const activity of activities) {
      const location = (activity as any).locations
      console.log(`\n📍 [CRON] Processing: ${activity.activity_name} in ${location.name}`)

      try {
        // Fetch image for activity with enhanced contextualization (location + country)
        console.log(`  🖼️ Fetching contextualized image...`)
        const imageUrl = await fetchActivityImage(
          activity.activity_name,
          location.name,
          location.country // Enhanced: Include country for better context
        )

        if (!imageUrl || imageUrl === '/placeholder-activity.svg') {
          console.log(`  ⚠️ No image found, skipping`)
          results.skipped++
          results.details.push({
            activity: activity.activity_name,
            location: location.name,
            status: 'skipped',
            reason: 'No image available'
          })
          continue
        }

        console.log(`  ✅ Found image: ${imageUrl.substring(0, 60)}...`)

        // Update database
        const { error: updateError } = await supabase
          .from('location_activity_links')
          .update({
            image_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', activity.id)

        if (updateError) {
          console.error(`  ❌ Update failed:`, updateError)
          results.failed++
          results.details.push({
            activity: activity.activity_name,
            location: location.name,
            status: 'failed',
            error: updateError.message
          })
        } else {
          console.log(`  ✅ Updated ${activity.activity_name}`)
          results.success++
          results.details.push({
            activity: activity.activity_name,
            location: location.name,
            status: 'success',
            imageUrl: imageUrl
          })
        }

        // Rate limiting between activities (500ms)
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error: any) {
        console.error(`  ❌ Error processing ${activity.activity_name}:`, error)
        results.failed++
        results.details.push({
          activity: activity.activity_name,
          location: location.name,
          status: 'error',
          error: error.message
        })
      }
    }

    console.log('\n✅ [CRON] Job complete:', results)

    return NextResponse.json({
      success: true,
      message: `Processed ${activities.length} activities`,
      results
    })

  } catch (error: any) {
    console.error('❌ [CRON] Job failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

