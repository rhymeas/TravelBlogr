/**
 * Feature Flags
 *
 * Centralized feature flag management for gradual rollout.
 * Flags can be controlled via environment variables or localStorage (client-side).
 */

export const FEATURE_FLAGS = {
  // Smart POI System with GROQ orchestration
  SMART_POI_SYSTEM: process.env.NEXT_PUBLIC_ENABLE_SMART_POI === 'true',

  // GROQ POI validation
  GROQ_POI_VALIDATION: process.env.NEXT_PUBLIC_ENABLE_GROQ_VALIDATION === 'true',

  // Progressive loading
  PROGRESSIVE_LOADING: process.env.NEXT_PUBLIC_ENABLE_PROGRESSIVE_LOADING === 'true',

  // Batch processing for blog generation
  BATCH_BLOG_PROCESSING: process.env.NEXT_PUBLIC_ENABLE_BATCH_PROCESSING === 'true',

  // External APIs (Foursquare, Yelp, Wikidata, Nominatim)
  EXTERNAL_APIS: process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_APIS === 'true',
} as const

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] === true
}

// Helper to log feature flag status
export function logFeatureFlags() {
  console.log('🚩 Feature Flags:')
  Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
    console.log(`   ${key}: ${value ? '✅ ENABLED' : '❌ DISABLED'}`)
  })
}

// ============================================================================
// Client-Side Feature Flags (localStorage-based)
// ============================================================================

/**
 * Get Trip Planner version preference from localStorage
 * Returns true for V2, false for V1
 *
 * DEFAULT: V2 is now the default for all users (V2 Milestone Complete)
 */
export function useTripPlannerV2(): boolean {
  if (typeof window === 'undefined') return true // Default to V2 on server

  try {
    const stored = localStorage.getItem('useTripPlannerV2')
    // If not set, default to V2 (true)
    // If explicitly set to 'false', use V1
    // If set to 'true', use V2
    return stored === null ? true : stored === 'true'
  } catch (error) {
    console.error('Error reading trip planner version:', error)
    return true // Default to V2 on error
  }
}

/**
 * Set Trip Planner version preference
 */
export function setTripPlannerVersion(useV2: boolean): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('useTripPlannerV2', String(useV2))
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('tripPlannerVersionChanged'))
  } catch (error) {
    console.error('Error setting trip planner version:', error)
  }
}

/**
 * Toggle Trip Planner version
 * Returns the new state (true = V2, false = V1)
 */
export function toggleTripPlannerVersion(): boolean {
  const newValue = !useTripPlannerV2()
  setTripPlannerVersion(newValue)
  return newValue
}

