import { Metadata } from 'next'
import { LiveFeed } from '@/components/feed/LiveFeed'
import { FeedFilters } from '@/components/feed/FeedFilters'
import { TrendingTopics } from '@/components/feed/TrendingTopics'
import { FeaturedStories } from '@/components/feed/FeaturedStories'
import { createServerSupabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { 
  Activity, TrendingUp, Globe, Users, 
  MapPin, Camera, Clock, Zap 
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Live Feed | TravelBlogr',
  description: 'Stay updated with the latest travel stories, real-time updates, and trending destinations from the TravelBlogr community.',
}

export default async function LiveFeedPage() {
  const supabase = createServerSupabase()
  
  // Get current user for personalized feed
  const { data: { user } } = await supabase.auth.getUser()

  // Get trending topics and hashtags
  const { data: trendingTopics } = await supabase
    .from('trending_topics')
    .select('*')
    .order('post_count', { ascending: false })
    .limit(10)

  // Get featured stories
  const { data: featuredStories } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      excerpt,
      featured_image,
      published_at,
      view_count,
      like_count,
      author:users (
        id,
        name,
        avatar_url
      ),
      trip:trips (
        id,
        title,
        destination
      )
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(5)

  // Get live activity stats
  const { data: activityStats } = await supabase
    .from('activity_feed')
    .select('type, created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const stats = {
    totalActivity: activityStats?.length || 0,
    postsToday: activityStats?.filter(a => a.type === 'post_published').length || 0,
    tripsToday: activityStats?.filter(a => a.type === 'trip_created').length || 0,
    photosToday: activityStats?.filter(a => a.type === 'media_uploaded').length || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Live Feed</h1>
                <Badge variant="secondary" className="animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <p className="text-gray-600">
                Real-time travel stories, updates, and community activity from around the world
              </p>
            </div>

            {/* Live Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-500">
                  <Activity className="h-4 w-4" />
                  <span>Activity</span>
                </div>
                <div className="font-bold text-lg">{stats.totalActivity}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-500">
                  <Globe className="h-4 w-4" />
                  <span>Posts</span>
                </div>
                <div className="font-bold text-lg">{stats.postsToday}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>Trips</span>
                </div>
                <div className="font-bold text-lg">{stats.tripsToday}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-gray-500">
                  <Camera className="h-4 w-4" />
                  <span>Photos</span>
                </div>
                <div className="font-bold text-lg">{stats.photosToday}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Feed Filters */}
            <FeedFilters />

            {/* Feed Tabs */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  All Activity
                </TabsTrigger>
                <TabsTrigger value="following" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Following
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="live" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Live Now
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <LiveFeed 
                  feedType="all" 
                  userId={user?.id}
                  showRealTime={true}
                />
              </TabsContent>

              <TabsContent value="following">
                <LiveFeed 
                  feedType="following" 
                  userId={user?.id}
                  showRealTime={true}
                />
              </TabsContent>

              <TabsContent value="trending">
                <LiveFeed 
                  feedType="trending" 
                  userId={user?.id}
                  showRealTime={false}
                />
              </TabsContent>

              <TabsContent value="live">
                <LiveFeed 
                  feedType="live" 
                  userId={user?.id}
                  showRealTime={true}
                  refreshInterval={5000}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Stats */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Today's Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Total Updates</span>
                  <span className="font-medium">{stats.totalActivity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">New Posts</span>
                  <span className="font-medium">{stats.postsToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">New Trips</span>
                  <span className="font-medium">{stats.tripsToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Photos Shared</span>
                  <span className="font-medium">{stats.photosToday}</span>
                </div>
              </div>
            </div>

            {/* Trending Topics */}
            <TrendingTopics topics={trendingTopics || []} />

            {/* Featured Stories */}
            <FeaturedStories stories={featuredStories || []} />

            {/* Live Activity Indicator */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-semibold">Live Updates</span>
              </div>
              <p className="text-sm opacity-90">
                New content appears automatically. No need to refresh!
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  📝 Share an Update
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  📸 Upload Photos
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  🗺️ Create New Trip
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  📍 Check In Location
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
