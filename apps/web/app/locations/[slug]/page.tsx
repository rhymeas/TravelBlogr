import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LocationHeader } from '@/components/locations/LocationHeader'
import { LocationContent } from '@/components/locations/LocationContent'
import { LocationGallery } from '@/components/locations/LocationGallery'
import { LocationMap } from '@/components/locations/LocationMap'
import { LocationPosts } from '@/components/locations/LocationPosts'
import { LocationWeather } from '@/components/locations/LocationWeather'
import { LocationTips } from '@/components/locations/LocationTips'
import { RelatedLocations } from '@/components/locations/RelatedLocations'
import { createServerSupabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  MapPin, Camera, FileText, Cloud, Lightbulb, 
  Navigation, Star, Clock, DollarSign 
} from 'lucide-react'

interface LocationPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const supabase = createServerSupabase()
  
  const { data: location } = await supabase
    .from('locations')
    .select('name, description, featured_image, country, region')
    .eq('slug', params.slug)
    .single()

  if (!location) {
    return {
      title: 'Location Not Found | TravelBlogr'
    }
  }

  return {
    title: `${location.name}, ${location.country} | TravelBlogr`,
    description: location.description || `Discover ${location.name} in ${location.region}, ${location.country}. Travel guides, tips, and stunning photography.`,
    openGraph: {
      title: `${location.name}, ${location.country}`,
      description: location.description,
      images: location.featured_image ? [location.featured_image] : [],
    }
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const supabase = createServerSupabase()
  
  // Get location with all related data
  const { data: location, error } = await supabase
    .from('locations')
    .select(`
      *,
      location_posts!inner (
        id,
        title,
        slug,
        excerpt,
        content,
        featured_image,
        published_at,
        view_count,
        like_count,
        author:users (
          id,
          name,
          avatar_url
        )
      ),
      location_media (
        id,
        url,
        thumbnail_url,
        title,
        caption,
        type
      ),
      location_tips (
        id,
        category,
        title,
        content,
        is_featured
      )
    `)
    .eq('slug', params.slug)
    .eq('location_posts.status', 'published')
    .order('location_posts.published_at', { ascending: false })
    .single()

  if (error || !location) {
    notFound()
  }

  // Get related locations
  const { data: relatedLocations } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      slug,
      country,
      region,
      featured_image,
      description,
      rating,
      visit_count
    `)
    .neq('id', location.id)
    .or(`country.eq.${location.country},region.eq.${location.region}`)
    .limit(6)

  // Update view count
  await supabase
    .from('locations')
    .update({ 
      visit_count: (location.visit_count || 0) + 1,
      last_visited: new Date().toISOString()
    })
    .eq('id', location.id)

  return (
    <div className="min-h-screen bg-white">
      {/* Location Header */}
      <LocationHeader location={location} />

      {/* Navigation Tabs */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6 max-w-4xl mx-auto">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Map</span>
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Stories</span>
              </TabsTrigger>
              <TabsTrigger value="weather" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span className="hidden sm:inline">Weather</span>
              </TabsTrigger>
              <TabsTrigger value="tips" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Tips</span>
              </TabsTrigger>
            </TabsList>

            <div className="py-8">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2">
                    <LocationContent location={location} />
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Quick Facts */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Quick Facts</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Country</span>
                          <span className="font-medium">{location.country}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Region</span>
                          <span className="font-medium">{location.region}</span>
                        </div>
                        {location.timezone && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Timezone</span>
                            <span className="font-medium">{location.timezone}</span>
                          </div>
                        )}
                        {location.currency && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Currency</span>
                            <span className="font-medium">{location.currency}</span>
                          </div>
                        )}
                        {location.language && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Language</span>
                            <span className="font-medium">{location.language}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rating & Stats */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
                      <div className="space-y-3">
                        {location.rating && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{location.rating}/5</span>
                            <span className="text-gray-600 text-sm">rating</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{location.visit_count || 0}</span>
                          <span className="text-gray-600 text-sm">visits</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{location.location_posts?.length || 0}</span>
                          <span className="text-gray-600 text-sm">stories</span>
                        </div>
                      </div>
                    </div>

                    {/* Best Time to Visit */}
                    {location.best_time_to_visit && (
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Best Time to Visit
                        </h3>
                        <p className="text-sm text-gray-700">{location.best_time_to_visit}</p>
                      </div>
                    )}

                    {/* Budget Info */}
                    {location.budget_info && (
                      <div className="bg-green-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          Budget Guide
                        </h3>
                        <p className="text-sm text-gray-700">{location.budget_info}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery">
                <LocationGallery media={location.location_media || []} />
              </TabsContent>

              {/* Map Tab */}
              <TabsContent value="map">
                <LocationMap location={location} />
              </TabsContent>

              {/* Posts Tab */}
              <TabsContent value="posts">
                <LocationPosts posts={location.location_posts || []} />
              </TabsContent>

              {/* Weather Tab */}
              <TabsContent value="weather">
                <LocationWeather location={location} />
              </TabsContent>

              {/* Tips Tab */}
              <TabsContent value="tips">
                <LocationTips tips={location.location_tips || []} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Related Locations */}
      {relatedLocations && relatedLocations.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <RelatedLocations locations={relatedLocations} />
          </div>
        </div>
      )}
    </div>
  )
}
