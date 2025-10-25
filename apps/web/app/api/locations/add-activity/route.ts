import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'
import { deleteCached, CacheKeys } from '@/lib/upstash'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface AddActivityRequest {
  locationId: string
  locationSlug: string
  name: string
  description?: string
  category: 'outdoor' | 'cultural' | 'food' | 'adventure' | 'relaxation'
  difficulty?: 'easy' | 'moderate' | 'hard'
  cost?: 'free' | 'low' | 'medium' | 'high'
  duration?: string
  imageUrl?: string
  linkUrl?: string
  linkSource?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication - allow any signed-in user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to add activities' },
        { status: 401 }
      )
    }

    const body: AddActivityRequest = await request.json()
    const {
      locationId,
      locationSlug,
      name,
      description,
      category,
      difficulty,
      cost,
      duration,
      imageUrl,
      linkUrl,
      linkSource,
    } = body

    if (!locationId || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: locationId, name, category' },
        { status: 400 }
      )
    }

    // Get current location
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('activities')
      .eq('id', locationId)
      .single()

    if (fetchError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Create new activity
    const newActivity = {
      id: uuidv4(),
      name,
      description: description || '',
      category,
      difficulty: difficulty || 'moderate',
      cost: cost || 'free',
      duration: duration || '',
      image_url: imageUrl || null,
      link_url: linkUrl || null,
      link_source: linkSource || null,
      created_at: new Date().toISOString(),
    }

    // Add to activities array
    const currentActivities = location.activities || []
    const updatedActivities = [...currentActivities, newActivity]

    // Update location
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        activities: updatedActivities,
        updated_at: new Date().toISOString(),
      })
      .eq('id', locationId)

    if (updateError) {
      console.error('Error updating location:', updateError)
      return NextResponse.json(
        { error: 'Failed to add activity' },
        { status: 500 }
      )
    }

    // Log contribution
    await supabase.from('location_contributions').insert({
      location_id: locationId,
      user_id: user.id,
      contribution_type: 'activity_added',
      field_edited: 'activities',
      change_snippet: `Added activity: ${name}`,
      created_at: new Date().toISOString(),
    })

    // Invalidate cache - ALWAYS invalidate Upstash FIRST, then Next.js cache
    await deleteCached(CacheKeys.location(locationSlug))
    await deleteCached(`${CacheKeys.location(locationSlug)}:related`)
    revalidatePath(`/locations/${locationSlug}`)
    revalidatePath('/locations')

    return NextResponse.json({
      success: true,
      activity: newActivity,
      message: `Activity "${name}" added successfully!`,
    })
  } catch (error) {
    console.error('Error adding activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

