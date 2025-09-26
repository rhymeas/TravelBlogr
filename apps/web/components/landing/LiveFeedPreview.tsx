'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { 
  Activity, 
  TrendingUp, 
  Globe, 
  Users, 
  MapPin, 
  Camera, 
  Clock, 
  Zap,
  Heart,
  Eye,
  MessageCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useFeaturedContent, RecentPost } from '@/hooks/useFeaturedContent'

// Live post card component
function LivePostCard({ post }: { post: RecentPost }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'trip_post':
        return <MapPin className="h-4 w-4 text-blue-500" />
      case 'cms_post':
        return <Globe className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'trip_post':
        return 'Travel Story'
      case 'cms_post':
        return 'Editorial'
      default:
        return 'Post'
    }
  }

  return (
    <div className="card-elevated overflow-hidden hover:shadow-airbnb-large transition-all duration-300 group">
      {/* Featured image */}
      {post.featured_image && (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Post type badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-airbnb-small px-2 py-1">
            <div className="flex items-center gap-1 text-xs font-medium">
              {getPostTypeIcon(post.type)}
              <span>{getPostTypeLabel(post.type)}</span>
            </div>
          </div>

          {/* Live indicator */}
          <div className="absolute top-3 right-3 bg-red-500 text-white rounded-airbnb-small px-2 py-1">
            <div className="flex items-center gap-1 text-xs font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Author avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {post.author.avatar_url ? (
              <Image
                src={post.author.avatar_url}
                alt={post.author.full_name}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-600">
                {post.author.full_name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>

          {/* Author info and timestamp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-airbnb-black truncate">
                {post.author.full_name}
              </p>
              <span className="text-airbnb-dark-gray">•</span>
              <span className="text-sm text-airbnb-dark-gray">
                {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
              </span>
            </div>
            
            {/* Trip or category context */}
            {post.trip && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <MapPin className="h-3 w-3" />
                <span>from {post.trip.title}</span>
              </div>
            )}
            {post.category && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Globe className="h-3 w-3" />
                <span>{post.category}</span>
              </div>
            )}
          </div>
        </div>

        {/* Post title and excerpt */}
        <h3 className="text-body-large font-semibold text-airbnb-black mb-2 line-clamp-2 group-hover:text-rausch-500 transition-colors">
          {post.title}
        </h3>
        
        {post.excerpt && (
          <p className="text-body-medium text-airbnb-dark-gray mb-3 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Engagement stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-airbnb-dark-gray">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{post.like_count || 0}</span>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-rausch-500 hover:text-rausch-700">
            Read more
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Activity stats component
function ActivityStats() {
  const { meta } = useFeaturedContent()
  
  const stats = [
    {
      icon: <Activity className="h-5 w-5 text-blue-500" />,
      label: 'Active Now',
      value: '24',
      suffix: ' travelers'
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      label: 'Posts Today',
      value: meta?.recentPostsCount || 0,
      suffix: ''
    },
    {
      icon: <Globe className="h-5 w-5 text-purple-500" />,
      label: 'Countries',
      value: '47',
      suffix: ' visited'
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      label: 'Live Updates',
      value: '∞',
      suffix: ''
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-airbnb-medium p-4 shadow-airbnb-light border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-airbnb-small flex items-center justify-center">
              {stat.icon}
            </div>
            <div>
              <div className="text-lg font-bold text-airbnb-black">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-xs text-airbnb-dark-gray">{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LiveFeedPreview() {
  const { recentPosts, isLoading, error } = useFeaturedContent()

  if (error) {
    return (
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-airbnb-dark-gray">Unable to load live feed at the moment.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
              <Sparkles className="h-3 w-3 mr-1" />
              Live from the Community
            </Badge>
          </div>
          
          <h2 className="text-display-small text-airbnb-black mb-4">
            Real-Time Travel Stories
          </h2>
          <p className="text-body-large text-airbnb-dark-gray max-w-2xl mx-auto leading-relaxed">
            Stay connected with the latest adventures, discoveries, and travel insights 
            from our global community of explorers.
          </p>
        </div>

        {/* Activity stats */}
        <ActivityStats />

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-rausch-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-airbnb-dark-gray">Loading live updates...</p>
          </div>
        )}

        {/* Live posts grid */}
        {!isLoading && recentPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {recentPosts.map((post) => (
              <LivePostCard key={`${post.type}-${post.id}`} post={post} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && recentPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-title-small text-airbnb-black mb-2">No recent activity</h3>
            <p className="text-airbnb-dark-gray mb-6">Be the first to share your travel story!</p>
            <Link href="/auth/signup" className="btn-primary">
              Start Sharing
            </Link>
          </div>
        )}

        {/* Bottom CTA */}
        {!isLoading && recentPosts.length > 0 && (
          <div className="text-center">
            <div className="bg-gradient-to-r from-rausch-50 to-blue-50 rounded-airbnb-large p-8 mb-8">
              <h3 className="text-title-medium text-airbnb-black mb-3">
                Join the Conversation
              </h3>
              <p className="text-body-large text-airbnb-dark-gray mb-6 max-w-2xl mx-auto">
                Connect with fellow travelers, share your experiences, and discover new destinations 
                through our vibrant community.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/live-feed"
                  className="btn-primary px-8 py-4 text-body-large font-semibold rounded-airbnb-small hover:scale-105 transition-transform inline-flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  View Live Feed
                </Link>
                
                <Link
                  href="/auth/signup"
                  className="btn-secondary px-8 py-4 text-body-large font-semibold rounded-airbnb-small hover:scale-105 transition-transform inline-flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Join Community
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
