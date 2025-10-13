import { Metadata } from 'next'
import { ActivityFeed } from '@/components/social/ActivityFeed'
import { TripDiscovery } from '@/components/social/TripDiscovery'
import { FollowSuggestions } from '@/components/social/FollowSystem'
import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Users, Compass, Activity, TrendingUp } from 'lucide-react'

// Force dynamic rendering - requires authentication, should not be static
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Social Hub | TravelBlogr',
  description: 'Discover amazing travel experiences, connect with fellow travelers, and share your adventures.',
}

export default async function SocialPage() {
  const supabase = await createServerSupabase()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/signin')
  }

  // Get user's social stats
  const [followingResult, followersResult, tripsResult] = await Promise.all([
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id),
    
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id),
    
    supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_public', true)
  ])

  const stats = {
    following: followingResult.count || 0,
    followers: followersResult.count || 0,
    publicTrips: tripsResult.count || 0
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Hub</h1>
        <p className="text-gray-600">
          Discover amazing travel experiences, connect with fellow travelers, and share your adventures.
        </p>
        
        {/* Social Stats */}
        <div className="flex gap-4 mt-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {stats.following} following
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {stats.followers} followers
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Compass className="h-3 w-3" />
            {stats.publicTrips} public trips
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Feed
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Following Activity</h2>
                <p className="text-gray-600 mb-6">
                  See what travelers you follow are up to
                </p>
                <ActivityFeed
                  userId={user.id}
                  feedType="following"
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="discover" className="space-y-6">
              <TripDiscovery
                currentUserId={user.id}
                className="w-full"
              />
            </TabsContent>

            <TabsContent value="trending" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Trending Now</h2>
                <p className="text-gray-600 mb-6">
                  Popular trips and activities from the community
                </p>
                <ActivityFeed
                  userId={user.id}
                  feedType="discover"
                  className="w-full"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Follow Suggestions */}
          <div className="bg-white rounded-lg border p-4">
            <FollowSuggestions
              currentUserId={user.id}
              limit={5}
              className="w-full"
            />
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Your Impact</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Profile views</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trip likes</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Comments received</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </div>

          {/* Popular Destinations */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Trending Destinations</h3>
            <div className="space-y-2">
              {[
                'Tokyo, Japan',
                'Paris, France', 
                'Bali, Indonesia',
                'New York, USA',
                'Barcelona, Spain'
              ].map((destination, index) => (
                <div key={destination} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{destination}</span>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Social Tip</h3>
            <p className="text-sm text-blue-800">
              Follow travelers with similar interests to discover new destinations and get insider tips!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
