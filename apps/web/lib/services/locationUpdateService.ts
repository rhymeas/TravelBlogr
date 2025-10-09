/**
 * Location Update Service
 * Intelligently updates location data without overloading the system
 */

import { createClient } from '@supabase/supabase-js'

const UPDATE_THRESHOLD = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
const RATE_LIMIT_DELAY = 2000 // 2 seconds between updates

interface UpdateStatus {
  needsUpdate: boolean
  lastUpdate: Date | null
  daysOld: number
  missingData: string[]
}

/**
 * Check if location needs update
 */
export function checkLocationNeedsUpdate(location: any): UpdateStatus {
  const missingData: string[] = []
  
  // Check for missing or outdated data
  if (!location.description || location.description.length < 50) {
    missingData.push('description')
  }
  
  if (!location.gallery_images || location.gallery_images.length < 4) {
    missingData.push('images')
  }
  
  if (!location.travel_guide_url) {
    missingData.push('travel_guide')
  }
  
  if (!location.population || !location.timezone) {
    missingData.push('metadata')
  }
  
  // Check activities for missing descriptions
  if (location.activities) {
    const activitiesWithoutDesc = location.activities.filter(
      (a: any) => !a.description || a.description.length < 20
    )
    if (activitiesWithoutDesc.length > 0) {
      missingData.push('activity_descriptions')
    }
  }
  
  // Check last update time
  const lastUpdate = location.last_data_refresh 
    ? new Date(location.last_data_refresh)
    : null
  
  const daysOld = lastUpdate 
    ? Math.floor((Date.now() - lastUpdate.getTime()) / (24 * 60 * 60 * 1000))
    : 999
  
  const needsUpdate = missingData.length > 0 || daysOld > 7
  
  return {
    needsUpdate,
    lastUpdate,
    daysOld,
    missingData
  }
}

/**
 * Update location data in background
 */
export async function updateLocationInBackground(
  locationId: string,
  locationName: string
): Promise<boolean> {
  try {
    console.log(`🔄 Background update started for: ${locationName}`)
    
    // Call auto-fill API with update flag
    const response = await fetch('/api/admin/auto-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        locationName,
        updateExisting: true,
        locationId 
      })
    })
    
    if (response.ok) {
      console.log(`✅ Background update completed for: ${locationName}`)
      return true
    } else {
      console.error(`❌ Background update failed for: ${locationName}`)
      return false
    }
  } catch (error) {
    console.error('Background update error:', error)
    return false
  }
}

/**
 * Queue system to prevent overload
 */
class UpdateQueue {
  private queue: Array<{ locationId: string; locationName: string }> = []
  private processing = false
  private lastUpdate = 0
  
  add(locationId: string, locationName: string) {
    // Check if already in queue
    if (this.queue.some(item => item.locationId === locationId)) {
      return
    }
    
    this.queue.push({ locationId, locationName })
    this.process()
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) {
      return
    }
    
    this.processing = true
    
    while (this.queue.length > 0) {
      // Rate limiting: wait 2 seconds between updates
      const timeSinceLastUpdate = Date.now() - this.lastUpdate
      if (timeSinceLastUpdate < RATE_LIMIT_DELAY) {
        await new Promise(resolve => 
          setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastUpdate)
        )
      }
      
      const item = this.queue.shift()
      if (item) {
        await updateLocationInBackground(item.locationId, item.locationName)
        this.lastUpdate = Date.now()
      }
    }
    
    this.processing = false
  }
}

export const updateQueue = new UpdateQueue()

/**
 * Smart update: Only update if needed
 */
export function scheduleSmartUpdate(location: any) {
  const status = checkLocationNeedsUpdate(location)
  
  if (status.needsUpdate) {
    console.log(`📋 Scheduling update for ${location.name}:`, {
      daysOld: status.daysOld,
      missingData: status.missingData
    })
    
    // Add to queue (will be processed with rate limiting)
    updateQueue.add(location.id, location.name)
    
    return status
  }
  
  return null
}

/**
 * Batch update multiple locations (admin feature)
 */
export async function batchUpdateLocations(
  locations: Array<{ id: string; name: string }>
): Promise<void> {
  console.log(`🔄 Batch update started for ${locations.length} locations`)
  
  for (const location of locations) {
    updateQueue.add(location.id, location.name)
  }
}

/**
 * Get update statistics
 */
export function getUpdateStats(locations: any[]): {
  total: number
  needsUpdate: number
  upToDate: number
  stale: number
  missingData: Record<string, number>
} {
  const stats = {
    total: locations.length,
    needsUpdate: 0,
    upToDate: 0,
    stale: 0,
    missingData: {
      description: 0,
      images: 0,
      travel_guide: 0,
      metadata: 0,
      activity_descriptions: 0
    }
  }
  
  locations.forEach(location => {
    const status = checkLocationNeedsUpdate(location)
    
    if (status.needsUpdate) {
      stats.needsUpdate++
      
      if (status.daysOld > 30) {
        stats.stale++
      }
      
      status.missingData.forEach(item => {
        if (item in stats.missingData) {
          stats.missingData[item as keyof typeof stats.missingData]++
        }
      })
    } else {
      stats.upToDate++
    }
  })
  
  return stats
}

/**
 * Fix activity descriptions for existing location
 */
export async function fixActivityDescriptions(locationId: string, locationName: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get activities without descriptions
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('location_id', locationId)
    .or('description.is.null,description.eq.')
  
  if (!activities || activities.length === 0) {
    return 0
  }
  
  // Generate descriptions
  const updates = activities.map(activity => {
    const category = activity.category || 'attraction'
    const name = activity.name
    
    let description = ''
    
    if (category === 'museum') {
      description = `Visit ${name}, a museum showcasing local culture and history. A must-see attraction for art and history enthusiasts.`
    } else if (category === 'viewpoint') {
      description = `Enjoy breathtaking views at ${name}. Perfect spot for photography and taking in the scenery.`
    } else if (category === 'attraction') {
      description = `Explore ${name}, one of the popular attractions in ${locationName}. Great for sightseeing and experiencing local culture.`
    } else if (category === 'park') {
      description = `Relax and unwind at ${name}, a beautiful green space perfect for walks and outdoor activities.`
    } else {
      description = `Discover ${name}, a notable ${category} in ${locationName}. Worth adding to your plan.`
    }
    
    return {
      id: activity.id,
      description
    }
  })
  
  // Update in batches
  for (const update of updates) {
    await supabase
      .from('activities')
      .update({ description: update.description })
      .eq('id', update.id)
  }
  
  console.log(`✅ Fixed ${updates.length} activity descriptions for ${locationName}`)
  return updates.length
}

