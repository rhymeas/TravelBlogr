'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Search, Filter, MapPin, Calendar, Users, Eye, Star, Plane, Heart } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import Fuse from 'fuse.js'
import { useInView } from 'react-intersection-observer'
import toast from 'react-hot-toast'
import { DuplicateTripButton } from '@/components/trips/DuplicateTripButton'
import { TripLikeButton } from '@/components/trips/TripLikeButton'
import { TripSaveButton } from '@/components/trips/TripSaveButton'

interface Trip {
  id: string
  title: string
  description?: string
  destination?: string
  start_date?: string
  end_date?: string
  is_public: boolean
  cover_image_url?: string
  created_at: string
  user_id: string
  user?: {
    id: string
    full_name: string
    username?: string
    avatar_url?: string
  }
  stats?: {
    likes: number
    views: number
    posts: number
    media_count: number
  }
  tags?: string[]
}

interface TripDiscoveryProps {
  currentUserId: string
  className?: string
}

interface Filters {
  search: string
  destination: string
  duration: string
  sortBy: 'newest' | 'popular' | 'trending' | 'most_liked'
  tags: string[]
}

export function TripDiscovery({ currentUserId, className = '' }: TripDiscoveryProps) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    destination: '',
    duration: '',
    sortBy: 'newest',
    tags: []
  })
  const [popularDestinations, setPopularDestinations] = useState<string[]>([])
  const [popularTags, setPopularTags] = useState<string[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const { ref: loadMoreRef, inView } = useInView()
  const supabase = createClientSupabase()

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(trips, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'destination', weight: 0.2 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true
    })
  }, [trips])

  useEffect(() => {
    loadTrips(true)
    loadPopularData()
  }, [])

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadTrips(false)
    }
  }, [inView, hasMore, loading])

  useEffect(() => {
    applyFilters()
  }, [trips, filters])

  const loadTrips = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(0)
        setTrips([])
      }

      const currentPage = reset ? 0 : page
      const limit = 20
      const offset = currentPage * limit

      let query = supabase
        .from('trips')
        .select(`
          *,
          user:users!user_id(id, full_name, username, avatar_url)
        `)
        .eq('is_public', true)
        .neq('user_id', currentUserId) // Don't show own trips
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) throw error

      // Load stats for each trip
      const tripsWithStats = await Promise.all(
        (data || []).map(async (trip) => {
          const [likesResult, viewsResult, postsResult, mediaResult] = await Promise.all([
            supabase.from('trip_likes').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id),
            supabase.from('trip_views').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id),
            supabase.from('posts').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id),
            supabase.from('media_files').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id)
          ])

          return {
            ...trip,
            stats: {
              likes: likesResult.count || 0,
              views: viewsResult.count || 0,
              posts: postsResult.count || 0,
              media_count: mediaResult.count || 0
            }
          }
        })
      )

      if (reset) {
        setTrips(tripsWithStats)
      } else {
        setTrips(prev => [...prev, ...tripsWithStats])
      }

      setHasMore(tripsWithStats.length === limit)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('Error loading trips:', error)
      toast.error('Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  const loadPopularData = async () => {
    try {
      // Load popular destinations
      const { data: destinationData } = await supabase
        .from('trips')
        .select('destination')
        .eq('is_public', true)
        .not('destination', 'is', null)

      const destinations = destinationData?.map(t => t.destination).filter(Boolean) || []
      const destinationCounts = destinations.reduce((acc, dest) => {
        acc[dest] = (acc[dest] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const sortedDestinations = Object.entries(destinationCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([dest]) => dest)

      setPopularDestinations(sortedDestinations)

      // Load popular tags (mock for now - would need tags table)
      setPopularTags(['adventure', 'culture', 'food', 'nature', 'photography', 'backpacking', 'luxury', 'family'])
    } catch (error) {
      console.error('Error loading popular data:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...trips]

    // Apply search filter
    if (filters.search.trim()) {
      const searchResults = fuse.search(filters.search)
      filtered = searchResults.map(result => result.item)
    }

    // Apply destination filter
    if (filters.destination) {
      filtered = filtered.filter(trip => 
        trip.destination?.toLowerCase().includes(filters.destination.toLowerCase())
      )
    }

    // Apply duration filter
    if (filters.duration) {
      filtered = filtered.filter(trip => {
        if (!trip.start_date || !trip.end_date) return true
        
        const start = new Date(trip.start_date)
        const end = new Date(trip.end_date)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (filters.duration) {
          case 'short': return days <= 7
          case 'medium': return days > 7 && days <= 30
          case 'long': return days > 30
          default: return true
        }
      })
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(trip => 
        trip.tags?.some(tag => filters.tags.includes(tag))
      )
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0))
        break
      case 'trending':
        // Sort by recent activity (likes + views in last 7 days)
        filtered.sort((a, b) => {
          const aScore = (a.stats?.likes || 0) + (a.stats?.views || 0)
          const bScore = (b.stats?.likes || 0) + (b.stats?.views || 0)
          return bScore - aScore
        })
        break
      case 'most_liked':
        filtered.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0))
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredTrips(filtered)
  }



  const handleViewTrip = async (tripId: string) => {
    try {
      // Record view
      await supabase
        .from('trip_views')
        .insert({
          trip_id: tripId,
          user_id: currentUserId
        })

      // Update local state
      setTrips(prev => prev.map(trip => 
        trip.id === tripId 
          ? { ...trip, stats: { ...trip.stats!, views: trip.stats!.views + 1 } }
          : trip
      ))
    } catch (error) {
      console.error('Error recording trip view:', error)
    }
  }

  const formatDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    if (days === 1) return '1 day'
    if (days < 7) return `${days} days`
    if (days < 30) return `${Math.ceil(days / 7)} weeks`
    return `${Math.ceil(days / 30)} months`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search trips, destinations, or experiences..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <Select
              value={filters.destination}
              onValueChange={(value: string) => setFilters(prev => ({ ...prev, destination: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Any destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any destination</SelectItem>
                {popularDestinations.map(dest => (
                  <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.duration}
              onValueChange={(value: string) => setFilters(prev => ({ ...prev, duration: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Any duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any duration</SelectItem>
                <SelectItem value="short">1-7 days</SelectItem>
                <SelectItem value="medium">1-4 weeks</SelectItem>
                <SelectItem value="long">1+ months</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.sortBy} 
              onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most viewed</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="most_liked">Most liked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Popular Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Popular tags:</span>
            {popularTags.map(tag => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    tags: prev.tags.includes(tag)
                      ? prev.tags.filter(t => t !== tag)
                      : [...prev.tags, tag]
                  }))
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading && trips.length === 0 ? (
          // Loading skeleton
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg overflow-hidden">
              <div className="animate-pulse">
                <div className="flex gap-4 p-6">
                  <div className="w-48 flex-shrink-0">
                    <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                {/* Trip Cover Image */}
                <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {trip.cover_image_url ? (
                    <img
                      src={trip.cover_image_url}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Plane className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Trip Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{trip.title}</h3>
                      {trip.destination && (
                        <div className="flex items-center gap-1 text-gray-600 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span>{trip.destination}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <TripLikeButton
                        tripId={trip.id}
                        initialLikeCount={trip.stats?.likes || 0}
                        variant="ghost"
                        size="sm"
                        showCount={false}
                      />
                      <TripSaveButton
                        tripId={trip.id}
                        variant="ghost"
                        size="sm"
                        showCount={false}
                      />
                    </div>
                  </div>

                  {trip.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{trip.description}</p>
                  )}

                  {/* Trip Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    {trip.start_date && trip.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDuration(trip.start_date, trip.end_date)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{trip.stats?.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{trip.stats?.likes || 0} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{trip.stats?.posts || 0} posts</span>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={trip.user?.avatar_url} alt={trip.user?.full_name} />
                        <AvatarFallback className="text-xs">
                          {trip.user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">by {trip.user?.full_name}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <DuplicateTripButton
                        tripId={trip.id}
                        tripTitle={trip.title}
                        variant="outline"
                        size="sm"
                        showIcon={false}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTrip(trip.id)}
                      >
                        View Trip
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Load More Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  )
}
