import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * POST /api/trips/[tripId]/update-plan
 * 
 * Update V2 trip plan data stored in trip_plan.plan_data JSONB field
 * 
 * Supports updating:
 * - Trip metadata (title, subtitle)
 * - Day data (location, description, didYouKnow, highlights)
 * - Activity data (title, time, duration)
 * - Accommodation data (name, price)
 * - Travel tips
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { tripId } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to edit trips' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { updateType, data } = body

    if (!updateType || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: updateType, data' },
        { status: 400 }
      )
    }

    // Fetch current trip plan data
    const { data: tripPlan, error: fetchError } = await supabase
      .from('trip_plan')
      .select('id, plan_data, user_id')
      .eq('trip_id', tripId)
      .eq('type', 'ai_plan_v2')
      .single()

    if (fetchError || !tripPlan) {
      console.error('Trip plan not found:', fetchError)
      return NextResponse.json(
        { error: 'Trip plan not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (tripPlan.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this trip' },
        { status: 403 }
      )
    }

    // Get current plan data
    const currentPlan = tripPlan.plan_data as any

    // Update plan data based on updateType
    let updatedPlan = { ...currentPlan }

    switch (updateType) {
      case 'metadata':
        // Update trip title/subtitle
        if (data.title !== undefined) {
          updatedPlan.tripTitle = data.title
          updatedPlan.title = data.title // Also update plan.title
        }
        if (data.subtitle !== undefined) {
          updatedPlan.tripSubtitle = data.subtitle
          updatedPlan.summary = data.subtitle // Also update plan.summary
        }
        break

      case 'day':
        // Update day-level data
        const { dayNumber, location, description, didYouKnow, highlights } = data
        if (!dayNumber || !updatedPlan.plan?.days) {
          return NextResponse.json(
            { error: 'Invalid day data' },
            { status: 400 }
          )
        }

        const dayIndex = updatedPlan.plan.days.findIndex((d: any) => d.day === dayNumber)
        if (dayIndex === -1) {
          return NextResponse.json(
            { error: 'Day not found' },
            { status: 404 }
          )
        }

        if (location !== undefined) {
          updatedPlan.plan.days[dayIndex].location = location
        }
        if (description !== undefined) {
          updatedPlan.plan.days[dayIndex].description = description
        }
        if (didYouKnow !== undefined) {
          updatedPlan.plan.days[dayIndex].didYouKnow = didYouKnow
        }
        if (highlights !== undefined) {
          updatedPlan.plan.days[dayIndex].highlights = highlights
        }
        break

      case 'activity':
        // Update activity data
        const { dayNumber: actDayNum, activityIndex, title, time, duration } = data
        if (!actDayNum || activityIndex === undefined || !updatedPlan.plan?.days) {
          return NextResponse.json(
            { error: 'Invalid activity data' },
            { status: 400 }
          )
        }

        const actDayIndex = updatedPlan.plan.days.findIndex((d: any) => d.day === actDayNum)
        if (actDayIndex === -1 || !updatedPlan.plan.days[actDayIndex].items) {
          return NextResponse.json(
            { error: 'Day or activity not found' },
            { status: 404 }
          )
        }

        if (activityIndex >= updatedPlan.plan.days[actDayIndex].items.length) {
          return NextResponse.json(
            { error: 'Activity not found' },
            { status: 404 }
          )
        }

        if (title !== undefined) {
          updatedPlan.plan.days[actDayIndex].items[activityIndex].title = title
        }
        if (time !== undefined) {
          updatedPlan.plan.days[actDayIndex].items[activityIndex].time = time
        }
        if (duration !== undefined) {
          updatedPlan.plan.days[actDayIndex].items[activityIndex].duration = duration
        }
        break

      case 'accommodation':
        // Update accommodation data
        const { dayNumber: accDayNum, name, price } = data
        if (!accDayNum || !updatedPlan.plan?.days) {
          return NextResponse.json(
            { error: 'Invalid accommodation data' },
            { status: 400 }
          )
        }

        const accDayIndex = updatedPlan.plan.days.findIndex((d: any) => d.day === accDayNum)
        if (accDayIndex === -1 || !updatedPlan.plan.days[accDayIndex].items) {
          return NextResponse.json(
            { error: 'Day not found' },
            { status: 404 }
          )
        }

        // Find accommodation item
        const accIndex = updatedPlan.plan.days[accDayIndex].items.findIndex(
          (item: any) => item.type === 'accommodation'
        )

        if (accIndex === -1) {
          return NextResponse.json(
            { error: 'Accommodation not found' },
            { status: 404 }
          )
        }

        if (name !== undefined) {
          updatedPlan.plan.days[accDayIndex].items[accIndex].title = name
        }
        if (price !== undefined) {
          updatedPlan.plan.days[accDayIndex].items[accIndex].costEstimate = price
        }
        break

      case 'tips':
        // Update travel tips
        if (!Array.isArray(data.tips)) {
          return NextResponse.json(
            { error: 'Tips must be an array' },
            { status: 400 }
          )
        }
        updatedPlan.plan.tips = data.tips
        break

      default:
        return NextResponse.json(
          { error: 'Invalid updateType' },
          { status: 400 }
        )
    }

    // Save updated plan data
    const { error: updateError } = await supabase
      .from('trip_plan')
      .update({
        plan_data: updatedPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', tripPlan.id)

    if (updateError) {
      console.error('Error updating trip plan:', updateError)
      return NextResponse.json(
        { error: 'Failed to update trip plan' },
        { status: 500 }
      )
    }

    // Also update trips table metadata if title/subtitle changed
    if (updateType === 'metadata') {
      const tripUpdates: any = {
        updated_at: new Date().toISOString()
      }

      if (data.title !== undefined) {
        tripUpdates.title = data.title
      }
      if (data.subtitle !== undefined) {
        tripUpdates.description = data.subtitle
      }

      await supabase
        .from('trips')
        .update(tripUpdates)
        .eq('id', tripId)
    }

    return NextResponse.json({
      success: true,
      message: 'Trip plan updated successfully'
    })

  } catch (error) {
    console.error('Error in update-plan API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

