'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { Star, Heart, Eye, MapPin, Calendar, Users, Share2, Bookmark, Edit2 } from 'lucide-react'
import { Location } from '@/lib/data/locationsData'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LocationActivities } from './LocationActivities'
import { LocationRestaurants } from './LocationRestaurants'
import { LocationExperiences } from './LocationExperiences'
import { LocationDidYouKnow } from './LocationDidYouKnow'
import { LocationRecommendations } from './LocationRecommendations'
import { getSimpleLocationName } from '@/lib/utils/locationLinking'
import { EditableLocationDescription } from './EditableLocationDescription'
import { EditableLocationActivities } from './EditableLocationActivities'
import { EditableLocationRestaurants } from './EditableLocationRestaurants'
import { EditableLocationTitle } from './EditableLocationTitle'
import { LocationWeather } from './LocationWeather'
import { AuthenticatedLocationActions } from './AuthenticatedLocationActions'
import { SignUpPrompt } from '../auth/SignUpPrompt'
import { useAuth } from '@/hooks/useAuth'
import { SimpleLocationMap } from '@/components/maps/SimpleLocationMap'
import { LocationImageGallery } from './LocationImageGallery'
import { LocationRating } from './LocationRating'
import { LocationViewTracker } from './LocationViewTracker'
import { NotesWidget } from '@/components/notes/NotesWidget'
import { QuickBookingLinks } from './QuickBookingLinks'
import { SidebarAd } from '@/components/ads/SidebarAd'
import { HorizontalBannerAd } from '@/components/ads/HorizontalBannerAd'
import { LocationShareActions } from './LocationShareActions'
import { CommunityContributorBadge } from './CommunityContributorBadge'
import { CommunityActivityFeed } from './CommunityActivityFeed'
import { MultipleImageUpload } from '@/components/upload/ImageUpload'
import { uploadLocationImage } from '@/lib/services/imageUploadService'
import { useRouter } from 'next/navigation'

// Dynamic import to avoid SSR issues with emoji-picker-react
const LocationCommentSection = dynamic(
  () => import('./LocationCommentSection'),
  {
    ssr: false,
    loading: () => <div className="text-center py-8 text-gray-500">Loading comments...</div>
  }
)

interface LocationDetailTemplateProps {
  location: Location
  relatedLocations: Location[]
}

// Sleek loading skeleton component - matches actual page layout
function LocationDetailSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            <span className="text-gray-300">›</span>
            <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            <span className="text-gray-300">›</span>
            <div className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
          </div>
        </div>
      </div>

      {/* Title and rating skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6">
          <div className="h-12 w-80 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg mb-4" />
          <div className="flex items-center gap-4 mb-4">
            <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            <div className="h-6 w-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
          </div>
          {/* Rating stars skeleton */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-5 w-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            ))}
            <div className="h-5 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ml-2" />
          </div>
        </div>
      </div>

      {/* Image gallery skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
          <div className="grid grid-cols-4 gap-2 h-[500px]">
            <div className="col-span-2 row-span-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />
            <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />
            <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />
            <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />
            <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl" />
          </div>
        </div>
      </div>

      {/* Content skeleton - 2/3 + 1/3 layout */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description section */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="h-7 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                <div className="h-4 w-5/6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
              </div>
            </div>

            {/* Activities section */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="h-7 w-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg" />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ad skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg" />
            </div>
            {/* Weather skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg" />
            </div>
            {/* Actions skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator - centered at bottom */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg px-6 py-3 flex items-center gap-3 border border-gray-200 z-50">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm font-medium text-gray-700">Loading location details...</span>
      </div>
    </main>
  )

}

export function LocationDetailTemplate({ location, relatedLocations }: LocationDetailTemplateProps) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  // Image attribution + consent
  const defaultSourceName = ((user as any)?.user_metadata?.full_name) || (user?.email?.split('@')[0]) || 'Anonymous'
  const [sourceType, setSourceType] = useState<'self' | 'other'>('self')
  const [sourceName, setSourceName] = useState<string>(defaultSourceName)
  const [sourceUrl, setSourceUrl] = useState<string>('')
  const [consent, setConsent] = useState<boolean>(false)


  useEffect(() => {
    // Simulate content loading - show skeleton briefly for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  // Show loading skeleton while content is loading
  if (isLoading) {
    return <LocationDetailSkeleton />
  }

  return (
    <main className="animate-in fade-in duration-500">
      {/* View Tracker - Invisible pixel */}
      <LocationViewTracker locationSlug={location.slug} />

      {/* Non-intrusive vignette for edit focus */}
      {isEditMode && (
        <div className="pointer-events-none fixed inset-0 z-30">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/15 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/15 to-transparent" />
        </div>
      )}

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-body-small text-sleek-gray">
          <Link href="/locations" className="hover:text-sleek-black transition-colors">
            Locations
          </Link>
          <span className="text-sleek-gray">›</span>
          <Link href={`/locations?country=${location.country}`} className="hover:text-sleek-black transition-colors">
            {location.country}
          </Link>
          <span className="text-sleek-gray">›</span>
          <span className="text-sleek-black">{getSimpleLocationName(location.name)}</span>
        </nav>
      </div>

      {/* Title and Actions */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <EditableLocationTitle
              locationId={location.id}
              locationSlug={location.slug}
              locationName={location.name}
              enabled={isEditMode}
            />
            <div className="flex flex-col gap-3">
              {/* Star Rating Component */}
              <LocationRating
                locationId={location.id}
                locationSlug={location.slug}
                initialRating={location.rating || 0}
                initialRatingCount={location.rating_count || 0}
              />

              {/* Location Info */}
              <div className="flex items-center gap-4 text-body-medium text-sleek-dark-gray">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{(location.view_count || 0).toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {location.region && `${location.region}, `}{location.country}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
          <div className="flex items-center gap-3">
            {/* Community Contributor Badge */}
            <CommunityContributorBadge
              locationId={location.id}
              locationName={location.name}
            />

            {/* Edit Mode Toggle - Only for authenticated users */}
            {isAuthenticated && (
              <>
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={isEditMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Editing...' : 'Edit Page'}
                </Button>

                {/* Upload photos trigger - sleek gray button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-100 hover:bg-gray-200 text-sleek-black"
                  onClick={() => setIsUploadOpen(true)}
                >
                  Upload Photos
                </Button>
              </>
            )}

            {/* Share & Save Actions */}
            <LocationShareActions
              locationId={location.id}
              locationName={location.name}
              locationSlug={location.slug}
              variant="outline"
              size="sm"
              showLabels={true}
            />
          </div>
          <div className="max-w-[460px]">
            <p className="text-[11px] text-gray-600 border border-gray-200 rounded-full px-3 py-1 bg-gray-50">
              We don’t own images. Please share your photos to promote your favorite location.
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Image Gallery - Modern Lightbox */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-12">
        <LocationImageGallery
          images={location.images}
          locationName={location.name}
          locationSlug={location.slug}
          locationId={location.id}
        />
      </div>

      {/* Content Container */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-2">

            {/* Edit Mode Banner */}
            {isEditMode && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Edit2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Edit Mode Active</h3>
                    <p className="text-sm text-blue-700">
                      Hover over any section below to see the edit button. Your changes help improve this location for everyone!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* About Section - Editable */}
            <div className={isEditMode ? 'ring-2 ring-blue-300 ring-offset-4 rounded-lg transition-all' : ''}>
              <EditableLocationDescription
                locationId={location.id}
                locationSlug={location.slug}
                locationName={location.name}
                description={location.description}
                enabled={isEditMode}
              />
            </div>

            {/* Personal Notes Widget */}
            {isAuthenticated && (
              <div className="mb-8">
                <NotesWidget
                  type="location"
                  itemId={location.id}
                  itemName={location.name}
                  userId={user?.id}
                />
              </div>
            )}

            {/* CMS-Driven Content Sections - Editable */}
            <div className={isEditMode ? 'ring-2 ring-blue-300 ring-offset-4 rounded-lg transition-all' : ''}>
              <EditableLocationActivities
                locationId={location.id}
                locationSlug={location.slug}
                activities={location.activities || []}
                locationName={location.name}
                enabled={isEditMode}
              />
            </div>

            <div className={isEditMode ? 'ring-2 ring-blue-300 ring-offset-4 rounded-lg transition-all' : ''}>
              <EditableLocationRestaurants
                locationId={location.id}
                locationSlug={location.slug}
                restaurants={location.restaurants || []}
                locationName={location.name}
                enabled={isEditMode}
              />
            </div>

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

            {/* Horizontal Ad - Mid-content */}
            <div className="my-8">
              <HorizontalBannerAd
                slot="location_detail_mid"
                page="location-detail"
                size="standard"
              />
            </div>

            {/* Map Section */}
            {location.latitude && location.longitude && (
              <div className="mb-8">
                <h2 className="text-title-medium font-semibold text-sleek-black mb-6">
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
                <h2 className="text-title-medium font-semibold text-sleek-black">
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
                  <div key={post.id} className="flex gap-4 p-4 rounded-sleek-medium hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="relative w-24 h-24 rounded-sleek-small overflow-hidden flex-shrink-0">
                      <Image
                        src={post.image || '/placeholder-location.svg'}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body-large font-semibold text-sleek-black mb-1 truncate">
                        {post.title}
                      </h3>
                      <p className="text-body-small text-sleek-dark-gray mb-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-body-small text-sleek-gray">
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
              <h2 className="text-title-medium font-semibold text-sleek-black mb-6">
                Community Discussion
              </h2>
              <LocationCommentSection
                locationSlug={location.slug}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sidebar Ad - Top Position */}
            <SidebarAd
              slot="location_detail_sidebar"
              page="location-detail"
              size="medium"
              sticky={true}
            />

            {/* Authentication-Aware Actions - Moved above Weather */}
            {isAuthenticated ? (
              <AuthenticatedLocationActions
                locationId={location.id}
                locationName={location.name}
              />
            ) : (
              <SignUpPrompt context="location" />
            )}

            {/* Weather Widget */}
            <LocationWeather locationSlug={location.slug} locationName={location.name} />

            {/* Quick Booking Links - Affiliate Revenue */}
            <Card className="card-elevated p-6">
              <QuickBookingLinks
                locationName={location.name}
                latitude={location.latitude}
                longitude={location.longitude}
                context="location_sidebar"
              />
            </Card>

            {/* Community Activity Feed */}
            <div className="mb-6">
              <CommunityActivityFeed
                locationId={location.id}
                locationName={location.name}
              />
            </div>

            {/* Quick Stats */}
            <Card className="card-elevated p-6 mb-6">
              <h3 className="text-title-small font-semibold text-sleek-black mb-4">
                Location Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-medium text-sleek-gray">Total Visits</span>
                  <span className="text-body-medium font-semibold text-sleek-black">
                    {location.visit_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-medium text-sleek-gray">Travel Stories</span>
                  <span className="text-body-medium font-semibold text-sleek-black">
                    {location.posts.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-medium text-sleek-gray">Activities</span>
                  <span className="text-body-medium font-semibold text-sleek-black">
                    {location.activities?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body-medium text-sleek-gray">Restaurants</span>
                  <span className="text-body-medium font-semibold text-sleek-black">
                    {location.restaurants?.length || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Location Info */}
            <Card className="card-elevated p-6">
              <h3 className="text-title-small font-semibold text-sleek-black mb-4">
                Location Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-sleek-gray" />
                  <div>
                    <p className="text-body-small font-medium text-sleek-black">{location.region}</p>
                    <p className="text-body-small text-sleek-gray">{location.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-sleek-gray" />
                  <div>
                    <p className="text-body-small font-medium text-sleek-black">Added</p>
                    <p className="text-body-small text-sleek-gray">{location.created_at}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-sleek-gray" />
                  <div>
                    <p className="text-body-small font-medium text-sleek-black">Community</p>
                    <p className="text-body-small text-sleek-gray">
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

      {/* Floating Edit Mode CTA */}
      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 motion-safe:animate-in motion-safe:fade-in-0" onClick={() => !isProcessing && setIsUploadOpen(false)} />
          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-[61] w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-sleek-black">Add Photos to {location.name}</h3>
              <button
                onClick={() => !isProcessing && setIsUploadOpen(false)}
                className="pl-3 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >×</button>
            </div>

            {/* Tabs */}
            <div className="mb-3 flex justify-center gap-2">
              <button
                className={`px-3 py-1 rounded-full text-sm ${uploadMode==='upload' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setUploadMode('upload')}
                disabled={isProcessing}
              >Upload</button>
              <button
                className={`px-3 py-1 rounded-full text-sm ${uploadMode==='url' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setUploadMode('url')}
                disabled={isProcessing}
              >Paste URL</button>
            </div>

            {/* Attribution */}
            <div className="space-y-2 mb-2">
              <p className="text-xs font-medium text-gray-700">Attribution</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-full text-xs ${sourceType==='self' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setSourceType('self')}
                  disabled={isProcessing}
                >Use my name</button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-full text-xs ${sourceType==='other' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setSourceType('other')}
                  disabled={isProcessing}
                >Other source</button>
              </div>
              {sourceType === 'other' ? (
                <div className="grid gap-2">
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="Source name (required)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    disabled={isProcessing}
                  />
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Source URL (optional)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    disabled={isProcessing}
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      disabled={isProcessing}
                    />
                    I confirm I have permission/ownership to upload this image
                  </label>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Will be credited as {((user as any)?.user_metadata?.full_name) || user?.email?.split('@')[0] || 'your name'}
                </p>
              )}
            </div>

            {/* Content */}
            {uploadMode === 'upload' ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <MultipleImageUpload
                    bucket="location-images"
                    userId={user?.id as string}
                    folder={location.id}
                    onUploadError={() => {}}
                    onUploadComplete={async (items) => {
                      setIsProcessing(true)
                      const itemsOk = items.filter(i => !!i.url)

                      // Build source metadata
                      const userDisplay = ((user as any)?.user_metadata?.full_name) || user?.email?.split('@')[0] || 'Anonymous'
                      const metaSource = {
                        type: sourceType,
                        name: sourceType === 'self' ? userDisplay : sourceName,
                        url: sourceType === 'other' ? (sourceUrl || null) : null,
                        consent: sourceType === 'other' ? consent : true,
                        user_id: user?.id,
                        user_display: userDisplay,
                      }

                      // Gate third-party uploads on consent + name
                      if (sourceType === 'other' && (!sourceName || !consent)) {
                        setIsProcessing(false)
                        return
                      }

                      setProgress({ done: 0, total: itemsOk.length })
                      for (const item of itemsOk) {
                        try {
                          await fetch('/api/admin/add-location-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              locationSlug: location.slug,
                              imageUrl: item.url,
                              storagePath: item.path,
                              meta: { source: metaSource }
                            })
                          })
                        } catch {}
                        setProgress(prev => ({ ...prev, done: prev.done + 1 }))
                      }
                      setIsProcessing(false)
                      setIsUploadOpen(false)
                      router.refresh()
                    }}
                  />
                </div>

                {/* Progress */}
                {isProcessing && (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 animate-shimmer" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                  </div>
                )}

                {!isProcessing && (
                  <div className="mt-1 flex items-center justify-between">
                    <Button size="sm" variant="ghost" className="pl-3" onClick={() => setIsUploadOpen(false)}>Close</Button>
                    <Button size="sm" variant="outline" className="pr-3" onClick={() => setIsUploadOpen(false)}>Done</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={isProcessing}
                />
                <div className="mt-1 flex items-center justify-between">
                  <Button size="sm" variant="ghost" className="pl-3" onClick={() => setIsUploadOpen(false)}>Close</Button>
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-black pr-3"
                    disabled={!urlInput || isProcessing || (sourceType === 'other' && (!sourceName || !consent))}
                    onClick={async () => {
                      setIsProcessing(true)
                      setProgress({ done: 0, total: 1 })

                      // Build source metadata
                      const userDisplay = ((user as any)?.user_metadata?.full_name) || user?.email?.split('@')[0] || 'Anonymous'
                      const metaSource = {
                        type: sourceType,
                        name: sourceType === 'self' ? userDisplay : sourceName,
                        url: sourceType === 'other' ? (sourceUrl || null) : null,
                        consent: sourceType === 'other' ? consent : true,
                        user_id: user?.id,
                        user_display: userDisplay,
                      }

                      try {
                        // Try to fetch and re-upload to Supabase Storage
                        const res = await fetch(urlInput)
                        const blob = await res.blob()
                        const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' })
                        const result = await uploadLocationImage(file, user?.id as string, location.id)
                        const imageUrl = result.url || urlInput
                        await fetch('/api/admin/add-location-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ locationSlug: location.slug, imageUrl, storagePath: result.path, meta: { size: result.size, dimensions: result.dimensions, source: metaSource } })
                        })
                      } catch (e) {
                        // Fallback: add remote URL directly
                        await fetch('/api/admin/add-location-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ locationSlug: location.slug, imageUrl: urlInput, meta: { source: metaSource, original_url: urlInput } })
                        })
                      }
                      setProgress({ done: 1, total: 1 })
                      setIsProcessing(false)
                      setIsUploadOpen(false)
                      router.refresh()
                    }}
                  >Add Photo</Button>
                </div>

                {isProcessing && (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 animate-shimmer" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center">Tip: We try to store a local copy for speed. Some websites block downloads; in that case we’ll link the URL.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-white rounded-full shadow-2xl px-8 py-4 flex items-center gap-4 border-2 border-blue-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                Edit mode active - Hover over sections to edit
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => setIsEditMode(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Done Editing
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}