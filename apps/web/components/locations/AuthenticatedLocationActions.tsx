'use client'

import { useState, useEffect } from 'react'
import {
  Heart,
  Plus,
  Check,
  Calendar,
  MapPin,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

interface AuthenticatedLocationActionsProps {
  locationId: string
  locationSlug: string
  locationName: string
}

export function AuthenticatedLocationActions({
  locationId,
  locationSlug,
  locationName
}: AuthenticatedLocationActionsProps) {
  const { isAuthenticated } = useAuth()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isVisited, setIsVisited] = useState(false)
  const [showTripSelector, setShowTripSelector] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Mock user trips for demo
  const userTrips = [
    { id: '1', title: 'Summer Europe 2024', status: 'planning' },
    { id: '2', title: 'Winter Adventures', status: 'draft' },
    { id: '3', title: 'Food Tour Asia', status: 'published' }
  ]

  // Load user's customization on mount
  useEffect(() => {
    if (isAuthenticated && locationId) {
      loadCustomization()
    }
  }, [isAuthenticated, locationId])

  // Listen for wishlist changes from other components
  useEffect(() => {
    const handleWishlistChange = (event: CustomEvent) => {
      if (event.detail.locationId === locationId) {
        setIsWishlisted(event.detail.isWishlisted)
      }
    }

    const handleVisitedChange = (event: CustomEvent) => {
      if (event.detail.locationId === locationId) {
        setIsVisited(event.detail.isVisited)
      }
    }

    window.addEventListener('wishlistChanged' as any, handleWishlistChange)
    window.addEventListener('visitedChanged' as any, handleVisitedChange)

    return () => {
      window.removeEventListener('wishlistChanged' as any, handleWishlistChange)
      window.removeEventListener('visitedChanged' as any, handleVisitedChange)
    }
  }, [locationId])

  const loadCustomization = async () => {
    try {
      const response = await fetch(`/api/locations/${locationSlug}/customize`)
      const data = await response.json()

      if (response.ok && data.customization) {
        const custom = data.customization
        setIsWishlisted(custom.is_wishlisted || false)
        setIsVisited(custom.is_visited || false)
      }
    } catch (error) {
      console.error('Error loading customization:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCustomization = async (updates: any) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/locations/${locationSlug}/customize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      return true
    } catch (error) {
      console.error('Error saving customization:', error)
      toast.error('Failed to save changes')
      return false
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const handleWishlist = async () => {
    const newValue = !isWishlisted
    setIsWishlisted(newValue)

    const success = await saveCustomization({ isWishlisted: newValue })
    if (success) {
      toast.success(newValue ? 'Added to wishlist' : 'Removed from wishlist')

      // Notify other components
      window.dispatchEvent(new CustomEvent('wishlistChanged', {
        detail: { locationId, isWishlisted: newValue }
      }))
    } else {
      setIsWishlisted(!newValue) // Revert on failure
    }
  }

  const handleVisited = async () => {
    const newValue = !isVisited
    setIsVisited(newValue)

    const success = await saveCustomization({
      isVisited: newValue,
      visitDate: newValue ? new Date().toISOString() : null
    })

    if (success) {
      toast.success(newValue ? 'Marked as visited' : 'Marked as not visited')

      // Notify other components
      window.dispatchEvent(new CustomEvent('visitedChanged', {
        detail: { locationId, isVisited: newValue }
      }))
    } else {
      setIsVisited(!newValue) // Revert on failure
    }
  }

  const handleAddToTrip = (tripId: string, tripTitle: string) => {
    toast.success(`Added to "${tripTitle}"`)
    setShowTripSelector(false)
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card className="card-elevated p-4">
        <h3 className="text-title-small text-sleek-black mb-3">Your Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWishlist}
            className={`btn-secondary ${isWishlisted ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
          >
            <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
            {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTripSelector(!showTripSelector)}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Trip
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleVisited}
            className={`btn-secondary ${isVisited ? 'bg-green-50 text-green-600 border-green-200' : ''}`}
          >
            <Check className={`h-4 w-4 mr-2 ${isVisited ? 'fill-current' : ''}`} />
            {isVisited ? 'Visited' : 'Mark as Visited'}
          </Button>
        </div>

        {/* Trip Selector */}
        {showTripSelector && (
          <div className="mt-4 p-3 bg-sleek-background-secondary rounded-sleek-small">
            <h4 className="text-body-medium font-medium text-sleek-black mb-2">Add to Trip:</h4>
            <div className="space-y-2">
              {userTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => handleAddToTrip(trip.id, trip.title)}
                  className="w-full text-left p-2 rounded-sleek-small hover:bg-white transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-body-medium text-sleek-black">{trip.title}</div>
                    <div className="text-body-small text-sleek-gray capitalize">{trip.status}</div>
                  </div>
                  <Badge className={
                    trip.status === 'published' ? 'bg-green-100 text-green-800' :
                    trip.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {trip.status}
                  </Badge>
                </button>
              ))}
              <button
                onClick={() => {
                  toast.success('Redirecting to create new trip...')
                  setShowTripSelector(false)
                }}
                className="w-full text-left p-2 rounded-sleek-small hover:bg-white transition-colors text-rausch-500 font-medium"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Create New Trip
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Rating Section - REMOVED: Rating is already at the top of the page */}

      {/* Visit Status */}
      {isVisited && (
        <Card className="card-elevated p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-title-small text-green-800">You've been here!</h3>
              <p className="text-body-small text-green-600">
                Share your experience to help other travelers
              </p>
            </div>
          </div>
          <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700 text-white">
            Write a Review
          </Button>
        </Card>
      )}

      {/* Travel Planning */}
      <Card className="card-elevated p-4">
        <h3 className="text-title-small text-sleek-black mb-3">Plan Your Visit</h3>
        <div className="space-y-3">
          <Button variant="outline" className="btn-secondary w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Best Time to Visit
          </Button>
          <Button variant="outline" className="btn-secondary w-full justify-start">
            <MapPin className="h-4 w-4 mr-2" />
            Nearby Attractions
          </Button>
          <Button variant="outline" className="btn-secondary w-full justify-start">
            <Star className="h-4 w-4 mr-2" />
            Local Recommendations
          </Button>
        </div>
      </Card>
    </div>
  )
}
