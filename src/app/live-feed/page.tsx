import Link from 'next/link'
import { MapPin, Heart, MessageCircle, Share2, Camera, Plane, Star, User, ArrowRight } from 'lucide-react'

const sampleActivities = [
  {
    id: 1,
    type: 'trip_created',
    user: {
      name: 'Sarah Johnson',
      username: 'sarah_travels',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
    },
    content: 'Just started planning my dream trip to Japan! 🇯🇵',
    location: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 8
  },
  {
    id: 2,
    type: 'post_published',
    user: {
      name: 'Mike Chen',
      username: 'mike_adventures',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    content: 'The sunrise at Machu Picchu was absolutely breathtaking! Worth every step of the hike.',
    location: 'Machu Picchu, Peru',
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&h=400&fit=crop',
    timestamp: '4 hours ago',
    likes: 156,
    comments: 23
  },
  {
    id: 3,
    type: 'location_visited',
    user: {
      name: 'Emma Wilson',
      username: 'emma_wanderlust',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    },
    content: 'Finally made it to the Eiffel Tower! The view from the top is incredible 🗼',
    location: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=600&h=400&fit=crop',
    timestamp: '6 hours ago',
    likes: 89,
    comments: 15
  },
  {
    id: 4,
    type: 'review_posted',
    user: {
      name: 'David Rodriguez',
      username: 'david_explorer',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    content: 'Just reviewed the most amazing beachfront resort in Bali. The service was exceptional!',
    location: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=600&h=400&fit=crop',
    timestamp: '8 hours ago',
    likes: 67,
    comments: 12
  },
  {
    id: 5,
    type: 'media_uploaded',
    user: {
      name: 'Lisa Park',
      username: 'lisa_captures',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
    },
    content: 'Uploaded 15 new photos from my Santorini adventure! The sunsets here are unreal 📸',
    location: 'Santorini, Greece',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop',
    timestamp: '12 hours ago',
    likes: 203,
    comments: 31
  }
]

function getActivityIcon(type: string) {
  switch (type) {
    case 'trip_created':
      return <Plane className="h-4 w-4 text-rausch-500" />
    case 'post_published':
      return <Camera className="h-4 w-4 text-green-600" />
    case 'location_visited':
      return <MapPin className="h-4 w-4 text-red-600" />
    case 'review_posted':
      return <Star className="h-4 w-4 text-yellow-600" />
    case 'media_uploaded':
      return <Camera className="h-4 w-4 text-purple-600" />
    default:
      return <User className="h-4 w-4 text-airbnb-dark-gray" />
  }
}

function getActivityTitle(type: string) {
  switch (type) {
    case 'trip_created':
      return 'created a new trip'
    case 'post_published':
      return 'shared a new story'
    case 'location_visited':
      return 'visited a location'
    case 'review_posted':
      return 'posted a review'
    case 'media_uploaded':
      return 'uploaded new photos'
    default:
      return 'had some activity'
  }
}

export default function LiveFeedPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-300 shadow-airbnb-light">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex lg:flex-1">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-rausch-500 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-title-medium text-airbnb-black font-semibold">TravelBlogr</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <Link href="/locations" className="text-body-large font-medium text-airbnb-black hover:text-airbnb-dark-gray transition-colors py-2 px-3 rounded-lg hover:bg-gray-50">
              Locations
            </Link>
            <Link href="/live-feed" className="text-body-large font-medium text-rausch-500 py-2 px-3 rounded-lg bg-rausch-50">
              Live Feed
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-3">
            <Link href="/auth/signin" className="text-body-large font-medium text-airbnb-black hover:text-airbnb-dark-gray transition-colors py-2 px-4 rounded-lg hover:bg-gray-50">
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-primary text-body-large font-semibold px-6 py-3 rounded-airbnb-small hover:scale-105 transition-transform">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-display-large text-airbnb-black mb-4">
              Live Travel Feed
            </h1>
            <p className="text-body-large text-airbnb-dark-gray max-w-2xl mx-auto leading-relaxed">
              Stay connected with the travel community. See what fellow travelers are discovering around the world.
            </p>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-6">
            {sampleActivities.map((activity) => (
              <div key={activity.id} className="card-elevated p-6 hover:shadow-airbnb-medium transition-all duration-300">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={activity.user.avatar}
                      alt={activity.user.name}
                      className="w-12 h-12 rounded-full object-cover shadow-airbnb-light"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <span className="text-body-large font-semibold text-airbnb-black">
                        {activity.user.name}
                      </span>
                      <span className="text-body-medium text-airbnb-dark-gray">
                        {getActivityTitle(activity.type)}
                      </span>
                      <span className="text-airbnb-dark-gray">•</span>
                      <span className="text-body-medium text-airbnb-dark-gray">
                        {activity.timestamp}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-body-large text-airbnb-black mb-4 leading-relaxed">
                      {activity.content}
                    </p>

                    {/* Location */}
                    {activity.location && (
                      <div className="flex items-center gap-2 text-body-medium text-airbnb-dark-gray bg-gray-50 px-3 py-2 rounded-airbnb-small mb-4 w-fit">
                        <MapPin className="h-4 w-4" />
                        <span>{activity.location}</span>
                      </div>
                    )}

                    {/* Image */}
                    {activity.image && (
                      <div className="rounded-airbnb-medium overflow-hidden shadow-airbnb-light mb-4">
                        <img
                          src={activity.image}
                          alt="Activity image"
                          className="w-full max-w-md object-cover"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                      <button className="flex items-center gap-2 text-body-medium text-airbnb-dark-gray hover:text-rausch-500 transition-colors py-2">
                        <Heart className="h-4 w-4" />
                        <span>{activity.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-body-medium text-airbnb-dark-gray hover:text-blue-600 transition-colors py-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>{activity.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 text-body-medium text-airbnb-dark-gray hover:text-green-600 transition-colors py-2">
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-display-small text-airbnb-black mb-4">
              Join the Conversation
            </h2>
            <p className="text-body-large text-airbnb-dark-gray mb-8 max-w-2xl mx-auto leading-relaxed">
              Share your own travel experiences and connect with fellow adventurers.
            </p>
            <Link 
              href="/auth/signup"
              className="btn-primary px-8 py-4 text-body-large font-semibold rounded-airbnb-small hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              Start Sharing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
