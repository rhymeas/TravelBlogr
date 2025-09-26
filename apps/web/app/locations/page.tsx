import { Metadata } from 'next'
import { LocationsGrid } from '@/components/locations/LocationsGrid'
import { LocationsMap } from '@/components/locations/LocationsMap'
import { LocationsSearch } from '@/components/locations/LocationsSearch'
import { createServerSupabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { MapPin, Grid, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Explore Locations | TravelBlogr',
  description: 'Discover amazing travel destinations, read detailed guides, and get inspired for your next adventure.',
}

export default async function LocationsPage() {
  const supabase = createServerSupabase()
  
  // Get featured locations and popular destinations
  const { data: locations } = await supabase
    .from('locations')
    .select(`
      *,
      location_posts!inner (
        id,
        title,
        excerpt,
        featured_image,
        published_at,
        view_count,
        like_count
      )
    `)
    .eq('is_featured', true)
    .eq('location_posts.status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)

  // Get location categories
  const { data: categories } = await supabase
    .from('location_categories')
    .select('*')
    .order('name')

  // Get location stats
  const { data: stats } = await supabase
    .from('locations')
    .select('id, country, region')

  const locationStats = {
    total: stats?.length || 0,
    countries: [...new Set(stats?.map(s => s.country))].length || 0,
    regions: [...new Set(stats?.map(s => s.region))].length || 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Amazing Destinations
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Discover detailed travel guides, insider tips, and stunning photography 
              from destinations around the world.
            </p>
            
            {/* Stats */}
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{locationStats.total} Locations</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🌍</span>
                <span>{locationStats.countries} Countries</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🗺️</span>
                <span>{locationStats.regions} Regions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-6">
        <LocationsSearch categories={categories || []} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-12">
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <LocationsGrid locations={locations || []} />
          </TabsContent>

          <TabsContent value="map">
            <LocationsMap locations={locations || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
