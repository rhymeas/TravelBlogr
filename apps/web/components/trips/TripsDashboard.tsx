'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Grid, List, Globe, FileText, Lock, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { CreateTripForm } from './CreateTripForm'
import { TripCard } from './TripCard'
import { TripList } from './TripList'
import { EmptyState } from './EmptyState'
import { useTrips } from '@/lib/swr'
import { useTripStore, useTripSelectors, useTripActions } from '@/stores/tripStore'
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

interface TripsDashboardProps {
  userId: string
}

export function TripsDashboard({ userId }: TripsDashboardProps) {
  // Use SWR for data fetching with caching
  const { trips: swrTrips, isLoading: swrLoading, error: swrError, mutate } = useTrips(userId)

  // Use Zustand for state management
  const { filteredTrips, tripStats, isLoading: storeLoading } = useTripSelectors()
  const {
    setTrips,
    setSearchQuery,
    setStatusFilter,
    setViewMode,
    updateTrip,
    deleteTrip
  } = useTripActions()

  const searchQuery = useTripStore(state => state.searchQuery)
  const statusFilter = useTripStore(state => state.statusFilter)
  const viewMode = useTripStore(state => state.viewMode)

  const [showCreateForm, setShowCreateForm] = useState(false)

  // Sync SWR data with Zustand store
  useEffect(() => {
    if (swrTrips && swrTrips.length > 0) {
      setTrips(swrTrips)
    }
  }, [swrTrips, setTrips])

  // Handle SWR errors
  useEffect(() => {
    if (swrError) {
      toast.error('Failed to load trips')
    }
  }, [swrError])

  const loading = swrLoading || storeLoading

  const handleTripCreated = (newTrip: Trip) => {
    // Optimistically update both SWR cache and Zustand store
    mutate(
      (data: any) => ({
        ...data,
        trips: [newTrip, ...(data?.trips || [])]
      }),
      false // Don't revalidate immediately
    )

    setShowCreateForm(false)
    toast.success('Trip created successfully!')

    // Revalidate after a short delay to ensure consistency
    setTimeout(() => mutate(), 1000)
  }

  const handleTripUpdated = (updatedTrip: Trip) => {
    // Update Zustand store
    updateTrip(updatedTrip.id, updatedTrip)

    // Update SWR cache
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
    // Update Zustand store
    deleteTrip(tripId)

    // Update SWR cache
    mutate(
      (data: any) => ({
        ...data,
        trips: data?.trips?.filter((trip: Trip) => trip.id !== tripId) || []
      }),
      false
    )

    toast.success('Trip deleted successfully')
  }

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

  // Calculate stats
  const totalTrips = filteredTrips.length
  const publishedCount = filteredTrips.filter(t => t.status === 'published').length
  const draftCount = filteredTrips.filter(t => t.status === 'draft').length
  const totalShareLinks = filteredTrips.reduce((sum, t) => sum + (t.share_links?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalTrips}</p>
              <p className="text-sm text-gray-600">Total Trips</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Globe className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{publishedCount}</p>
              <p className="text-sm text-gray-600">Published</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{draftCount}</p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Share2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalShareLinks}</p>
              <p className="text-sm text-gray-600">Share Links</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Create Trip Button */}
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Trips Display */}
      {filteredTrips.length === 0 ? (
        <EmptyState
          title={searchQuery || statusFilter !== 'all' ? 'No trips found' : 'No trips yet'}
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first trip to start sharing your travel stories'
          }
          action={
            !searchQuery && statusFilter === 'all' ? (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Trip
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onUpdate={handleTripUpdated}
              onDelete={handleTripDeleted}
            />
          ))}
        </div>
      ) : (
        <TripList
          trips={filteredTrips}
          onUpdate={handleTripUpdated}
          onDelete={handleTripDeleted}
        />
      )}

      {/* Stats */}
      {tripStats.total > 0 && (
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{tripStats.total}</div>
              <div className="text-sm text-gray-600">Total Trips</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {tripStats.published}
              </div>
              <div className="text-sm text-gray-600">Published</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {tripStats.drafts}
              </div>
              <div className="text-sm text-gray-600">Drafts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {swrTrips?.reduce((acc: number, trip: Trip) => acc + (trip.share_links?.length || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Share Links</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Skeleton component for loading state
function TripsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
