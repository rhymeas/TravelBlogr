'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Pause, Play, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClientSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface LiveLocationTrackerProps {
  tripId: string
  isEnabled?: boolean
  onLocationUpdate?: (location: GeolocationPosition) => void
}

interface LocationPoint {
  id: string
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
  speed?: number
  heading?: number
}

export function LiveLocationTracker({ 
  tripId, 
  isEnabled = false, 
  onLocationUpdate 
}: LiveLocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null)
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([])
  const [settings, setSettings] = useState({
    updateInterval: 30000, // 30 seconds
    highAccuracy: true,
    shareWithFollowers: false,
    autoPublishPosts: false
  })
  const [showSettings, setShowSettings] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const supabase = createClientSupabase()

  useEffect(() => {
    if (isEnabled && isTracking) {
      startTracking()
    } else {
      stopTracking()
    }

    return () => stopTracking()
  }, [isEnabled, isTracking, settings.updateInterval, settings.highAccuracy])

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: settings.highAccuracy,
      timeout: 10000,
      maximumAge: settings.updateInterval / 2
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      options
    )

    toast.success('Live location tracking started')
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  const handleLocationUpdate = async (position: GeolocationPosition) => {
    setCurrentLocation(position)
    onLocationUpdate?.(position)

    const locationPoint: LocationPoint = {
      id: crypto.randomUUID(),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString(),
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    }

    // Update local state
    setLocationHistory(prev => [locationPoint, ...prev.slice(0, 99)]) // Keep last 100 points

    // Save to database
    try {
      const { error } = await supabase
        .from('live_locations')
        .insert({
          trip_id: tripId,
          latitude: locationPoint.latitude,
          longitude: locationPoint.longitude,
          accuracy: locationPoint.accuracy,
          speed: locationPoint.speed,
          heading: locationPoint.heading,
          timestamp: locationPoint.timestamp
        })

      if (error) {
        console.error('Error saving location:', error)
      }

      // Broadcast to real-time subscribers
      const channel = supabase.channel(`trip:${tripId}:location`)
      channel.send({
        type: 'broadcast',
        event: 'location_update',
        payload: locationPoint
      })

    } catch (error) {
      console.error('Error updating live location:', error)
    }
  }

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Location error:', error)
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        toast.error('Location access denied. Please enable location permissions.')
        break
      case error.POSITION_UNAVAILABLE:
        toast.error('Location information unavailable.')
        break
      case error.TIMEOUT:
        toast.error('Location request timed out.')
        break
      default:
        toast.error('An unknown error occurred while retrieving location.')
        break
    }
    
    setIsTracking(false)
  }

  const toggleTracking = () => {
    setIsTracking(!isTracking)
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  const formatSpeed = (metersPerSecond: number | null) => {
    if (!metersPerSecond) return 'N/A'
    const kmh = metersPerSecond * 3.6
    return `${kmh.toFixed(1)} km/h`
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Live Location</h3>
          {isTracking && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Tracking</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={toggleTracking}
            variant={isTracking ? "outline" : "default"}
            size="sm"
          >
            {isTracking ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <h4 className="font-medium">Tracking Settings</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Interval
            </label>
            <select
              value={settings.updateInterval}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                updateInterval: parseInt(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={300000}>5 minutes</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.highAccuracy}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  highAccuracy: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">High accuracy (uses more battery)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.shareWithFollowers}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  shareWithFollowers: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">Share with followers</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoPublishPosts}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  autoPublishPosts: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">Auto-publish location posts</span>
            </label>
          </div>
        </div>
      )}

      {/* Current Location Info */}
      {currentLocation && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Latitude:</span>
              <div className="font-mono">{currentLocation.coords.latitude.toFixed(6)}</div>
            </div>
            <div>
              <span className="text-gray-600">Longitude:</span>
              <div className="font-mono">{currentLocation.coords.longitude.toFixed(6)}</div>
            </div>
            <div>
              <span className="text-gray-600">Accuracy:</span>
              <div>{formatDistance(currentLocation.coords.accuracy)}</div>
            </div>
            <div>
              <span className="text-gray-600">Speed:</span>
              <div>{formatSpeed(currentLocation.coords.speed)}</div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Location History */}
      {locationHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Recent Locations ({locationHistory.length})</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {locationHistory.slice(0, 5).map((point) => (
              <div key={point.id} className="text-xs text-gray-600 flex justify-between">
                <span>
                  {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                </span>
                <span>
                  {new Date(point.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No location message */}
      {!currentLocation && !isTracking && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Start tracking to share your live location</p>
          <p className="text-sm mt-1">Your followers can see your journey in real-time</p>
        </div>
      )}
    </div>
  )
}
