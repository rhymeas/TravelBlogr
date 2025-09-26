'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Metric, Flex, Grid, AreaChart, BarChart, DonutChart, LineChart } from '@tremor/react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Calendar, Users, MapPin, Camera, TrendingUp, TrendingDown, Activity, Eye } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalTrips: number
    totalPosts: number
    totalMedia: number
    activeUsers: number
    publicTrips: number
  }
  trends: {
    userGrowth: Array<{ date: string; users: number; change: number }>
    tripCreation: Array<{ date: string; trips: number; posts: number }>
    engagement: Array<{ date: string; likes: number; comments: number; views: number }>
  }
  demographics: {
    usersByCountry: Array<{ country: string; users: number }>
    tripsByDestination: Array<{ destination: string; trips: number }>
    contentTypes: Array<{ type: string; count: number }>
  }
  performance: {
    topTrips: Array<{ id: string; title: string; views: number; likes: number; author: string }>
    topUsers: Array<{ id: string; name: string; trips: number; followers: number; engagement: number }>
    popularDestinations: Array<{ destination: string; trips: number; growth: number }>
  }
}

interface AnalyticsDashboardProps {
  userId: string
  isAdmin: boolean
  className?: string
}

export function AnalyticsDashboard({ userId, isAdmin, className = '' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('users')

  const supabase = createClientSupabase()

  useEffect(() => {
    loadAnalytics()
  }, [timeRange, userId, isAdmin])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = startOfDay(subDays(new Date(), days))
      const endDate = endOfDay(new Date())

      // Load overview data
      const [usersResult, tripsResult, postsResult, mediaResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('media_files').select('*', { count: 'exact', head: true })
      ])

      // Load active users (users who logged in in the last 7 days)
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', subDays(new Date(), 7).toISOString())

      // Load public trips
      const { count: publicTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)

      // Generate trend data (mock for now - would need proper time-series data)
      const userGrowth = Array.from({ length: days }, (_, i) => {
        const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd')
        const users = Math.floor(Math.random() * 50) + (usersResult.count || 0) / days * i
        const change = Math.floor(Math.random() * 20) - 10
        return { date, users, change }
      })

      const tripCreation = Array.from({ length: days }, (_, i) => {
        const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd')
        const trips = Math.floor(Math.random() * 10) + 5
        const posts = Math.floor(Math.random() * 25) + 10
        return { date, trips, posts }
      })

      const engagement = Array.from({ length: days }, (_, i) => {
        const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd')
        const likes = Math.floor(Math.random() * 100) + 50
        const comments = Math.floor(Math.random() * 30) + 15
        const views = Math.floor(Math.random() * 500) + 200
        return { date, likes, comments, views }
      })

      // Load real demographic data
      const { data: tripsData } = await supabase
        .from('trips')
        .select('destination')
        .not('destination', 'is', null)
        .eq('is_public', true)

      const destinationCounts = (tripsData || []).reduce((acc, trip) => {
        const dest = trip.destination
        acc[dest] = (acc[dest] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const tripsByDestination = Object.entries(destinationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([destination, trips]) => ({ destination, trips }))

      // Mock other demographic data
      const usersByCountry = [
        { country: 'United States', users: 1250 },
        { country: 'United Kingdom', users: 890 },
        { country: 'Germany', users: 650 },
        { country: 'France', users: 580 },
        { country: 'Canada', users: 420 },
        { country: 'Australia', users: 380 },
        { country: 'Japan', users: 320 },
        { country: 'Netherlands', users: 280 }
      ]

      const contentTypes = [
        { type: 'Photos', count: mediaResult.count || 0 },
        { type: 'Posts', count: postsResult.count || 0 },
        { type: 'Trips', count: tripsResult.count || 0 },
        { type: 'Videos', count: Math.floor((mediaResult.count || 0) * 0.2) }
      ]

      // Load performance data
      const { data: topTripsData } = await supabase
        .from('trips')
        .select(`
          id, title, user_id,
          users!user_id(full_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10)

      const topTrips = await Promise.all(
        (topTripsData || []).map(async (trip) => {
          const [viewsResult, likesResult] = await Promise.all([
            supabase.from('trip_views').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id),
            supabase.from('trip_likes').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id)
          ])

          return {
            id: trip.id,
            title: trip.title,
            views: viewsResult.count || 0,
            likes: likesResult.count || 0,
            author: trip.users?.full_name || 'Unknown'
          }
        })
      )

      // Mock top users and popular destinations
      const topUsers = [
        { id: '1', name: 'Sarah Johnson', trips: 15, followers: 1250, engagement: 85 },
        { id: '2', name: 'Mike Chen', trips: 12, followers: 980, engagement: 78 },
        { id: '3', name: 'Emma Wilson', trips: 18, followers: 1450, engagement: 92 },
        { id: '4', name: 'David Brown', trips: 9, followers: 720, engagement: 65 },
        { id: '5', name: 'Lisa Garcia', trips: 14, followers: 1100, engagement: 81 }
      ]

      const popularDestinations = tripsByDestination.slice(0, 5).map(dest => ({
        ...dest,
        growth: Math.floor(Math.random() * 40) - 10
      }))

      setData({
        overview: {
          totalUsers: usersResult.count || 0,
          totalTrips: tripsResult.count || 0,
          totalPosts: postsResult.count || 0,
          totalMedia: mediaResult.count || 0,
          activeUsers: activeUsers || 0,
          publicTrips: publicTrips || 0
        },
        trends: {
          userGrowth,
          tripCreation,
          engagement
        },
        demographics: {
          usersByCountry,
          tripsByDestination,
          contentTypes
        },
        performance: {
          topTrips: topTrips.sort((a, b) => b.views - a.views).slice(0, 5),
          topUsers,
          popularDestinations
        }
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to view analytics.</p>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-20"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Monitor your platform's performance and user engagement</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadAnalytics}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Total Users</Text>
              <Metric>{data.overview.totalUsers.toLocaleString()}</Metric>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              <Users className="h-4 w-4" />
            </Badge>
          </Flex>
          <Flex className="mt-4" alignItems="center">
            <Text className={getChangeColor(5)}>
              <Flex alignItems="center" className="space-x-1">
                {getChangeIcon(5)}
                <span>+5% from last period</span>
              </Flex>
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Active Users</Text>
              <Metric>{data.overview.activeUsers.toLocaleString()}</Metric>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <Activity className="h-4 w-4" />
            </Badge>
          </Flex>
          <Flex className="mt-4" alignItems="center">
            <Text className={getChangeColor(12)}>
              <Flex alignItems="center" className="space-x-1">
                {getChangeIcon(12)}
                <span>+12% from last period</span>
              </Flex>
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Total Trips</Text>
              <Metric>{data.overview.totalTrips.toLocaleString()}</Metric>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              <MapPin className="h-4 w-4" />
            </Badge>
          </Flex>
          <Flex className="mt-4" alignItems="center">
            <Text className={getChangeColor(8)}>
              <Flex alignItems="center" className="space-x-1">
                {getChangeIcon(8)}
                <span>+8% from last period</span>
              </Flex>
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Media Files</Text>
              <Metric>{data.overview.totalMedia.toLocaleString()}</Metric>
            </div>
            <Badge className="bg-orange-100 text-orange-800">
              <Camera className="h-4 w-4" />
            </Badge>
          </Flex>
          <Flex className="mt-4" alignItems="center">
            <Text className={getChangeColor(15)}>
              <Flex alignItems="center" className="space-x-1">
                {getChangeIcon(15)}
                <span>+15% from last period</span>
              </Flex>
            </Text>
          </Flex>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>User Growth</Title>
          <AreaChart
            className="h-72 mt-4"
            data={data.trends.userGrowth}
            index="date"
            categories={["users"]}
            colors={["blue"]}
            yAxisWidth={60}
          />
        </Card>

        <Card>
          <Title>Content Creation</Title>
          <BarChart
            className="h-72 mt-4"
            data={data.trends.tripCreation}
            index="date"
            categories={["trips", "posts"]}
            colors={["purple", "green"]}
            yAxisWidth={60}
          />
        </Card>

        <Card>
          <Title>User Engagement</Title>
          <LineChart
            className="h-72 mt-4"
            data={data.trends.engagement}
            index="date"
            categories={["likes", "comments", "views"]}
            colors={["red", "blue", "green"]}
            yAxisWidth={60}
          />
        </Card>

        <Card>
          <Title>Content Distribution</Title>
          <DonutChart
            className="h-72 mt-4"
            data={data.demographics.contentTypes}
            category="count"
            index="type"
            colors={["blue", "green", "purple", "orange"]}
          />
        </Card>
      </Grid>

      {/* Performance Tables */}
      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Top Performing Trips</Title>
          <div className="mt-4 space-y-3">
            {data.performance.topTrips.map((trip, index) => (
              <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{trip.title}</p>
                    <p className="text-xs text-gray-600">by {trip.author}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-3 w-3" />
                    <span>{trip.views}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>❤️ {trip.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Title>Popular Destinations</Title>
          <div className="mt-4 space-y-3">
            {data.performance.popularDestinations.map((dest, index) => (
              <div key={dest.destination} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{dest.destination}</p>
                    <p className="text-xs text-gray-600">{dest.trips} trips</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(dest.growth)}`}>
                    {getChangeIcon(dest.growth)}
                    <span>{dest.growth > 0 ? '+' : ''}{dest.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </div>
  )
}
