import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Simple HTML sanitization for server-side (Next.js compatible)
 * Removes script tags and dangerous attributes
 */
function sanitizeHtml(html: string): string {
  if (!html) return ''

  return html
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
    .replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '')
    // Trim
    .trim()
}

/**
 * Generate a human-readable change snippet for activity feed
 */
function generateChangeSnippet(field: string, oldValue: any, newValue: any): string {
  if (field === 'title') {
    if (!oldValue) return 'Added title'
    return 'Updated title'
  }
  
  if (field === 'description') {
    const oldLength = oldValue?.length || 0
    const newLength = newValue?.length || 0
    if (oldLength === 0) return 'Added description'
    if (newLength > oldLength) return `Expanded description (+${newLength - oldLength} chars)`
    if (newLength < oldLength) return `Shortened description (-${oldLength - newLength} chars)`
    return 'Updated description'
  }
  
  if (field === 'highlights') {
    const oldCount = Array.isArray(oldValue) ? oldValue.length : 0
    const newCount = Array.isArray(newValue) ? newValue.length : 0
    if (newCount > oldCount) return `Added ${newCount - oldCount} highlight(s)`
    if (newCount < oldCount) return `Removed ${oldCount - newCount} highlight(s)`
    return 'Updated highlights'
  }
  
  if (field === 'destination') {
    if (!oldValue) return 'Added destination'
    return 'Updated destination'
  }
  
  if (field === 'trip_type') {
    if (!oldValue) return 'Added trip type'
    return 'Updated trip type'
  }
  
  if (field === 'duration_days') {
    if (!oldValue) return 'Added duration'
    return 'Updated duration'
  }
  
  return `Updated ${field}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to edit trips' },
        { status: 401 }
      )
    }

    const { tripId, tripSlug, field, value } = await request.json()

    if (!tripId || !field) {
      return NextResponse.json(
        { error: 'Missing required fields: tripId, field' },
        { status: 400 }
      )
    }

    // Validate field is allowed
    const allowedFields = ['title', 'description', 'destination', 'trip_type', 'duration_days', 'highlights', 'cover_image']
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: 'Field not allowed to be edited' },
        { status: 400 }
      )
    }

    // Get current trip data
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('id, slug, user_id, title, description, destination, trip_type, duration_days, highlights, cover_image, is_public_template')
      .eq('id', tripId)
      .single()

    if (fetchError || !trip) {
      console.error('Trip not found:', fetchError)
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to edit
    // Owner can always edit, or if it's a public template, anyone can contribute
    const isOwner = user.id === trip.user_id
    const isPublicTemplate = trip.is_public_template

    if (!isOwner && !isPublicTemplate) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this trip' },
        { status: 403 }
      )
    }

    // Prepare update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Handle different field types
    if (field === 'title') {
      // Sanitize title to prevent XSS attacks
      updates.title = sanitizeHtml(value).substring(0, 200) // Max 200 chars
    } else if (field === 'description') {
      // Sanitize description to prevent XSS attacks
      updates.description = sanitizeHtml(value)
    } else if (field === 'destination') {
      updates.destination = value
    } else if (field === 'trip_type') {
      updates.trip_type = value
    } else if (field === 'duration_days') {
      updates.duration_days = parseInt(value) || null
    } else if (field === 'highlights') {
      // Validate highlights structure
      if (!Array.isArray(value)) {
        return NextResponse.json(
          { error: 'Highlights must be an array' },
          { status: 400 }
        )
      }
      updates.highlights = value
    } else if (field === 'cover_image') {
      updates.cover_image = value
    }

    // Update the trip
    const { error: updateError } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)

    if (updateError) {
      console.error('Error updating trip:', updateError)
      return NextResponse.json(
        { error: 'Failed to update trip', details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Trip ${tripSlug} updated successfully`)

    // CRITICAL: Get old value for change tracking
    const oldValue = (trip as any)?.[field]
    const changeSnippet = generateChangeSnippet(field, oldValue, value)

    // Log contribution for community recognition with change details
    try {
      await supabase
        .from('trip_contributions')
        .insert({
          user_id: user.id,
          trip_id: tripId,
          contribution_type: 'edit',
          field_edited: field,
          change_snippet: changeSnippet,
          old_value: oldValue,
          new_value: value,
          created_at: new Date().toISOString()
        })
      console.log(`✅ Contribution logged for user ${user.id}: ${changeSnippet}`)
    } catch (contributionError) {
      console.log('⚠️ Failed to log contribution (non-critical):', contributionError)
    }

    // Revalidate Next.js cache
    if (tripSlug) {
      revalidatePath(`/trips/${tripSlug}`)
      revalidatePath(`/dashboard/trips/${tripId}`)
      revalidatePath('/dashboard/trips')
    }

    return NextResponse.json({
      success: true,
      message: 'Trip updated successfully',
      field,
      changeSnippet,
      updated: true
    })

  } catch (error) {
    console.error('Trip update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

