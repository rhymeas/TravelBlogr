'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calendar, Share2, Download, Heart, Eye } from 'lucide-react'
import { TripMap } from '@/components/maps/TripMap'
import { Button } from '@/components/ui/Button'
import { formatDistanceToNow } from 'date-fns'
import { TripCommentSection } from '@/components/comments/TripCommentSection'

interface SharedTripViewProps {
  shareLink: any
  trip: any
  subdomain: string
}

export function SharedTripView({ shareLink, trip, subdomain }: SharedTripViewProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  
  const settings = shareLink.settings || {}
  const customization = shareLink.customization || {}
  const author = trip.users

  useEffect(() => {
    // Apply custom CSS if provided
    if (customization.customCSS) {
      const style = document.createElement('style')
      style.textContent = customization.customCSS
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [customization.customCSS])

  // Apply custom theme colors
  const themeStyles = {
    '--primary-color': customization.primaryColor || '#3b82f6',
    '--background-color': customization.backgroundColor || '#ffffff',
    '--text-color': customization.textColor || '#1f2937',
    '--font-family': customization.fontFamily || 'Inter'
  } as React.CSSProperties

  const handleShare = async () => {
    const shareData = {
      title: trip.title,
      text: trip.description || `Check out ${author?.full_name || 'this'}'s travel story`,
      url: `https://${subdomain}.travelblogr.com`
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareData.url)
        alert('Link copied to clipboard!')
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
      alert('Link copied to clipboard!')
    }
  }

  const handleDownload = () => {
    // Implement download functionality
    window.print()
  }

  const handleLike = async () => {
    // Implement like functionality
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
  }

  // Filter posts based on settings
  const visiblePosts = trip.posts?.filter((post: any) => {
    if (!settings.showPrivateNotes && post.is_private) return false
    return true
  }) || []

  // Extract locations from posts
  const locations = visiblePosts
    .filter((post: any) => post.location)
    .map((post: any, index: number) => ({
      id: post.id,
      name: post.title || `Stop ${index + 1}`,
      coordinates: [post.location.lng, post.location.lat],
      description: post.content?.substring(0, 100) + '...',
      date: post.post_date,
      photos: post.photos
    }))

  return (
    <div 
      className="min-h-screen"
      style={themeStyles}
    >
      {/* Custom Favicon */}
      {customization.favicon && (
        <link rel="icon" href={customization.favicon} />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {customization.logo && (
                <img 
                  src={customization.logo} 
                  alt="Logo" 
                  className="h-10 w-auto"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: customization.textColor }}>
                  {trip.title}
                </h1>
                {author && (
                  <div className="flex items-center gap-2 mt-1">
                    {author.avatar_url && (
                      <img 
                        src={author.avatar_url} 
                        alt={author.full_name}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-gray-600">
                      by {author.full_name || author.username}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {settings.allowDownload && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Button variant="outline" size="sm" onClick={handleLike}>
                <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                {likeCount}
              </Button>
            </div>
          </div>

          {/* Trip Info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            {settings.showDates && trip.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(trip.start_date).toLocaleDateString()}
                {trip.end_date && trip.end_date !== trip.start_date && (
                  <span> - {new Date(trip.end_date).toLocaleDateString()}</span>
                )}
              </div>
            )}
            
            {settings.showLocation && locations.length > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {locations.length} location{locations.length !== 1 ? 's' : ''}
              </div>
            )}

            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {shareLink.view_count} views
            </div>
          </div>

          {/* Custom Message */}
          {customization.customMessage && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">{customization.customMessage}</p>
            </div>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {settings.showPhotos && trip.cover_image && (
        <div className="relative h-96 bg-gray-200">
          <img 
            src={trip.cover_image}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          {settings.watermarkPhotos && (
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              TravelBlogr
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {trip.description && (
              <div>
                <h2 className="text-xl font-semibold mb-4">About This Trip</h2>
                <p className="text-gray-700 leading-relaxed">{trip.description}</p>
              </div>
            )}

            {/* Posts */}
            {visiblePosts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Journey Highlights</h2>
                <div className="space-y-8">
                  {visiblePosts.map((post: any) => (
                    <article key={post.id} className="border-b border-gray-200 pb-8">
                      <h3 className="text-lg font-medium mb-2">{post.title}</h3>
                      
                      {settings.showDates && post.post_date && (
                        <p className="text-sm text-gray-500 mb-3">
                          {new Date(post.post_date).toLocaleDateString()}
                        </p>
                      )}

                      {post.content && (
                        <div className="prose max-w-none mb-4">
                          <p>{post.content}</p>
                        </div>
                      )}

                      {settings.showPhotos && post.photos && post.photos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {post.photos.slice(0, 4).map((photo: string, index: number) => (
                            <div key={index} className="relative">
                              <img 
                                src={photo}
                                alt={`${post.title} - Photo ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              {settings.watermarkPhotos && (
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                  TravelBlogr
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            {settings.showLocation && locations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Journey Map</h3>
                <TripMap 
                  locations={locations}
                  showRoute={true}
                  height="300px"
                  interactive={true}
                />
              </div>
            )}

            {/* Author Info */}
            {settings.showPersonalInfo && author && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">About the Traveler</h3>
                <div className="flex items-center gap-3 mb-3">
                  {author.avatar_url && (
                    <img 
                      src={author.avatar_url}
                      alt={author.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{author.full_name || author.username}</p>
                    {author.bio && (
                      <p className="text-sm text-gray-600">{author.bio}</p>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {customization.socialLinks && (
                  <div className="flex gap-2 mt-4">
                    {Object.entries(customization.socialLinks).map(([platform, url]) => 
                      url && (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 capitalize"
                        >
                          {platform}
                        </a>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Trip Stats */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Trip Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>
                    {trip.start_date && trip.end_date 
                      ? Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + ' days'
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Locations:</span>
                  <span>{locations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Posts:</span>
                  <span>{visiblePosts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span>{shareLink.view_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Comments Section */}
      {settings.showComments !== false && (
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
          <TripCommentSection
            tripId={trip.id}
            tripOwnerId={trip.user_id}
            className="bg-white rounded-lg shadow-sm p-6"
          />
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            {customization.showBranding !== false && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="text-gray-600">
                  Powered by <strong>TravelBlogr</strong>
                </span>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              Last updated {formatDistanceToNow(new Date(trip.updated_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
