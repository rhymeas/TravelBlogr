'use client'

import { useState } from 'react'
import { Users, Compass, TrendingUp, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FeedPost } from './FeedPost'
import { LocationFilters } from './LocationFilters'
import { feedPosts, locationFilters } from '@/lib/data/feedData'

interface AuthenticatedLiveFeedProps {
  onLike: (postId: string) => void
  onBookmark: (postId: string) => void
  onComment: (postId: string) => void
}

export function AuthenticatedLiveFeed({ 
  onLike, 
  onBookmark, 
  onComment 
}: AuthenticatedLiveFeedProps) {
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('following')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock following posts - in real app, this would be filtered by followed users
  const followingPosts = feedPosts.slice(0, 3).map(post => ({
    ...post,
    isFollowing: true
  }))

  // Mock discover posts - all public posts
  const discoverPosts = feedPosts

  const currentPosts = activeTab === 'following' ? followingPosts : discoverPosts

  const handleFilterChange = (filterId: string) => {
    console.log('Filter changed:', filterId)
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-airbnb-border sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex bg-airbnb-background-secondary rounded-airbnb-medium p-1">
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 rounded-airbnb-small text-body-medium font-medium transition-all ${
                activeTab === 'following'
                  ? 'bg-white text-airbnb-black shadow-airbnb-light'
                  : 'text-airbnb-gray hover:text-airbnb-black'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Following
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-2 rounded-airbnb-small text-body-medium font-medium transition-all ${
                activeTab === 'discover'
                  ? 'bg-white text-airbnb-black shadow-airbnb-light'
                  : 'text-airbnb-gray hover:text-airbnb-black'
              }`}
            >
              <Compass className="h-4 w-4 inline mr-2" />
              Discover
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-airbnb-gray hover:text-airbnb-black"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-airbnb-gray h-4 w-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'following' ? 'following' : 'all'} posts...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4">
            <LocationFilters
              filters={locationFilters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white">
        {activeTab === 'following' ? (
          <FollowingFeed 
            posts={followingPosts}
            onLike={onLike}
            onBookmark={onBookmark}
            onComment={onComment}
          />
        ) : (
          <DiscoverFeed 
            posts={discoverPosts}
            onLike={onLike}
            onBookmark={onBookmark}
            onComment={onComment}
          />
        )}
      </div>
    </div>
  )
}

function FollowingFeed({ posts, onLike, onBookmark, onComment }: {
  posts: any[]
  onLike: (postId: string) => void
  onBookmark: (postId: string) => void
  onComment: (postId: string) => void
}) {
  if (posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Users className="h-12 w-12 text-airbnb-gray mx-auto mb-4" />
        <h3 className="text-title-small text-airbnb-black mb-2">No posts from people you follow</h3>
        <p className="text-body-medium text-airbnb-gray mb-4">
          Start following travelers to see their latest adventures here
        </p>
        <Button className="btn-primary">
          Discover Travelers
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Following Stats */}
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-body-medium font-medium text-blue-800">Following Feed</div>
            <div className="text-body-small text-blue-600">Latest from {posts.length} travelers you follow</div>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            <TrendingUp className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </div>

      {posts.map((post) => (
        <FeedPost
          key={post.id}
          post={post}
          onLike={onLike}
          onBookmark={onBookmark}
          onComment={onComment}
          showFollowButton={false}
        />
      ))}
    </div>
  )
}

function DiscoverFeed({ posts, onLike, onBookmark, onComment }: {
  posts: any[]
  onLike: (postId: string) => void
  onBookmark: (postId: string) => void
  onComment: (postId: string) => void
}) {
  return (
    <div className="space-y-0">
      {/* Discover Stats */}
      <div className="p-4 bg-green-50 border-b border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-body-medium font-medium text-green-800">Discover Feed</div>
            <div className="text-body-small text-green-600">Explore stories from travelers worldwide</div>
          </div>
          <Badge className="bg-green-100 text-green-800">
            <Compass className="h-3 w-3 mr-1" />
            Global
          </Badge>
        </div>
      </div>

      {posts.map((post) => (
        <FeedPost
          key={post.id}
          post={post}
          onLike={onLike}
          onBookmark={onBookmark}
          onComment={onComment}
          showFollowButton={true}
        />
      ))}

      {/* Load More */}
      <div className="p-8 text-center bg-white border-t border-airbnb-border">
        <Button variant="outline" className="btn-secondary">
          Load More Stories
        </Button>
      </div>
    </div>
  )
}
