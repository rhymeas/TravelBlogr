'use client'

import { MapPin, Calendar, Eye, Heart, Share2, Image as ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface TripStatsProps {
  trip: {
    id: string
    title: string
    start_date?: string
    end_date?: string
    posts?: any[]
    share_links?: any[]
  }
}

export function TripStats({ trip }: TripStatsProps) {
  // Calculate trip duration
  const getDuration = () => {
    if (!trip.start_date || !trip.end_date) return null
    const start = new Date(trip.start_date)
    const end = new Date(trip.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  // Count total photos
  const getTotalPhotos = () => {
    if (!trip.posts) return 0
    return trip.posts.reduce((total, post) => {
      return total + (post.photos?.length || 0)
    }, 0)
  }

  // Count unique locations
  const getUniqueLocations = () => {
    if (!trip.posts) return 0
    const locations = new Set(
      trip.posts
        .filter(post => post.location)
        .map(post => `${post.location.lat},${post.location.lng}`)
    )
    return locations.size
  }

  // Calculate total views from share links
  const getTotalViews = () => {
    if (!trip.share_links) return 0
    return trip.share_links.reduce((total, link) => total + (link.view_count || 0), 0)
  }

  const duration = getDuration()
  const totalPhotos = getTotalPhotos()
  const uniqueLocations = getUniqueLocations()
  const totalViews = getTotalViews()

  const stats = [
    {
      label: 'Duration',
      value: duration ? `${duration} ${duration === 1 ? 'day' : 'days'}` : 'Not set',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Locations',
      value: uniqueLocations,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Posts',
      value: trip.posts?.length || 0,
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      label: 'Photos',
      value: totalPhotos,
      icon: ImageIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Share Links',
      value: trip.share_links?.length || 0,
      icon: Share2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-gray-900 truncate">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {stat.label}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

