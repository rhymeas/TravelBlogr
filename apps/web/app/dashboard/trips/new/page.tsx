import { Metadata } from 'next'
import { CreateTripForm } from '@/components/trips/CreateTripForm'

export const metadata: Metadata = {
  title: 'Create New Trip | TravelBlogr',
  description: 'Start documenting your new travel adventure',
}

export default function NewTripPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Trip</h1>
        <p className="text-gray-600">
          Start documenting your journey and create audience-specific share links
        </p>
      </div>

      <CreateTripForm />
    </div>
  )
}
