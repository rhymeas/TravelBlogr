import { Metadata } from 'next'
import { Suspense } from 'react'
import { createServerSupabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { TripsDashboard } from '@/components/trips/TripsDashboard'
import { TripsDashboardSkeleton } from '@/components/trips/TripsDashboardSkeleton'

export const metadata: Metadata = {
  title: 'My Trips | TravelBlogr',
  description: 'Manage your travel stories and share them with different audiences',
}

export default async function TripsPage() {
  const supabase = createServerSupabase()
  
  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Trips</h1>
        <p className="text-gray-600">
          Create and manage your travel stories. Share different experiences with different audiences.
        </p>
      </div>

      <Suspense fallback={<TripsDashboardSkeleton />}>
        <TripsDashboard userId={user.id} />
      </Suspense>
    </div>
  )
}
