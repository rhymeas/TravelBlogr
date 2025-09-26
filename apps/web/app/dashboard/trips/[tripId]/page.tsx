import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import { TripHeader } from '@/components/trips/TripHeader'
import { PostsList } from '@/components/posts/PostsList'
import { TripMap } from '@/components/maps/TripMap'
import { TripStats } from '@/components/trips/TripStats'
import { ShareLinkManager } from '@/components/share/ShareLinkManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

interface TripDetailsPageProps {
  params: {
    tripId: string
  }
}

export async function generateMetadata({ params }: TripDetailsPageProps): Promise<Metadata> {
  const supabase = createServerSupabase()
  
  const { data: trip } = await supabase
    .from('trips')
    .select('title, description')
    .eq('id', params.tripId)
    .single()

  return {
    title: trip ? `${trip.title} | TravelBlogr` : 'Trip Not Found | TravelBlogr',
    description: trip?.description || 'Manage your travel story'
  }
}

export default async function TripDetailsPage({ params }: TripDetailsPageProps) {
  const supabase = createServerSupabase()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    notFound()
  }

  // Get trip with posts and share links
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      posts (
        *
      ),
      share_links (
        id,
        subdomain,
        title,
        view_count,
        is_active,
        created_at
      )
    `)
    .eq('id', params.tripId)
    .eq('user_id', user.id)
    .single()

  if (error || !trip) {
    notFound()
  }

  // Extract locations from posts for map
  const locations = trip.posts
    ?.filter((post: any) => post.location)
    .map((post: any, index: number) => ({
      id: post.id,
      name: post.title || `Stop ${index + 1}`,
      coordinates: [post.location.lng, post.location.lat],
      description: post.content?.substring(0, 100) + '...',
      date: post.post_date,
      photos: post.photos
    })) || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Trip Header */}
      <TripHeader trip={trip} />

      {/* Main Content */}
      <div className="mt-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="share">Share Links</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Trip Description */}
                {trip.description && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">About This Trip</h2>
                    <p className="text-gray-700 leading-relaxed">{trip.description}</p>
                  </div>
                )}

                {/* Recent Posts */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Recent Posts</h2>
                    <a 
                      href={`/dashboard/trips/${trip.id}/posts`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View all
                    </a>
                  </div>
                  
                  {trip.posts && trip.posts.length > 0 ? (
                    <div className="space-y-4">
                      {trip.posts.slice(0, 3).map((post: any) => (
                        <div key={post.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <h3 className="font-medium text-gray-900 mb-1">{post.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {post.content?.substring(0, 150)}...
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.post_date || post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No posts yet. Start documenting your journey!
                    </p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Trip Stats */}
                <TripStats trip={trip} />

                {/* Quick Map */}
                {locations.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Journey Map</h3>
                    <TripMap 
                      locations={locations}
                      showRoute={true}
                      height="200px"
                      interactive={false}
                    />
                  </div>
                )}

                {/* Share Links Summary */}
                {trip.share_links && trip.share_links.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Share Links</h3>
                    <div className="space-y-2">
                      {trip.share_links.slice(0, 3).map((link: any) => (
                        <div key={link.id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{link.subdomain}.travelblogr.com</span>
                          <span className="text-gray-500">{link.view_count} views</span>
                        </div>
                      ))}
                    </div>
                    {trip.share_links.length > 3 && (
                      <p className="text-xs text-gray-500 mt-2">
                        +{trip.share_links.length - 3} more links
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <div className="bg-white rounded-lg shadow">
              <PostsList tripId={trip.id} posts={trip.posts || []} />
            </div>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <div className="bg-white rounded-lg shadow p-6">
              {locations.length > 0 ? (
                <TripMap 
                  locations={locations}
                  showRoute={true}
                  height="600px"
                  interactive={true}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No locations added yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Add locations to your posts to see them on the map
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Share Links Tab */}
          <TabsContent value="share">
            <div className="bg-white rounded-lg shadow p-6">
              <ShareLinkManager tripId={trip.id} />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Trip Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {trip.share_links?.reduce((sum: number, link: any) => sum + link.view_count, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Views</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {trip.share_links?.filter((link: any) => link.is_active).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active Links</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {trip.posts?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
              </div>

              {/* Share Links Performance */}
              {trip.share_links && trip.share_links.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-md font-medium mb-4">Share Link Performance</h3>
                  <div className="space-y-3">
                    {trip.share_links.map((link: any) => (
                      <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{link.title}</div>
                          <div className="text-sm text-gray-600">{link.subdomain}.travelblogr.com</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{link.view_count} views</div>
                          <div className="text-xs text-gray-500">
                            Created {new Date(link.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
