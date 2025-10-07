/**
 * Guest Trip Store
 * 
 * Manages trips for unauthenticated users using localStorage.
 * Features:
 * - 3 trip limit for guests
 * - Session ID generation
 * - CRUD operations
 * - Migration to user account on login
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'

export interface GuestTrip {
  id: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  destinations: string[]
  interests?: string[]
  budget?: 'budget' | 'moderate' | 'luxury'
  itinerary?: any // Generated itinerary data
  createdAt: string
  updatedAt: string
}

interface GuestTripState {
  // Session
  sessionId: string
  
  // Trips
  trips: GuestTrip[]
  currentTrip: GuestTrip | null
  
  // Limits
  maxTrips: number
  
  // Actions
  initSession: () => void
  createTrip: (trip: Omit<GuestTrip, 'id' | 'createdAt' | 'updatedAt'>) => GuestTrip | null
  updateTrip: (id: string, updates: Partial<GuestTrip>) => void
  deleteTrip: (id: string) => void
  getTrip: (id: string) => GuestTrip | null
  setCurrentTrip: (id: string | null) => void
  canCreateTrip: () => boolean
  getRemainingSlots: () => number
  clearAllTrips: () => void
  exportTrips: () => GuestTrip[]
}

export const useGuestTripStore = create<GuestTripState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      sessionId: '',
      trips: [],
      currentTrip: null,
      maxTrips: 3,

      // Initialize session
      initSession: () => {
        const state = get()
        if (!state.sessionId) {
          set((draft) => {
            draft.sessionId = `guest_${nanoid(16)}_${Date.now()}`
          })
        }
      },

      // Create new trip
      createTrip: (tripData) => {
        const state = get()
        
        // Check limit
        if (state.trips.length >= state.maxTrips) {
          console.warn('Guest trip limit reached')
          return null
        }

        const newTrip: GuestTrip = {
          ...tripData,
          id: nanoid(12),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set((draft) => {
          draft.trips.push(newTrip)
          draft.currentTrip = newTrip
        })

        return newTrip
      },

      // Update trip
      updateTrip: (id, updates) => {
        set((draft) => {
          const index = draft.trips.findIndex(t => t.id === id)
          if (index !== -1) {
            draft.trips[index] = {
              ...draft.trips[index],
              ...updates,
              updatedAt: new Date().toISOString(),
            }
            
            // Update current trip if it's the same
            if (draft.currentTrip?.id === id) {
              draft.currentTrip = draft.trips[index]
            }
          }
        })
      },

      // Delete trip
      deleteTrip: (id) => {
        set((draft) => {
          draft.trips = draft.trips.filter(t => t.id !== id)
          
          // Clear current trip if deleted
          if (draft.currentTrip?.id === id) {
            draft.currentTrip = null
          }
        })
      },

      // Get trip by ID
      getTrip: (id) => {
        return get().trips.find(t => t.id === id) || null
      },

      // Set current trip
      setCurrentTrip: (id) => {
        if (id === null) {
          set((draft) => {
            draft.currentTrip = null
          })
        } else {
          const trip = get().getTrip(id)
          if (trip) {
            set((draft) => {
              draft.currentTrip = trip
            })
          }
        }
      },

      // Check if can create trip
      canCreateTrip: () => {
        return get().trips.length < get().maxTrips
      },

      // Get remaining slots
      getRemainingSlots: () => {
        return get().maxTrips - get().trips.length
      },

      // Clear all trips (used after migration)
      clearAllTrips: () => {
        set((draft) => {
          draft.trips = []
          draft.currentTrip = null
        })
      },

      // Export trips for migration
      exportTrips: () => {
        return get().trips
      },
    })),
    {
      name: 'guest-trip-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        trips: state.trips,
        currentTrip: state.currentTrip,
      }),
    }
  )
)

// Selectors
export const useGuestTripSelectors = () => {
  const trips = useGuestTripStore(state => state.trips)
  const currentTrip = useGuestTripStore(state => state.currentTrip)
  const canCreateTrip = useGuestTripStore(state => state.canCreateTrip())
  const remainingSlots = useGuestTripStore(state => state.getRemainingSlots())
  const sessionId = useGuestTripStore(state => state.sessionId)
  
  return {
    trips,
    currentTrip,
    canCreateTrip,
    remainingSlots,
    sessionId,
    tripCount: trips.length,
  }
}

// Actions
export const useGuestTripActions = () => {
  const initSession = useGuestTripStore(state => state.initSession)
  const createTrip = useGuestTripStore(state => state.createTrip)
  const updateTrip = useGuestTripStore(state => state.updateTrip)
  const deleteTrip = useGuestTripStore(state => state.deleteTrip)
  const getTrip = useGuestTripStore(state => state.getTrip)
  const setCurrentTrip = useGuestTripStore(state => state.setCurrentTrip)
  const clearAllTrips = useGuestTripStore(state => state.clearAllTrips)
  const exportTrips = useGuestTripStore(state => state.exportTrips)
  
  return {
    initSession,
    createTrip,
    updateTrip,
    deleteTrip,
    getTrip,
    setCurrentTrip,
    clearAllTrips,
    exportTrips,
  }
}

// Utility: Check if user is guest
export const isGuestUser = () => {
  if (typeof window === 'undefined') return false
  
  const stored = localStorage.getItem('guest-trip-store')
  if (!stored) return false
  
  try {
    const data = JSON.parse(stored)
    return data.state?.trips?.length > 0
  } catch {
    return false
  }
}

// Utility: Get guest trip count
export const getGuestTripCount = () => {
  if (typeof window === 'undefined') return 0
  
  const stored = localStorage.getItem('guest-trip-store')
  if (!stored) return 0
  
  try {
    const data = JSON.parse(stored)
    return data.state?.trips?.length || 0
  } catch {
    return 0
  }
}

