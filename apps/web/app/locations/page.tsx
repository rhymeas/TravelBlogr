import { Metadata } from 'next'
import { LocationsGrid } from '@/components/locations/LocationsGrid'
import { LocationsMap } from '@/components/locations/LocationsMap'
import { LocationsSearch } from '@/components/locations/LocationsSearch'
import { getAllLocations } from '@/lib/supabase/locations'
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/upstash'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { MapPin, Grid } from 'lucide-react'
import { HorizontalBannerAd } from '@/components/ads/HorizontalBannerAd'
import { AddLocationButton } from '@/components/locations/AddLocationButton'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore Locations | TravelBlogr',
  description: 'Discover amazing travel destinations, read detailed guides, and get inspired for your next adventure.',
}

export default async function LocationsPage() {
  // Get all published locations from Supabase (cached)
  const locations = await getOrSet(
    CacheKeys.locationsAll(),
    async () => await getAllLocations(),
    CacheTTL.MEDIUM // 1 hour
  )

  // Calculate location stats
  const locationStats = {
    total: locations.length,
    countries: new Set(locations.map(l => l.country).filter(Boolean)).size,
    regions: new Set(locations.map(l => l.region).filter(Boolean)).size
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="text-left max-w-3xl">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Explore Amazing Destinations
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Discover detailed travel guides, insider tips, and stunning photography
                from destinations around the world.
              </p>
              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
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
            <div className="mt-1">
              <AddLocationButton />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-6">
        <LocationsSearch categories={[]} />
      </div>

      {/* Horizontal Ad - After Search */}
      <HorizontalBannerAd
        slot="locations_top"
        page="locations"
        size="standard"
      />

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
