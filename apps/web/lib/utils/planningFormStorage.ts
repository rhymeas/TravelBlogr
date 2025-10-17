/**
 * Planning Form Storage Utility
 * 
 * Persists planning form data to localStorage so users don't lose their input
 * when they need to sign in/up during the planning flow.
 */

const STORAGE_KEY = 'travelblogr_planning_form_data'
const STORAGE_TIMESTAMP_KEY = 'travelblogr_planning_form_timestamp'
const EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 hours

export interface PlanningFormData {
  locations: Array<{
    value: string
    label?: string
    coordinates?: { lat: number; lng: number }
  }>
  startDate: string | null
  endDate: string | null
  proMode: boolean
  preferences?: {
    budget?: string
    travelStyle?: string
    interests?: string[]
  }
}

/**
 * Save planning form data to localStorage
 */
export function savePlanningFormData(data: PlanningFormData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString())
    console.log('✅ Planning form data saved to localStorage')
  } catch (error) {
    console.error('Failed to save planning form data:', error)
  }
}

/**
 * Get planning form data from localStorage
 * Returns null if expired or not found
 */
export function getPlanningFormData(): PlanningFormData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY)

    if (!data || !timestamp) {
      return null
    }

    // Check if data has expired
    const age = Date.now() - parseInt(timestamp, 10)
    if (age > EXPIRY_TIME) {
      clearPlanningFormData()
      return null
    }

    return JSON.parse(data) as PlanningFormData
  } catch (error) {
    console.error('Failed to get planning form data:', error)
    return null
  }
}

/**
 * Clear planning form data from localStorage
 */
export function clearPlanningFormData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY)
    console.log('🗑️ Planning form data cleared from localStorage')
  } catch (error) {
    console.error('Failed to clear planning form data:', error)
  }
}

/**
 * Check if there's saved planning form data
 */
export function hasSavedPlanningFormData(): boolean {
  return getPlanningFormData() !== null
}

/**
 * Get age of saved data in milliseconds
 */
export function getPlanningFormDataAge(): number | null {
  try {
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY)
    if (!timestamp) return null
    return Date.now() - parseInt(timestamp, 10)
  } catch {
    return null
  }
}

