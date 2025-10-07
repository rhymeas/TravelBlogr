'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Trash2, Eye, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useGuestTripSelectors, useGuestTripActions } from '@/stores/guestTripStore'
import { SignInPromptModal } from './SignInPromptModal'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export function GuestTripDashboard() {
  const router = useRouter()
  const { trips, canCreateTrip, remainingSlots, tripCount } = useGuestTripSelectors()
  const { deleteTrip } = useGuestTripActions()

  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [promptReason, setPromptReason] = useState<'trip_limit' | 'save_trip'>('trip_limit')

  const handleDelete = (tripId: string, tripTitle: string) => {
    if (confirm(`Are you sure you want to delete "${tripTitle}"? This cannot be undone.`)) {
      deleteTrip(tripId)
      toast.success('Trip deleted')
    }
  }

  const handleCreateNew = () => {
    if (!canCreateTrip) {
      setPromptReason('trip_limit')
      setShowSignInPrompt(true)
      return
    }
    router.push('/guest/plan')
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600 mt-2">
                Guest Mode - {tripCount} of 3 trips
              </p>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Trip
            </Button>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-900">
                  <strong>Important:</strong> Your trips are stored in your browser and will be lost if you clear your browsing data.
                  {' '}<button
                    onClick={() => {
                      setPromptReason('save_trip')
                      setShowSignInPrompt(true)
                    }}
                    className="underline hover:text-yellow-700 font-semibold"
                  >
                    Sign in to save permanently
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip List */}
        {trips.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No trips yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start planning your first adventure! You can create up to 3 trips in guest mode.
              </p>
              <Button onClick={handleCreateNew} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Trip
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Trip Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                        {trip.title}
                      </h3>
                      <Badge variant="outline" className="ml-2">
                        Guest
                      </Badge>
                    </div>
                    {trip.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {trip.description}
                      </p>
                    )}
                  </div>

                  {/* Trip Details */}
                  <div className="p-4 space-y-3">
                    {/* Dates */}
                    {trip.startDate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(trip.startDate), 'MMM d, yyyy')}
                        {trip.endDate && trip.endDate !== trip.startDate && (
                          <span> - {format(new Date(trip.endDate), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    )}

                    {/* Destinations */}
                    {trip.destinations.length > 0 && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                        <div className="flex-1">
                          {trip.destinations.slice(0, 2).join(', ')}
                          {trip.destinations.length > 2 && (
                            <span className="text-gray-400">
                              {' '}+{trip.destinations.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interests */}
                    {trip.interests && trip.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {trip.interests.slice(0, 3).map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {trip.interests.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{trip.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t bg-gray-50 flex gap-2">
                    <Link href={`/guest/trips/${trip.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(trip.id, trip.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Created date */}
                  <div className="px-4 pb-3 text-xs text-gray-400">
                    Created {format(new Date(trip.createdAt), 'MMM d, yyyy')}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Card (if slots available) */}
            {canCreateTrip && (
              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-2 border-dashed"
                onClick={handleCreateNew}
              >
                <CardContent className="p-0 h-full flex items-center justify-center min-h-[300px]">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                      <Plus className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Create New Trip
                    </h3>
                    <p className="text-sm text-gray-600">
                      {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Upgrade CTA */}
        {tripCount > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-2">
                Ready to unlock unlimited trips?
              </h2>
              <p className="mb-6 opacity-90">
                Sign in to save your trips permanently, create unlimited trips, and access all features!
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => router.push('/auth/signup')}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Create Free Account
                </Button>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sign-in Prompt Modal */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        reason={promptReason}
        tripCount={tripCount}
      />
    </>
  )
}

