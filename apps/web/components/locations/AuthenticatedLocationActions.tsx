'use client'

import { useState } from 'react'
import { 
  Heart, 
  Bookmark, 
  Plus, 
  Check, 
  StickyNote, 
  Star,
  MapPin,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

interface AuthenticatedLocationActionsProps {
  locationId: string
  locationName: string
}

export function AuthenticatedLocationActions({ 
  locationId, 
  locationName 
}: AuthenticatedLocationActionsProps) {
  const { isAuthenticated } = useAuth()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isVisited, setIsVisited] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [showTripSelector, setShowTripSelector] = useState(false)

  // Mock user trips for demo
  const userTrips = [
    { id: '1', title: 'Summer Europe 2024', status: 'planning' },
    { id: '2', title: 'Winter Adventures', status: 'draft' },
    { id: '3', title: 'Food Tour Asia', status: 'published' }
  ]

  if (!isAuthenticated) {
    return null
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleVisited = () => {
    setIsVisited(!isVisited)
    toast.success(isVisited ? 'Marked as not visited' : 'Marked as visited')
  }

  const handleSaveNotes = () => {
    toast.success('Notes saved successfully')
    setShowNotes(false)
  }

  const handleRating = (rating: number) => {
    setUserRating(rating)
    toast.success(`Rated ${rating} stars`)
  }

  const handleAddToTrip = (tripId: string, tripTitle: string) => {
    toast.success(`Added to "${tripTitle}"`)
    setShowTripSelector(false)
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card className="card-elevated p-4">
        <h3 className="text-title-small text-airbnb-black mb-3">Your Actions</h3>
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className="btn-secondary"
          >
            <StickyNote className="h-4 w-4 mr-2" />
            Notes
          </Button>
        </div>

        {/* Trip Selector */}
        {showTripSelector && (
          <div className="mt-4 p-3 bg-airbnb-background-secondary rounded-airbnb-small">
            <h4 className="text-body-medium font-medium text-airbnb-black mb-2">Add to Trip:</h4>
            <div className="space-y-2">
              {userTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => handleAddToTrip(trip.id, trip.title)}
                  className="w-full text-left p-2 rounded-airbnb-small hover:bg-white transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-body-medium text-airbnb-black">{trip.title}</div>
                    <div className="text-body-small text-airbnb-gray capitalize">{trip.status}</div>
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
                className="w-full text-left p-2 rounded-airbnb-small hover:bg-white transition-colors text-rausch-500 font-medium"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Create New Trip
              </button>
            </div>
          </div>
        )}

        {/* Notes Section */}
        {showNotes && (
          <div className="mt-4 p-3 bg-airbnb-background-secondary rounded-airbnb-small">
            <h4 className="text-body-medium font-medium text-airbnb-black mb-2">Personal Notes:</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your personal notes about this location..."
              className="input-field w-full h-24 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleSaveNotes} className="btn-primary">
                Save Notes
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNotes(false)} className="btn-secondary">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Rating Section */}
      <Card className="card-elevated p-4">
        <h3 className="text-title-small text-airbnb-black mb-3">Rate This Location</h3>
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRating(star)}
              className="transition-colors hover:scale-110 transform"
            >
              <Star 
                className={`h-6 w-6 ${
                  star <= userRating 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`} 
              />
            </button>
          ))}
        </div>
        {userRating > 0 && (
          <p className="text-body-small text-airbnb-gray">
            You rated this location {userRating} star{userRating !== 1 ? 's' : ''}
          </p>
        )}
      </Card>

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
        <h3 className="text-title-small text-airbnb-black mb-3">Plan Your Visit</h3>
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
