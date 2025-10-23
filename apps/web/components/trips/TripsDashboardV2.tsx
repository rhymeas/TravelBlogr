'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreateTripForm } from './CreateTripForm'
import { UnifiedTripCardV2 } from './UnifiedTripCardV2'
import { useTrips } from '@/lib/swr'
import { useTripStore, useTripSelectors, useTripActions } from '@/stores/tripStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Trip {
  id: string
  title: string
  description?: string
  slug: string
  cover_image?: string
  status: 'draft' | 'published' | 'archived'
  start_date?: string
  end_date?: string
  destination?: string
  duration_days?: number
  created_at: string
  updated_at: string
  posts?: any[]
  share_links?: any[]
  trip_stats?: {
    total_views: number
    unique_views: number
  }
}

interface TripsDashboardV2Props {
  userId: string
}

export function TripsDashboardV2({ userId }: TripsDashboardV2Props) {
  const router = useRouter()
  const { trips: swrTrips, isLoading: swrLoading, error: swrError, mutate } = useTrips(userId)
  const { filteredTrips, tripStats, isLoading: storeLoading } = useTripSelectors()
  const { setTrips, setSearchQuery, setStatusFilter, updateTrip, deleteTrip } = useTripActions()

  const searchQuery = useTripStore(state => state.searchQuery)
  const statusFilter = useTripStore(state => state.statusFilter)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'alphabetical'>('recent')

  useEffect(() => {
    if (swrTrips && swrTrips.length > 0) {
      setTrips(swrTrips)
    }
  }, [swrTrips, setTrips])

  useEffect(() => {
    if (swrError) {
      toast.error('Failed to load trips')
    }
  }, [swrError])

  const loading = swrLoading || storeLoading

  const handleTripCreated = (newTrip: Trip) => {
    mutate(
      (data: any) => ({
        ...data,
        trips: [newTrip, ...(data?.trips || [])]
      }),
      false
    )
    setShowCreateForm(false)
    toast.success('Trip created successfully!')
    setTimeout(() => mutate(), 1000)
  }

  const handleTripUpdated = (updatedTrip: Trip) => {
    updateTrip(updatedTrip.id, updatedTrip)
    mutate(
      (data: any) => ({
        ...data,
        trips: data?.trips?.map((trip: Trip) =>
          trip.id === updatedTrip.id ? updatedTrip : trip
        ) || []
      }),
      false
    )
  }

  const handleTripDeleted = (tripId: string) => {
    deleteTrip(tripId)
    mutate(
      (data: any) => ({
        ...data,
        trips: data?.trips?.filter((trip: Trip) => trip.id !== tripId) || []
      }),
      false
    )
    toast.success('Trip deleted successfully')
  }

  // Sort trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        // @ts-ignore - trip_stats is a joined relation
        return (b.trip_stats?.total_views || 0) - (a.trip_stats?.total_views || 0)
      case 'alphabetical':
        return a.title.localeCompare(b.title)
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  if (loading) {
    return <TripsDashboardSkeleton />
  }

  if (showCreateForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <CreateTripForm
          onSuccess={handleTripCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header - TripAdvisor Style */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My trips</h1>
              <p className="text-gray-600 mt-1">Plan, organize, and share your travel adventures</p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create a new trip
            </Button>
          </div>

          {/* AI Trip Builder CTA - TripAdvisor Style */}
          <Link href="/plan">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Build a trip with AI</h3>
                  <p className="text-sm text-gray-600">Get personalized itineraries in seconds</p>
                </div>
              </div>
              <Button variant="outline" className="bg-white hover:bg-gray-50">
                Try it now
              </Button>
            </div>
          </Link>
        </div>
      </div>

      {/* Filters & Search - TripAdvisor Style */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search your trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-gray-300 rounded-full"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black bg-white cursor-pointer"
                >
                  <option value="recent">Most recent</option>
                  <option value="popular">Most popular</option>
                  <option value="alphabetical">A-Z</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black bg-white cursor-pointer"
                >
                  <option value="all">All trips</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Grid - TripAdvisor/sleek Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedTrips.length === 0 ? (
          <EmptyState onCreateTrip={() => setShowCreateForm(true)} />
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {sortedTrips.length} {sortedTrips.length === 1 ? 'trip' : 'trips'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTrips.map((trip) => (
                <UnifiedTripCardV2
                  key={trip.id}
                  trip={trip}
                  context="my-trips"
                  onEdit={(tripId) => router.push(`/dashboard/trips/${tripId}`)}
                  onDelete={handleTripDeleted}
                  onShare={(tripId) => {
                    // TODO: Implement share modal
                    toast.success('Share feature coming soon!')
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Empty State
function EmptyState({ onCreateTrip }: { onCreateTrip: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Start planning your next adventure by creating your first trip
      </p>
      <Button onClick={onCreateTrip} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-full">
        <Plus className="h-5 w-5 mr-2" />
        Create your first trip
      </Button>
    </div>
  )
}

// Loading Skeleton
function TripsDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border">
              <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

