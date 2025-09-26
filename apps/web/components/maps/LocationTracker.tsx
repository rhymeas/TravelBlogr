'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, MapPin, Navigation, Clock, Route } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClientSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface LocationPoint {
  id: string
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: string
  trip_id?: string
}

interface LocationTrackerProps {
  tripId?: string
  userId: string
  onLocationUpdate?: (location: LocationPoint) => void
  autoSave?: boolean
  trackingInterval?: number // in milliseconds
  className?: string
}

export function LocationTracker({
  tripId,
  userId,
  onLocationUpdate,
  autoSave = true,
  trackingInterval = 30000, // 30 seconds default
  className = ''
}: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null)
  const [trackingHistory, setTrackingHistory] = useState<LocationPoint[]>([])
  const [trackingStats, setTrackingStats] = useState({
    duration: 0,
    distance: 0,
    points: 0,
    avgSpeed: 0
  })
  const [watchId, setWatchId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientSupabase()
  const startTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check if geolocation is supported
  const isGeolocationSupported = 'geolocation' in navigator

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Update tracking statistics
  const updateStats = (newLocation: LocationPoint, history: LocationPoint[]) => {
    const now = Date.now()
    const duration = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0
    
    let totalDistance = 0
    let totalSpeed = 0
    let speedCount = 0

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1]
      const curr = history[i]
      totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
      
      if (curr.speed !== undefined && curr.speed > 0) {
        totalSpeed += curr.speed
        speedCount++
      }
    }

    setTrackingStats({
      duration: Math.round(duration),
      distance: totalDistance,
      points: history.length,
      avgSpeed: speedCount > 0 ? totalSpeed / speedCount : 0
    })
  }

  // Save location to database
  const saveLocation = async (location: LocationPoint) => {
    if (!autoSave) return

    try {
      const { error } = await supabase
        .from('live_locations')
        .insert({
          trip_id: tripId,
          user_id: userId,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          timestamp: location.timestamp
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving location:', error)
    }
  }

  // Handle successful location update
  const handleLocationSuccess = (position: GeolocationPosition) => {
    const newLocation: LocationPoint = {
      id: `location-${Date.now()}`,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      timestamp: new Date().toISOString(),
      trip_id: tripId
    }

    setCurrentLocation(newLocation)
    setError(null)

    // Update history
    setTrackingHistory(prev => {
      const newHistory = [...prev, newLocation]
      updateStats(newLocation, newHistory)
      return newHistory
    })

    // Save to database
    if (autoSave) {
      saveLocation(newLocation)
    }

    // Notify parent component
    onLocationUpdate?.(newLocation)
  }

  // Handle location error
  const handleLocationError = (error: GeolocationPositionError) => {
    let errorMessage = 'Location access denied'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable'
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timed out'
        break
    }

    setError(errorMessage)
    console.error('Geolocation error:', error)
  }

  // Start location tracking
  const startTracking = () => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by this browser')
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    )

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    )

    setWatchId(id)
    setIsTracking(true)
    startTimeRef.current = Date.now()
    setError(null)

    toast.success('Location tracking started')
  }

  // Stop location tracking
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsTracking(false)
    toast.success('Location tracking stopped')
  }

  // Clear tracking history
  const clearHistory = () => {
    setTrackingHistory([])
    setCurrentLocation(null)
    setTrackingStats({
      duration: 0,
      distance: 0,
      points: 0,
      avgSpeed: 0
    })
    startTimeRef.current = null
    toast.success('Tracking history cleared')
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Format speed
  const formatSpeed = (speed: number): string => {
    return `${(speed * 3.6).toFixed(1)} km/h` // Convert m/s to km/h
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [watchId])

  if (!isGeolocationSupported) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-800">
          <MapPin className="h-5 w-5" />
          <span className="font-medium">Geolocation Not Supported</span>
        </div>
        <p className="text-red-700 text-sm mt-1">
          Your browser doesn't support location tracking.
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Location Tracker</h3>
          {isTracking && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={startTracking} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          ) : (
            <Button onClick={stopTracking} variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-1" />
              Stop
            </Button>
          )}
          
          {trackingHistory.length > 0 && (
            <Button onClick={clearHistory} variant="outline" size="sm">
              <Square className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Current Location */}
      {currentLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Current Location</span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</div>
            {currentLocation.accuracy && (
              <div>Accuracy: ±{Math.round(currentLocation.accuracy)}m</div>
            )}
            {currentLocation.speed !== undefined && currentLocation.speed > 0 && (
              <div>Speed: {formatSpeed(currentLocation.speed)}</div>
            )}
            <div>Time: {new Date(currentLocation.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {/* Tracking Statistics */}
      {trackingHistory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Duration</span>
            </div>
            <div className="font-semibold">{formatDuration(trackingStats.duration)}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Route className="h-4 w-4" />
              <span className="text-sm">Distance</span>
            </div>
            <div className="font-semibold">{trackingStats.distance.toFixed(2)} km</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Points</span>
            </div>
            <div className="font-semibold">{trackingStats.points}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
              <Navigation className="h-4 w-4" />
              <span className="text-sm">Avg Speed</span>
            </div>
            <div className="font-semibold">
              {trackingStats.avgSpeed > 0 ? formatSpeed(trackingStats.avgSpeed) : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Recent Locations */}
      {trackingHistory.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Recent Locations ({trackingHistory.length})</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {trackingHistory.slice(-5).reverse().map((location, index) => (
              <div key={location.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <div className="flex justify-between">
                  <span>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                  <span>{new Date(location.timestamp).toLocaleTimeString()}</span>
                </div>
                {location.accuracy && (
                  <div className="text-gray-500">±{Math.round(location.accuracy)}m accuracy</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isTracking && trackingHistory.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Click "Start" to begin tracking your location</p>
          <p className="text-xs mt-1">Make sure to allow location access when prompted</p>
        </div>
      )}
    </div>
  )
}
