import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { deleteCached, CacheKeys } from '@/lib/upstash'

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
  if (field === 'description') {
    const oldLength = oldValue?.length || 0
    const newLength = newValue?.length || 0
    if (oldLength === 0) return 'Added description'
    if (newLength > oldLength) return `Expanded description (+${newLength - oldLength} chars)`
    if (newLength < oldLength) return `Shortened description (-${oldLength - newLength} chars)`
    return 'Updated description'
  }

  if (field === 'activities') {
    const oldCount = Array.isArray(oldValue) ? oldValue.length : 0
    const newCount = Array.isArray(newValue) ? newValue.length : 0
    if (newCount > oldCount) return `Added ${newCount - oldCount} activity(s)`
    if (newCount < oldCount) return `Removed ${oldCount - newCount} activity(s)`
    return 'Updated activities'
  }

  if (field === 'restaurants') {
    const oldCount = Array.isArray(oldValue) ? oldValue.length : 0
    const newCount = Array.isArray(newValue) ? newValue.length : 0
    if (newCount > oldCount) return `Added ${newCount - oldCount} restaurant(s)`
    if (newCount < oldCount) return `Removed ${oldCount - newCount} restaurant(s)`
    return 'Updated restaurants'
  }

  if (field === 'gallery_images') {
    const oldCount = Array.isArray(oldValue) ? oldValue.length : 0
    const newCount = Array.isArray(newValue) ? newValue.length : 0
    if (newCount > oldCount) return `Added ${newCount - oldCount} image(s)`
    if (newCount < oldCount) return `Removed ${oldCount - newCount} image(s)`
    return 'Updated images'
  }

  return `Updated ${field}`
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await createServerSupabase()
    const supabaseAdmin = createServiceSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to edit locations' },
        { status: 401 }
      )
    }

    const { locationId, locationSlug, field, value } = await request.json()

    // Accept EITHER locationId OR locationSlug (not necessarily both)
    if ((!locationId && !locationSlug) || !field) {
      return NextResponse.json(
        { error: 'Missing required fields: provide locationId or locationSlug and the field to edit' },
        { status: 400 }
      )
    }

    console.log(`📝 User ${user.id} updating location ${locationSlug} field: ${field}`)

    // Validate field is allowed to be edited
    const allowedFields = ['name', 'description', 'activities', 'restaurants', 'experiences', 'did_you_know', 'gallery_images']
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: 'Field not allowed to be edited' },
        { status: 400 }
      )
    }

    // Get current location data (support both ID and slug lookup)
    let query = supabaseAdmin
      .from('locations')
      .select('id, slug, name, description, gallery_images, is_published')

    // Try to match by ID first (UUID format), otherwise use slug
    if (locationId && locationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', locationId)
    } else if (locationSlug) {
      query = query.eq('slug', locationSlug)
    } else {
      return NextResponse.json(
        { error: 'Invalid location identifier' },
        { status: 400 }
      )
    }

    const { data: location, error: fetchError } = await query.single()

    // Support auto-creating a stub location when editing a not-yet-cached slug
    let locationRecord: any = location
    if (fetchError || !locationRecord) {
      if (locationSlug) {
        console.log('⚠️ Location not found, creating stub for slug:', locationSlug)
        const defaultName = (field === 'name' && typeof value === 'string' && value.trim())
          ? value.trim()
          : (locationSlug || '')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase())
              .slice(0, 200)

        const { data: created, error: insertError } = await supabaseAdmin
          .from('locations')
          .insert({
            slug: locationSlug,
            name: defaultName || locationSlug,
            country: 'Unknown', // required by schema
            description: null,
            gallery_images: [],
            is_published: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id, slug, name, description, gallery_images, is_published')
          .single()

        if (insertError || !created) {
          console.error('Failed to auto-create stub location:', insertError)
          // If duplicate slug exists but was not visible due to RLS, fetch it with admin and proceed
          if ((insertError as any)?.code === '23505' || String(insertError?.message || '').includes('duplicate')) {
            const { data: existing, error: fetchExistingError } = await supabaseAdmin
              .from('locations')
              .select('id, slug, name, description, gallery_images, is_published')
              .eq('slug', locationSlug)
              .single()
            if (!fetchExistingError && existing) {
              console.log('✅ Found existing location by slug after duplicate insert, proceeding with update')
              locationRecord = existing
            } else {
              return NextResponse.json(
                { error: 'Location not found and could not be created (duplicate conflict)' },
                { status: 500 }
              )
            }
          } else {
            return NextResponse.json(
              { error: 'Location not found and could not be created' },
              { status: 500 }
            )
          }
        } else {
          locationRecord = created
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid location identifier' },
          { status: 400 }
        )
      }
    }

    // SAFEGUARD: Track that location has been community-edited
    // This helps us know which locations have community contributions
    // Auto-generated locations are STILL editable - that's the point!
    const isAutoGenerated = locationRecord.data_sources && !locationRecord.is_published
    if (isAutoGenerated) {
      console.log(`✅ Location ${locationSlug} was auto-generated, now being improved by community`)
    }

    // Prepare update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Handle different field types
    if (field === 'name') {
      // Sanitize and validate location name
      const sanitizedName = sanitizeHtml(value).substring(0, 200) // Max 200 chars
      if (!sanitizedName.trim()) {
        return NextResponse.json(
          { error: 'Location name cannot be empty' },
          { status: 400 }
        )
      }
      updates.name = sanitizedName
    } else if (field === 'description') {
      // Sanitize HTML to prevent XSS attacks
      updates.description = sanitizeHtml(value)
    } else if (field === 'activities') {
      // Validate activities structure
      if (!Array.isArray(value)) {
        return NextResponse.json(
          { error: 'Activities must be an array' },
          { status: 400 }
        )
      }
      updates.activities = value
    } else if (field === 'restaurants') {
      // Validate restaurants structure
      if (!Array.isArray(value)) {
        return NextResponse.json(
          { error: 'Restaurants must be an array' },
          { status: 400 }
        )
      }
      updates.restaurants = value
    } else if (field === 'experiences') {
      if (!Array.isArray(value)) {
        return NextResponse.json(
          { error: 'Experiences must be an array' },
          { status: 400 }
        )
      }
      updates.experiences = value
    } else if (field === 'did_you_know') {
      if (!Array.isArray(value)) {
        return NextResponse.json(
          { error: 'Did you know must be an array' },
          { status: 400 }
        )
      }
      updates.did_you_know = value
    } else if (field === 'gallery_images') {
      if (!Array.isArray(value)) {
        return NextResponse.json(
          { error: 'Gallery images must be an array' },
          { status: 400 }
        )
      }
      updates.gallery_images = value
    }

    // CRITICAL: Track community edits for data quality
    // Mark location as community-improved (still allows future auto-updates to other fields)
    // This helps us understand which locations have been verified/improved by real users
    if (isAutoGenerated) {
      updates.is_published = true // Mark as published (community-verified)
      updates.data_sources = {
        ...locationRecord.data_sources,
        community_edited: true,
        community_edited_fields: [...(locationRecord.data_sources?.community_edited_fields || []), field],
        last_community_edit: new Date().toISOString()
      }
      console.log(`✅ Marking field "${field}" as community-edited`)
    } else if (locationRecord.data_sources) {
      // Track which fields have been edited even for already-published locations
      const editedFields = locationRecord.data_sources?.community_edited_fields || []
      if (!editedFields.includes(field)) {
        updates.data_sources = {
          ...locationRecord.data_sources,
          community_edited: true,
          community_edited_fields: [...editedFields, field],
          last_community_edit: new Date().toISOString()
        }
      }
    }

    // Update the location (always use the fetched record's ID for safety)
    const { error: updateError } = await supabaseAdmin
      .from('locations')
      .update(updates)
      .eq('id', locationRecord.id)

    if (updateError) {
      console.error('Error updating location:', updateError)
      return NextResponse.json(
        { error: 'Failed to update location' },
        { status: 500 }
      )
    }

    console.log(`✅ Location ${locationSlug} updated successfully`)

    // CRITICAL: Get old value for change tracking
    const oldValue = (locationRecord as any)[field]
    const changeSnippet = generateChangeSnippet(field, oldValue, value)

    // Log contribution for community recognition with change details
    try {
      await supabaseAdmin
        .from('location_contributions')
        .insert({
          user_id: user.id,
          location_id: locationRecord.id,
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

    // CRITICAL: Invalidate Upstash cache FIRST
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
      message: 'Location updated successfully',
      field,
      updated: true
    })

  } catch (error) {
    console.error('Location update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

