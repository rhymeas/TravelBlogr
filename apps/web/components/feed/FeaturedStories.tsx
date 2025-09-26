'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Star, Eye, Heart, MessageCircle, 
  ArrowRight, Clock, User 
} from 'lucide-react'

interface FeaturedStory {
  id: string
  title: string
  excerpt: string
  featured_image: string
  published_at: string
  view_count: number
  like_count: number
  author: {
    id: string
    name: string
    avatar_url: string
  }
  trip: {
    id: string
    title: string
    destination: string
  }
}

interface FeaturedStoriesProps {
  stories: FeaturedStory[]
}

export function FeaturedStories({ stories }: FeaturedStoriesProps) {
  if (!stories.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Featured Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No featured stories available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-600" />
          Featured Stories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stories.map((story, index) => (
          <div key={story.id} className="group">
            {index === 0 ? (
              // First story - larger format
              <div className="space-y-3">
                <div className="relative h-32 rounded-lg overflow-hidden">
                  <Image
                    src={story.featured_image || '/placeholder-story.jpg'}
                    alt={story.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-yellow-500 text-yellow-900">
                      Featured
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link 
                    href={`/dashboard/trips/${story.trip.id}#post-${story.id}`}
                    className="block"
                  >
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {story.title}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {story.excerpt}
                  </p>
                  
                  {/* Author & Trip Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Image
                      src={story.author.avatar_url || '/default-avatar.png'}
                      alt={story.author.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    <span>{story.author.name}</span>
                    <span>•</span>
                    <span>{story.trip.destination}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}</span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{story.view_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{story.like_count.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Other stories - compact format
              <div className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={story.featured_image || '/placeholder-story.jpg'}
                    alt={story.title}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <Link 
                    href={`/dashboard/trips/${story.trip.id}#post-${story.id}`}
                    className="block"
                  >
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {story.title}
                    </h4>
                  </Link>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Image
                      src={story.author.avatar_url || '/default-avatar.png'}
                      alt={story.author.name}
                      width={12}
                      height={12}
                      className="rounded-full"
                    />
                    <span>{story.author.name}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(story.published_at), { addSuffix: true })}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{story.view_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{story.like_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* View All Link */}
        <div className="pt-3 border-t">
          <Link 
            href="/stories/featured" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all featured stories
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
