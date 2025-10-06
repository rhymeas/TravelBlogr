'use client'

import Link from 'next/link'
import { 
  Plus, 
  MapPin, 
  Camera, 
  Users, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  Star,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'

// Mock data - in real app, this would come from API
const recentTrips = [
  {
    id: '1',
    title: 'Summer in Santorini',
    destination: 'Santorini, Greece',
    status: 'published',
    views: 1247,
    likes: 89,
    image: 'https://picsum.photos/400/300?random=1',
    lastUpdated: '2 days ago'
  },
  {
    id: '2',
    title: 'Tokyo Food Adventure',
    destination: 'Tokyo, Japan',
    status: 'draft',
    views: 0,
    likes: 0,
    image: 'https://picsum.photos/400/300?random=2',
    lastUpdated: '1 week ago'
  },
  {
    id: '3',
    title: 'Canadian Rockies Road Trip',
    destination: 'Banff, Canada',
    status: 'published',
    views: 892,
    likes: 67,
    image: 'https://picsum.photos/400/300?random=3',
    lastUpdated: '3 weeks ago'
  }
]

const quickStats = [
  { label: 'Total Trips', value: '12', icon: MapPin, color: 'text-blue-600' },
  { label: 'Published', value: '8', icon: TrendingUp, color: 'text-green-600' },
  { label: 'Total Views', value: '15.2K', icon: Eye, color: 'text-purple-600' },
  { label: 'Followers', value: '234', icon: Users, color: 'text-orange-600' }
]

export function DashboardLanding() {
  const { user, profile } = useAuth()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-airbnb-background-secondary">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-display-medium text-airbnb-black mb-2">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Traveler'}!
          </h1>
          <p className="text-body-large text-airbnb-dark-gray">
            Ready to share your next adventure? Your travel stories inspire others to explore the world.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-elevated p-6 hover:shadow-airbnb-large transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rausch-500 rounded-airbnb-medium flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-title-small text-airbnb-black mb-1">Create New Trip</h3>
                <p className="text-body-medium text-airbnb-gray">Start documenting your latest adventure</p>
              </div>
              <Button asChild className="btn-primary">
                <Link href="/dashboard/trips/new">
                  Create
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-airbnb-large transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-airbnb-medium flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-title-small text-airbnb-black mb-1">Upload Media</h3>
                <p className="text-body-medium text-airbnb-gray">Add photos and videos to your trips</p>
              </div>
              <Button asChild variant="outline" className="btn-secondary">
                <Link href="/dashboard/media">
                  Upload
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="card-elevated p-6 hover:shadow-airbnb-large transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-airbnb-medium flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-title-small text-airbnb-black mb-1">Explore Feed</h3>
                <p className="text-body-medium text-airbnb-gray">Discover stories from fellow travelers</p>
              </div>
              <Button asChild variant="outline" className="btn-secondary">
                <Link href="/live-feed">
                  Explore
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <div className="text-title-small text-airbnb-black">{stat.value}</div>
                  <div className="text-body-small text-airbnb-gray">{stat.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Trips */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-title-large text-airbnb-black">Your Recent Trips</h2>
            <Button asChild variant="outline" className="btn-secondary">
              <Link href="/dashboard/trips" className="flex items-center gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentTrips.map((trip) => (
              <Link key={trip.id} href={`/dashboard/trips/${trip.id}`} className="group">
                <Card className="card-elevated overflow-hidden hover:shadow-airbnb-xl transition-all duration-300 group-hover:scale-[1.02]">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={trip.image}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge 
                        className={
                          trip.status === 'published' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-yellow-500 text-white'
                        }
                      >
                        {trip.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-title-small text-airbnb-black mb-1 group-hover:text-rausch-500 transition-colors">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-1 text-airbnb-gray text-body-medium mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{trip.destination}</span>
                    </div>

                    <div className="flex items-center justify-between text-body-small text-airbnb-gray">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{trip.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{trip.likes}</span>
                        </div>
                      </div>
                      <span>Updated {trip.lastUpdated}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Inspiration Section */}
        <Card className="card-elevated p-6 bg-gradient-to-r from-rausch-50 to-rausch-100 border-rausch-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-title-medium text-airbnb-black mb-2">Need Inspiration?</h3>
              <p className="text-body-large text-airbnb-dark-gray mb-4">
                Explore trending destinations and discover what other travelers are sharing
              </p>
              <Button asChild className="btn-primary">
                <Link href="/locations">
                  Discover Destinations
                </Link>
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-rausch-500 rounded-full flex items-center justify-center">
                <MapPin className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
