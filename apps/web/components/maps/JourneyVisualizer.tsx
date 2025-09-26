'use client'

import { useState, useEffect, useMemo } from 'react'
import { InteractiveMap } from './InteractiveMap'
import { MapboxMap } from './MapboxMap'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Slider } from '@/components/ui/Slider'
import { Badge } from '@/components/ui/Badge'
import { Play, Pause, SkipBack, SkipForward, Map, Calendar, Clock, Route, MapPin } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import * as turf from '@turf/turf'

interface LocationPoint {
  id: string
  lat: number
  lng: number
  title?: string
  description?: string
  timestamp?: string
  type?: 'waypoint' | 'photo' | 'accommodation' | 'restaurant' | 'attraction'
  metadata?: any
}

interface JourneyVisualizerProps {
  tripId: string
  userId: string
  className?: string
}

interface JourneyStats {
  totalDistance: number
  totalDuration: number
  averageSpeed: number
  countries: string[]
  cities: string[]
  startDate: string
  endDate: string
}

export function JourneyVisualizer({
  tripId,
  userId,
  className = ''
}: JourneyVisualizerProps) {
  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [mapProvider, setMapProvider] = useState<'leaflet' | 'mapbox'>('leaflet')
  const [playbackMode, setPlaybackMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [autoPlay, setAutoPlay] = useState(false)
  const [journeyStats, setJourneyStats] = useState<JourneyStats | null>(null)
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100])
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['waypoint', 'photo', 'accommodation', 'restaurant', 'attraction'])

  const supabase = createClientSupabase()

  // Load journey data
  useEffect(() => {
    loadJourneyData()
  }, [tripId])

  const loadJourneyData = async () => {
    try {
      setLoading(true)

      // Load locations from multiple sources
      const [postsResult, locationsResult, mediaResult] = await Promise.all([
        // Trip posts with locations
        supabase
          .from('posts')
          .select('*')
          .eq('trip_id', tripId)
          .not('location', 'is', null)
          .order('created_at'),
        
        // Live location tracking data
        supabase
          .from('live_locations')
          .select('*')
          .eq('trip_id', tripId)
          .order('timestamp'),
        
        // Media files with location metadata
        supabase
          .from('media_files')
          .select('*')
          .eq('trip_id', tripId)
          .not('metadata->location', 'is', null)
          .order('created_at')
      ])

      const allLocations: LocationPoint[] = []

      // Process posts
      if (postsResult.data) {
        postsResult.data.forEach(post => {
          if (post.location) {
            allLocations.push({
              id: `post-${post.id}`,
              lat: post.location.lat,
              lng: post.location.lng,
              title: post.title,
              description: post.content?.substring(0, 100) + '...',
              timestamp: post.created_at,
              type: 'waypoint',
              metadata: { source: 'post', postId: post.id }
            })
          }
        })
      }

      // Process live locations
      if (locationsResult.data) {
        locationsResult.data.forEach(location => {
          allLocations.push({
            id: `location-${location.id}`,
            lat: location.latitude,
            lng: location.longitude,
            title: 'Tracked Location',
            timestamp: location.timestamp,
            type: 'waypoint',
            metadata: { 
              source: 'tracking',
              accuracy: location.accuracy,
              speed: location.speed,
              heading: location.heading
            }
          })
        })
      }

      // Process media files
      if (mediaResult.data) {
        mediaResult.data.forEach(media => {
          if (media.metadata?.location) {
            allLocations.push({
              id: `media-${media.id}`,
              lat: media.metadata.location.lat,
              lng: media.metadata.location.lng,
              title: media.title || 'Photo Location',
              description: media.caption,
              timestamp: media.created_at,
              type: 'photo',
              metadata: { source: 'media', mediaId: media.id, url: media.url }
            })
          }
        })
      }

      // Sort by timestamp
      allLocations.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      })

      setLocations(allLocations)
      calculateJourneyStats(allLocations)
    } catch (error) {
      console.error('Error loading journey data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate journey statistics
  const calculateJourneyStats = (locations: LocationPoint[]) => {
    if (locations.length < 2) return

    let totalDistance = 0
    const countries = new Set<string>()
    const cities = new Set<string>()

    // Calculate total distance
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1]
      const curr = locations[i]
      const from = turf.point([prev.lng, prev.lat])
      const to = turf.point([curr.lng, curr.lat])
      totalDistance += turf.distance(from, to, { units: 'kilometers' })
    }

    // Calculate duration
    const startTime = locations[0].timestamp ? new Date(locations[0].timestamp) : new Date()
    const endTime = locations[locations.length - 1].timestamp ? new Date(locations[locations.length - 1].timestamp) : new Date()
    const totalDuration = endTime.getTime() - startTime.getTime()

    // Calculate average speed (km/h)
    const averageSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / (1000 * 60 * 60))) : 0

    setJourneyStats({
      totalDistance,
      totalDuration,
      averageSpeed,
      countries: Array.from(countries),
      cities: Array.from(cities),
      startDate: startTime.toISOString(),
      endDate: endTime.toISOString()
    })
  }

  // Filter locations based on time range and selected types
  const filteredLocations = useMemo(() => {
    if (locations.length === 0) return []

    const startIndex = Math.floor((timeRange[0] / 100) * locations.length)
    const endIndex = Math.ceil((timeRange[1] / 100) * locations.length)
    
    return locations
      .slice(startIndex, endIndex)
      .filter(location => selectedTypes.includes(location.type || 'waypoint'))
  }, [locations, timeRange, selectedTypes])

  // Playback locations (for animation)
  const playbackLocations = useMemo(() => {
    if (!playbackMode) return filteredLocations
    return filteredLocations.slice(0, currentIndex + 1)
  }, [filteredLocations, playbackMode, currentIndex])

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && playbackMode && currentIndex < filteredLocations.length - 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => Math.min(prev + 1, filteredLocations.length - 1))
      }, 1000 / playbackSpeed)

      return () => clearInterval(interval)
    }
  }, [autoPlay, playbackMode, currentIndex, filteredLocations.length, playbackSpeed])

  // Format duration
  const formatDuration = (milliseconds: number): string => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
      return `${minutes}m`
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading journey data...</p>
        </div>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Journey Data</h3>
        <p className="text-gray-600">
          Start adding posts with locations or enable location tracking to visualize your journey.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Journey Statistics */}
      {journeyStats && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Route className="h-5 w-5" />
            Journey Overview
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {journeyStats.totalDistance.toFixed(0)} km
              </div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatDuration(journeyStats.totalDuration)}
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {journeyStats.averageSpeed.toFixed(1)} km/h
              </div>
              <div className="text-sm text-gray-600">Avg Speed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {locations.length}
              </div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Map Provider */}
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <Select value={mapProvider} onValueChange={(value: any) => setMapProvider(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leaflet">Leaflet</SelectItem>
                <SelectItem value="mapbox">Mapbox</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Playback Mode */}
          <div className="flex items-center gap-2">
            <Button
              variant={playbackMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPlaybackMode(!playbackMode)
                setCurrentIndex(0)
                setAutoPlay(false)
              }}
            >
              {playbackMode ? 'Exit Playback' : 'Playback Mode'}
            </Button>
          </div>

          {/* Location Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {['waypoint', 'photo', 'accommodation', 'restaurant', 'attraction'].map(type => (
              <Badge
                key={type}
                variant={selectedTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedTypes(prev => 
                    prev.includes(type) 
                      ? prev.filter(t => t !== type)
                      : [...prev, type]
                  )
                }}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Time Range Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Time Range</span>
            <span>{timeRange[0]}% - {timeRange[1]}%</span>
          </div>
          <Slider
            value={timeRange}
            onValueChange={setTimeRange}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Playback Controls */}
        {playbackMode && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(0)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoPlay(!autoPlay)}
            >
              {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(filteredLocations.length - 1)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm">Speed:</span>
              <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Slider
                value={[currentIndex]}
                onValueChange={([value]) => setCurrentIndex(value)}
                max={filteredLocations.length - 1}
                step={1}
                className="w-full"
              />
            </div>

            <span className="text-sm text-gray-600">
              {currentIndex + 1} / {filteredLocations.length}
            </span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {mapProvider === 'leaflet' ? (
          <InteractiveMap
            locations={playbackLocations}
            height="600px"
            showRoute={true}
            showControls={true}
            allowAddPoints={false}
            className="w-full"
          />
        ) : (
          <MapboxMap
            locations={playbackLocations}
            height="600px"
            showRoute={true}
            showControls={true}
            allowAddPoints={false}
            className="w-full"
          />
        )}
      </div>

      {/* Current Location Info */}
      {playbackMode && filteredLocations[currentIndex] && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Current Location</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium">{filteredLocations[currentIndex].title}</h5>
              {filteredLocations[currentIndex].description && (
                <p className="text-sm text-gray-600 mt-1">
                  {filteredLocations[currentIndex].description}
                </p>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              <div>Type: {filteredLocations[currentIndex].type}</div>
              <div>
                Coordinates: {filteredLocations[currentIndex].lat.toFixed(6)}, {filteredLocations[currentIndex].lng.toFixed(6)}
              </div>
              {filteredLocations[currentIndex].timestamp && (
                <div>
                  Time: {new Date(filteredLocations[currentIndex].timestamp!).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
