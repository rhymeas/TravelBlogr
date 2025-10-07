import { Metadata } from 'next'
import { GuestTripDashboard } from '@/components/guest/GuestTripDashboard'

export const metadata: Metadata = {
  title: 'My Trips (Guest) | TravelBlogr',
  description: 'View and manage your guest trips.',
  robots: 'noindex', // Don't index guest pages
}

export default function GuestTripsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <GuestTripDashboard />
    </div>
  )
}

