/**
 * Guest Migration Service
 * 
 * Handles migration of guest trips from localStorage to user account
 * after successful authentication.
 */

import { getBrowserSupabase } from '@/lib/supabase'
import { GuestTrip } from '@/stores/guestTripStore'
import toast from 'react-hot-toast'

export interface MigrationResult {
  success: boolean
  migratedCount: number
  skippedCount: number
  errors: string[]
}

/**
 * Migrate guest trips to authenticated user account
 */
export async function migrateGuestTrips(
  userId: string,
  guestTrips: GuestTrip[]
): Promise<MigrationResult> {
  const supabase = getBrowserSupabase()
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  }

  if (!guestTrips || guestTrips.length === 0) {
    return result
  }

  console.log(`🔄 Migrating ${guestTrips.length} guest trips for user ${userId}`)

  for (const guestTrip of guestTrips) {
    try {
      // Check if user already has a trip with the same title
      const { data: existingTrip } = await supabase
        .from('trips')
        .select('id, title')
        .eq('user_id', userId)
        .eq('title', guestTrip.title)
        .single()

      if (existingTrip) {
        console.log(`⏭️  Skipping duplicate trip: "${guestTrip.title}"`)
        result.skippedCount++
        continue
      }

      // Generate slug from title
      const slug = guestTrip.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Create trip in database
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: userId,
          title: guestTrip.title,
          description: guestTrip.description,
          slug,
          start_date: guestTrip.startDate,
          end_date: guestTrip.endDate,
          status: 'draft',
          location_data: {
            destinations: guestTrip.destinations,
            interests: guestTrip.interests,
            budget: guestTrip.budget,
          },
          created_at: guestTrip.createdAt,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (tripError) {
        console.error(`❌ Error migrating trip "${guestTrip.title}":`, tripError)
        result.errors.push(`Failed to migrate "${guestTrip.title}": ${tripError.message}`)
        result.success = false
        continue
      }

      // If trip has plan data, save it
      if (guestTrip.plan && newTrip) {
        const { error: planError } = await supabase
          .from('trip_plan')
          .insert({
            trip_id: newTrip.id,
            user_id: userId,
            plan_data: guestTrip.plan,
          })

        if (planError) {
          console.warn(`⚠️  Could not save plan for "${guestTrip.title}"`)
        }
      }

      console.log(`✅ Migrated trip: "${guestTrip.title}"`)
      result.migratedCount++
    } catch (error) {
      console.error(`❌ Unexpected error migrating trip:`, error)
      result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`)
      result.success = false
    }
  }

  return result
}

/**
 * Check if user has guest trips to migrate
 */
export function hasGuestTrips(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const stored = localStorage.getItem('guest-trip-store')
    if (!stored) return false

    const data = JSON.parse(stored)
    return (data.state?.trips?.length || 0) > 0
  } catch {
    return false
  }
}

/**
 * Get guest trips from localStorage
 */
export function getGuestTrips(): GuestTrip[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem('guest-trip-store')
    if (!stored) return []

    const data = JSON.parse(stored)
    return data.state?.trips || []
  } catch {
    return []
  }
}

/**
 * Clear guest trips from localStorage
 */
export function clearGuestTrips(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('guest-trip-store')
    console.log('🧹 Cleared guest trips from localStorage')
  } catch (error) {
    console.error('Error clearing guest trips:', error)
  }
}

/**
 * Auto-migrate guest trips on login
 * Call this after successful authentication
 */
export async function autoMigrateOnLogin(userId: string): Promise<void> {
  if (!hasGuestTrips()) {
    console.log('ℹ️  No guest trips to migrate')
    return
  }

  const guestTrips = getGuestTrips()
  console.log(`🔍 Found ${guestTrips.length} guest trips to migrate`)

  // Show loading toast
  const loadingToast = toast.loading(`Importing your ${guestTrips.length} trip(s)...`)

  try {
    const result = await migrateGuestTrips(userId, guestTrips)

    // Dismiss loading toast
    toast.dismiss(loadingToast)

    if (result.migratedCount > 0) {
      toast.success(
        `Successfully imported ${result.migratedCount} trip(s)!${
          result.skippedCount > 0 ? ` (${result.skippedCount} duplicate(s) skipped)` : ''
        }`,
        { duration: 5000 }
      )

      // Clear guest trips after successful migration
      clearGuestTrips()
    } else if (result.skippedCount > 0) {
      toast(`All ${result.skippedCount} trip(s) already exist in your account`, {
        duration: 4000,
      })
      clearGuestTrips()
    }

    if (result.errors.length > 0) {
      console.error('Migration errors:', result.errors)
      toast.error(`Some trips could not be imported. Check console for details.`, {
        duration: 5000,
      })
    }
  } catch (error) {
    toast.dismiss(loadingToast)
    console.error('Auto-migration failed:', error)
    toast.error('Failed to import your trips. Please try again later.', {
      duration: 5000,
    })
  }
}

/**
 * Manual migration trigger (for UI button)
 */
export async function triggerManualMigration(userId: string): Promise<MigrationResult> {
  const guestTrips = getGuestTrips()

  if (guestTrips.length === 0) {
    toast('No trips to import')
    return {
      success: true,
      migratedCount: 0,
      skippedCount: 0,
      errors: [],
    }
  }

  const loadingToast = toast.loading('Importing your trips...')

  try {
    const result = await migrateGuestTrips(userId, guestTrips)
    toast.dismiss(loadingToast)

    if (result.migratedCount > 0) {
      toast.success(`Imported ${result.migratedCount} trip(s)!`)
      clearGuestTrips()
    } else {
      toast('No new trips to import')
    }

    return result
  } catch (error) {
    toast.dismiss(loadingToast)
    toast.error('Failed to import trips')
    throw error
  }
}

