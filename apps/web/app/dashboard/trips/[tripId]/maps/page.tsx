import { Metadata } from 'next'
import { JourneyVisualizer } from '@/components/maps/JourneyVisualizer'
import { LocationTracker } from '@/components/maps/LocationTracker'
import { InteractiveMap } from '@/components/maps/InteractiveMap'
import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

// Force dynamic rendering - page generated on-demand, not at build time
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export const metadata: Metadata = {
  title: 'Trip Maps | TravelBlogr',
  description: 'Interactive maps, location tracking, and journey visualization for your travel experiences.',
}

interface PageProps {
  params: {
    tripId: string
  }
}

export default async function TripMapsPage({ params }: PageProps) {
  const supabase = createServerSupabase()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Verify trip ownership
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.tripId)
    .eq('user_id', user.id)
    .single()

  if (tripError || !trip) {
    redirect('/dashboard/trips')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {trip.title} - Maps & Location
        </h1>
        <p className="text-gray-600">
          Track your journey, visualize your route, and explore interactive maps of your travel experience.
        </p>
      </div>

      <Tabs defaultValue="journey" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="journey">Journey Visualizer</TabsTrigger>
          <TabsTrigger value="tracker">Location Tracker</TabsTrigger>
          <TabsTrigger value="interactive">Interactive Map</TabsTrigger>
        </TabsList>

        <TabsContent value="journey" className="space-y-6">
          <JourneyVisualizer
            tripId={params.tripId}
            userId={user.id}
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="tracker" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <LocationTracker
                tripId={params.tripId}
                userId={user.id}
                autoSave={true}
                trackingInterval={30000}
                className="h-fit"
              />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border overflow-hidden">
                <InteractiveMap
                  height="600px"
                  showRoute={true}
                  showControls={true}
                  allowAddPoints={true}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-6">
          <div className="bg-white rounded-lg border overflow-hidden">
            <InteractiveMap
              height="700px"
              showRoute={true}
              showControls={true}
              allowAddPoints={true}
              className="w-full"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
