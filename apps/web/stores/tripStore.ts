import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import toast from 'react-hot-toast'

interface Trip {
  id: string
  title: string
  description?: string
  slug: string
  cover_image?: string
  status: 'draft' | 'published' | 'archived'
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
  posts?: any[]
  share_links?: any[]
}

interface TripState {
  // State
  trips: Trip[]
  currentTrip: Trip | null
  isLoading: boolean
  error: string | null
  searchQuery: string
  statusFilter: 'all' | 'draft' | 'published' | 'archived'
  viewMode: 'grid' | 'list'
  
  // Actions
  setTrips: (trips: Trip[]) => void
  addTrip: (trip: Trip) => void
  updateTrip: (id: string, updates: Partial<Trip>) => void
  deleteTrip: (id: string) => void
  setCurrentTrip: (trip: Trip | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setStatusFilter: (filter: 'all' | 'draft' | 'published' | 'archived') => void
  setViewMode: (mode: 'grid' | 'list') => void
  
  // Async actions
  fetchTrips: () => Promise<void>
  createTrip: (data: any) => Promise<Trip | null>
  publishTrip: (id: string) => Promise<void>
  archiveTrip: (id: string) => Promise<void>
  
  // Computed
  filteredTrips: () => Trip[]
  tripStats: () => {
    total: number
    published: number
    drafts: number
    archived: number
  }
}

export const useTripStore = create<TripState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      trips: [],
      currentTrip: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      statusFilter: 'all',
      viewMode: 'grid',

      // Basic setters
      setTrips: (trips) => set((state) => {
        state.trips = trips
      }),

      addTrip: (trip) => set((state) => {
        state.trips.unshift(trip)
      }),

      updateTrip: (id, updates) => set((state) => {
        const index = state.trips.findIndex(trip => trip.id === id)
        if (index !== -1) {
          state.trips[index] = { ...state.trips[index], ...updates }
        }
        
        // Update current trip if it's the same
        if (state.currentTrip?.id === id) {
          state.currentTrip = { ...state.currentTrip, ...updates }
        }
      }),

      deleteTrip: (id) => set((state) => {
        state.trips = state.trips.filter(trip => trip.id !== id)
        
        // Clear current trip if it's the deleted one
        if (state.currentTrip?.id === id) {
          state.currentTrip = null
        }
      }),

      setCurrentTrip: (trip) => set((state) => {
        state.currentTrip = trip
      }),

      setLoading: (loading) => set((state) => {
        state.isLoading = loading
      }),

      setError: (error) => set((state) => {
        state.error = error
      }),

      setSearchQuery: (query) => set((state) => {
        state.searchQuery = query
      }),

      setStatusFilter: (filter) => set((state) => {
        state.statusFilter = filter
      }),

      setViewMode: (mode) => set((state) => {
        state.viewMode = mode
      }),

      // Async actions
      fetchTrips: async () => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await fetch('/api/trips')
          if (!response.ok) {
            throw new Error('Failed to fetch trips')
          }
          
          const data = await response.json()
          
          set((state) => {
            state.trips = data.trips || []
            state.isLoading = false
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch trips'
          
          set((state) => {
            state.error = message
            state.isLoading = false
          })
          
          toast.error(message)
        }
      },

      createTrip: async (data) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await fetch('/api/trips', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create trip')
          }

          const result = await response.json()
          const newTrip = result.trip

          set((state) => {
            state.trips.unshift(newTrip)
            state.currentTrip = newTrip
            state.isLoading = false
          })

          toast.success('Trip created successfully!')
          return newTrip
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create trip'
          
          set((state) => {
            state.error = message
            state.isLoading = false
          })
          
          toast.error(message)
          return null
        }
      },

      publishTrip: async (id) => {
        try {
          const response = await fetch(`/api/trips/${id}/publish`, {
            method: 'POST',
          })

          if (!response.ok) {
            throw new Error('Failed to publish trip')
          }

          set((state) => {
            const index = state.trips.findIndex(trip => trip.id === id)
            if (index !== -1) {
              state.trips[index].status = 'published'
            }
            
            if (state.currentTrip?.id === id) {
              state.currentTrip.status = 'published'
            }
          })

          toast.success('Trip published successfully!')
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to publish trip'
          toast.error(message)
        }
      },

      archiveTrip: async (id) => {
        try {
          const response = await fetch(`/api/trips/${id}/archive`, {
            method: 'POST',
          })

          if (!response.ok) {
            throw new Error('Failed to archive trip')
          }

          set((state) => {
            const index = state.trips.findIndex(trip => trip.id === id)
            if (index !== -1) {
              state.trips[index].status = 'archived'
            }
            
            if (state.currentTrip?.id === id) {
              state.currentTrip.status = 'archived'
            }
          })

          toast.success('Trip archived successfully!')
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to archive trip'
          toast.error(message)
        }
      },

      // Computed values
      filteredTrips: () => {
        const { trips, searchQuery, statusFilter } = get()
        
        return trips.filter(trip => {
          const matchesSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               trip.description?.toLowerCase().includes(searchQuery.toLowerCase())
          const matchesStatus = statusFilter === 'all' || trip.status === statusFilter
          return matchesSearch && matchesStatus
        })
      },

      tripStats: () => {
        const { trips } = get()
        
        return {
          total: trips.length,
          published: trips.filter(t => t.status === 'published').length,
          drafts: trips.filter(t => t.status === 'draft').length,
          archived: trips.filter(t => t.status === 'archived').length,
        }
      },
    })),
    {
      name: 'trip-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist UI preferences, not data
        searchQuery: state.searchQuery,
        statusFilter: state.statusFilter,
        viewMode: state.viewMode,
      }),
    }
  )
)

// Selectors for better performance
export const useTripSelectors = () => {
  const trips = useTripStore(state => state.trips)
  const filteredTrips = useTripStore(state => state.filteredTrips())
  const tripStats = useTripStore(state => state.tripStats())
  const currentTrip = useTripStore(state => state.currentTrip)
  const isLoading = useTripStore(state => state.isLoading)
  const error = useTripStore(state => state.error)
  
  return {
    trips,
    filteredTrips,
    tripStats,
    currentTrip,
    isLoading,
    error,
  }
}

// Actions hook for cleaner component usage
export const useTripActions = () => {
  const {
    setTrips,
    addTrip,
    updateTrip,
    deleteTrip,
    setCurrentTrip,
    setLoading,
    setError,
    setSearchQuery,
    setStatusFilter,
    setViewMode,
    fetchTrips,
    createTrip,
    publishTrip,
    archiveTrip,
  } = useTripStore()

  return {
    setTrips,
    addTrip,
    updateTrip,
    deleteTrip,
    setCurrentTrip,
    setLoading,
    setError,
    setSearchQuery,
    setStatusFilter,
    setViewMode,
    fetchTrips,
    createTrip,
    publishTrip,
    archiveTrip,
  }
}
