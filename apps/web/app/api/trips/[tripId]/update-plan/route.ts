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
        // Update day-level data (support both shapes: plan.days or days)
        const { dayNumber, location, description, didYouKnow, highlights } = data
        const root: any = (updatedPlan as any)?.plan && Array.isArray((updatedPlan as any).plan?.days)
          ? (updatedPlan as any).plan
          : updatedPlan
        if (typeof dayNumber !== 'number' || !Array.isArray(root?.days)) {
          return NextResponse.json(
            { error: 'Invalid day data' },
            { status: 400 }
          )
        }

        const dayIndex = root.days.findIndex((d: any) => d.day === dayNumber)
        if (dayIndex === -1) {
          return NextResponse.json(
            { error: 'Day not found' },
            { status: 404 }
          )
        }

        if (location !== undefined) {
          root.days[dayIndex].location = location
        }
        if (description !== undefined) {
          root.days[dayIndex].description = description
        }
        if (didYouKnow !== undefined) {
          root.days[dayIndex].didYouKnow = didYouKnow
        }
        if (highlights !== undefined) {
          root.days[dayIndex].highlights = highlights
        }
        // Allow updating day hero image as well (used in editor image picker)
        if (data?.image !== undefined) {
          root.days[dayIndex].image = data.image
        }

        break

      case 'activity':
        // Update activity data (support both shapes: plan.days or days)
        const { dayNumber: actDayNum, activityIndex, title, time, duration } = data
        const rootAct: any = (updatedPlan as any)?.plan && Array.isArray((updatedPlan as any).plan?.days)
          ? (updatedPlan as any).plan
          : updatedPlan
        if (typeof actDayNum !== 'number' || activityIndex === undefined || !Array.isArray(rootAct?.days)) {
          return NextResponse.json(
            { error: 'Invalid activity data' },
            { status: 400 }
          )
        }

        const actDayIndex = rootAct.days.findIndex((d: any) => d.day === actDayNum)
        if (actDayIndex === -1 || !rootAct.days[actDayIndex].items) {
          return NextResponse.json(
            { error: 'Day or activity not found' },
            { status: 404 }
          )
        }

        if (activityIndex >= rootAct.days[actDayIndex].items.length) {
          return NextResponse.json(
            { error: 'Activity not found' },
            { status: 404 }
          )
        }

        if (title !== undefined) {
          rootAct.days[actDayIndex].items[activityIndex].title = title
        }
        if (time !== undefined) {
          rootAct.days[actDayIndex].items[activityIndex].time = time
        }
        if (duration !== undefined) {
          rootAct.days[actDayIndex].items[activityIndex].duration = duration
        }
        // Allow updating activity image as well (used in editor image picker)
        if (data?.image !== undefined) {
          rootAct.days[actDayIndex].items[activityIndex].image = data.image
        }
        break

      case 'accommodation':
        // Update accommodation data (support both shapes: plan.days or days)
        const { dayNumber: accDayNum, name, price } = data
        const rootAcc: any = (updatedPlan as any)?.plan && Array.isArray((updatedPlan as any).plan?.days)
          ? (updatedPlan as any).plan
          : updatedPlan
        if (typeof accDayNum !== 'number' || !Array.isArray(rootAcc?.days)) {
          return NextResponse.json(
            { error: 'Invalid accommodation data' },
            { status: 400 }
          )
        }

        const accDayIndex = rootAcc.days.findIndex((d: any) => d.day === accDayNum)
        if (accDayIndex === -1 || !rootAcc.days[accDayIndex].items) {
          return NextResponse.json(
            { error: 'Day not found' },
            { status: 404 }
          )
        }

        // Find accommodation item
        const accIndex = rootAcc.days[accDayIndex].items.findIndex(
          (item: any) => item.type === 'accommodation'
        )

        if (accIndex === -1) {
          return NextResponse.json(
            { error: 'Accommodation not found' },
            { status: 404 }
          )
        }

        if (name !== undefined) {
          rootAcc.days[accDayIndex].items[accIndex].title = name
        }
        if (price !== undefined) {
          rootAcc.days[accDayIndex].items[accIndex].costEstimate = price
        }
        break

      case 'tips':
        // Update travel tips (support both shapes: plan.tips or tips)
        if (!Array.isArray(data.tips)) {
          return NextResponse.json(
            { error: 'Tips must be an array' },
            { status: 400 }
          )
        }
        const rootTips: any = (updatedPlan as any)?.plan ? (updatedPlan as any).plan : updatedPlan
        rootTips.tips = data.tips
        break

      case 'days':
        // Replace entire days array (used for add/delete/reorder/change-location bulk updates)
        if (!Array.isArray((data as any)?.days)) {
          return NextResponse.json(
            { error: 'days must be an array' },
            { status: 400 }
          )
        }
        // Accept the array as provided by client editor
        if ((updatedPlan as any)?.plan && Array.isArray((updatedPlan as any).plan?.days)) {
          ;(updatedPlan as any).plan.days = (data as any).days
        } else {
          ;(updatedPlan as any).days = (data as any).days
        }
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

