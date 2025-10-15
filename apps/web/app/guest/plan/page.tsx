import { Metadata } from 'next'
import { GuestTripPlanner } from '@/components/guest/GuestTripPlanner'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Plan Your Trip | TravelBlogr',
  description: 'Create your travel plan with AI assistance. No sign-up required.',
  robots: 'noindex', // Don't index guest pages
}

export default function GuestPlanPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <GuestTripPlanner />
    </div>
  )
}

