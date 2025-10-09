'use client'

import Link from 'next/link'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { Star, Heart, Eye, MapPin, Calendar, Users, Share2, Bookmark } from 'lucide-react'
import { Location } from '@/lib/data/locationsData'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LocationActivities } from './LocationActivities'
import { LocationRestaurants } from './LocationRestaurants'
import { LocationExperiences } from './LocationExperiences'
import { LocationDidYouKnow } from './LocationDidYouKnow'
import { LocationRecommendations } from './LocationRecommendations'
import { LocationWeather } from './LocationWeather'
import { AuthenticatedLocationActions } from './AuthenticatedLocationActions'
import { SignUpPrompt } from '../auth/SignUpPrompt'
import { useAuth } from '@/hooks/useAuth'
import { SimpleLocationMap } from '@/components/maps/SimpleLocationMap'
import { LocationImageGallery } from './LocationImageGallery'
import { LocationRating } from './LocationRating'
import { LocationViewTracker } from './LocationViewTracker'
import { LocationCommentSection } from './LocationCommentSection'

interface LocationDetailTemplateProps {
  location: Location
  relatedLocations: Location[]
}

export function LocationDetailTemplate({ location, relatedLocations }: LocationDetailTemplateProps) {
  const { isAuthenticated } = useAuth()

  return (
    <main>
      {/* View Tracker - Invisible pixel */}
      <LocationViewTracker locationSlug={location.slug} />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-body-small text-airbnb-gray">
          <Link href="/locations" className="hover:text-airbnb-black transition-colors">
            Locations
          </Link>
          <span className="text-airbnb-gray">›</span>
          <Link href={`/locations?country=${location.country}`} className="hover:text-airbnb-black transition-colors">
            {location.country}
          </Link>
          <span className="text-airbnb-gray">›</span>
          <span className="text-airbnb-black">{location.name}</span>
        </nav>
      </div>

      {/* Title and Actions */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-display-medium font-bold text-airbnb-black mb-2">
              {location.name}
            </h1>
            <div className="flex flex-col gap-3">
              {/* Star Rating Component */}
              <LocationRating
                locationSlug={location.slug}
                initialRating={location.rating || 0}
                initialRatingCount={location.rating_count || 0}
              />

              {/* Location Info */}
              <div className="flex items-center gap-4 text-body-medium text-airbnb-dark-gray">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{(location.view_count || 0).toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{location.region}, {location.country}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery - Modern Lightbox */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-12">
        <LocationImageGallery
          images={location.images}
          locationName={location.name}
          locationSlug={location.slug}
        />
      </div>

      {/* Content Container */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2">

            {/* About Section */}
            <Card className="card-elevated p-6 mb-8">
              <h2 className="text-title-medium font-semibold text-airbnb-black mb-4">
                About this location
              </h2>
              <p className="text-body-medium text-airbnb-dark-gray leading-relaxed">
                {location.description}
              </p>
            </Card>

            {/* CMS-Driven Content Sections */}
            <LocationActivities
              locationSlug={location.slug}
              activities={location.activities || []}
              locationName={location.name}
            />

            <LocationRestaurants
              locationSlug={location.slug}
              restaurants={location.restaurants || []}
              locationName={location.name}
            />

            <LocationExperiences
              locationSlug={location.slug}
              experiences={location.experiences || []}
              locationName={location.name}
            />

            <LocationDidYouKnow
              locationSlug={location.slug}
              didYouKnow={location.did_you_know || []}
              locationName={location.name}
            />

            {/* Map Section */}
            {location.latitude && location.longitude && (
              <div className="mb-8">
                <h2 className="text-title-medium font-semibold text-airbnb-black mb-6">
                  📍 Location Map
                </h2>
                <SimpleLocationMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                  name={location.name}
                  restaurants={location.restaurants?.slice(0, 10)}
                  activities={location.activities?.slice(0, 10)}
                />
              </div>
            )}

            {/* Travel Stories Section */}
            <Card className="card-elevated p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-title-medium font-semibold text-airbnb-black">
                  Recent Travel Stories
                </h2>
                <Link 
                  href={`/locations/${location.slug}/stories`} 
                  className="text-body-medium text-rausch-500 hover:text-rausch-600 font-semibold"
                >
                  View all stories
                </Link>
              </div>

              <div className="space-y-6">
                {location.posts.map((post) => (
                  <div key={post.id} className="flex gap-4 p-4 rounded-airbnb-medium hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="relative w-24 h-24 rounded-airbnb-small overflow-hidden flex-shrink-0">
                      <Image
                        src={post.image || '/placeholder-location.svg'}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body-large font-semibold text-airbnb-black mb-1 truncate">
                        {post.title}
                      </h3>
                      <p className="text-body-small text-airbnb-dark-gray mb-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-body-small text-airbnb-gray">
                        <span>by {post.author}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views}
                          </span>
                          <span>{post.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Community Comments Section */}
            <Card className="card-elevated p-6 mb-8">
              <h2 className="text-title-medium font-semibold text-airbnb-black mb-6">
                Community Discussion
              </h2>
              <LocationCommentSection
                locationSlug={location.slug}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Weather Widget */}
            <LocationWeather locationSlug={location.slug} locationName={location.name} />

            {/* Authentication-Aware Actions */}
            {isAuthenticated ? (
              <AuthenticatedLocationActions
                locationId={location.id}
                locationName={location.name}
              />
            ) : (
              <SignUpPrompt context="location" />
            )}

            {/* Quick Stats */}
            <Card className="card-elevated p-6 mb-6">
              <h3 className="text-title-small font-semibold text-airbnb-black mb-4">
                Location Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-medium text-airbnb-gray">Total Visits</span>
                  <span className="text-body-medium font-semibold text-airbnb-black">
                    {location.visit_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-medium text-airbnb-gray">Travel Stories</span>
                  <span className="text-body-medium font-semibold text-airbnb-black">
                    {location.posts.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-medium text-airbnb-gray">Activities</span>
                  <span className="text-body-medium font-semibold text-airbnb-black">
                    {location.activities?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-medium text-airbnb-gray">Restaurants</span>
                  <span className="text-body-medium font-semibold text-airbnb-black">
                    {location.restaurants?.length || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Location Info */}
            <Card className="card-elevated p-6">
              <h3 className="text-title-small font-semibold text-airbnb-black mb-4">
                Location Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-airbnb-gray" />
                  <div>
                    <p className="text-body-small font-medium text-airbnb-black">{location.region}</p>
                    <p className="text-body-small text-airbnb-gray">{location.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-airbnb-gray" />
                  <div>
                    <p className="text-body-small font-medium text-airbnb-black">Added</p>
                    <p className="text-body-small text-airbnb-gray">{location.created_at}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-airbnb-gray" />
                  <div>
                    <p className="text-body-small font-medium text-airbnb-black">Community</p>
                    <p className="text-body-small text-airbnb-gray">
                      {location.visit_count > 10000 ? 'Very Popular' : 'Popular'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <LocationRecommendations 
        currentLocation={location}
        relatedLocations={relatedLocations}
      />
    </main>
  )
}