'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, DollarSign, Heart, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useGuestTripStore, useGuestTripSelectors, useGuestTripActions } from '@/stores/guestTripStore'
import { SignInPromptModal } from './SignInPromptModal'
import toast from 'react-hot-toast'

const INTERESTS = [
  'Adventure', 'Culture', 'Food', 'Nature', 'Photography',
  'History', 'Beach', 'Mountains', 'Cities', 'Wildlife'
]

export function GuestTripPlanner() {
  const router = useRouter()
  const { canCreateTrip, remainingSlots, tripCount } = useGuestTripSelectors()
  const { initSession, createTrip } = useGuestTripActions()

  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [promptReason, setPromptReason] = useState<'trip_limit' | 'save_trip'>('trip_limit')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    destinations: [''],
    interests: [] as string[],
    budget: 'moderate' as 'budget' | 'moderate' | 'luxury',
  })

  // Initialize session on mount
  useEffect(() => {
    initSession()
  }, [initSession])

  const handleAddDestination = () => {
    setFormData(prev => ({
      ...prev,
      destinations: [...prev.destinations, '']
    }))
  }

  const handleDestinationChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.map((d, i) => i === index ? value : d)
    }))
  }

  const handleRemoveDestination = (index: number) => {
    if (formData.destinations.length > 1) {
      setFormData(prev => ({
        ...prev,
        destinations: prev.destinations.filter((_, i) => i !== index)
      }))
    }
  }

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a trip title')
      return
    }

    const validDestinations = formData.destinations.filter(d => d.trim())
    if (validDestinations.length === 0) {
      toast.error('Please add at least one destination')
      return
    }

    // Check if can create trip
    if (!canCreateTrip) {
      setPromptReason('trip_limit')
      setShowSignInPrompt(true)
      return
    }

    // Create guest trip
    const newTrip = createTrip({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      destinations: validDestinations,
      interests: formData.interests,
      budget: formData.budget,
    })

    if (newTrip) {
      toast.success('Trip created! (Saved in your browser)')
      router.push(`/guest/trips/${newTrip.id}`)
    } else {
      setPromptReason('trip_limit')
      setShowSignInPrompt(true)
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header with limit indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plan Your Trip</h1>
              <p className="text-gray-600 mt-2">
                Create your travel plan with AI assistance
              </p>
            </div>
            <div className="text-right">
              <Badge variant={remainingSlots > 0 ? 'default' : 'destructive'}>
                {remainingSlots} / 3 trips remaining
              </Badge>
              <p className="text-xs text-gray-500 mt-1">
                Guest mode
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900">
                  <strong>Guest Mode:</strong> Your trips are saved in your browser. 
                  {' '}<button
                    onClick={() => {
                      setPromptReason('save_trip')
                      setShowSignInPrompt(true)
                    }}
                    className="underline hover:text-blue-700"
                  >
                    Sign in to save permanently
                  </button> and unlock all features!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Summer Road Trip 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us about your trip..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={formData.startDate}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destinations */}
          <Card>
            <CardHeader>
              <CardTitle>
                <MapPin className="inline h-5 w-5 mr-2" />
                Destinations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.destinations.map((destination, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={destination}
                    onChange={(e) => handleDestinationChange(index, e.target.value)}
                    placeholder={`Destination ${index + 1}`}
                    className="flex-1"
                  />
                  {formData.destinations.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveDestination(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDestination}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Destination
              </Button>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Heart className="inline h-5 w-5 mr-2" />
                Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={formData.interests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle>
                <DollarSign className="inline h-5 w-5 mr-2" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['budget', 'moderate', 'luxury'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, budget: level }))}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.budget === level
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold capitalize">{level}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" size="lg" className="flex-1">
              <Sparkles className="h-5 w-5 mr-2" />
              Create Trip
            </Button>
          </div>
        </form>
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

