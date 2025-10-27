'use client'

import Link from 'next/link'
import { Star, MapPin, Eye, Heart, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Location } from '@/lib/data/locationsData'

interface LocationRecommendationsProps {
  currentLocation: Location
  relatedLocations: Location[]
  title?: string
}

export function LocationRecommendations({ 
  currentLocation, 
  relatedLocations, 
  title 
}: LocationRecommendationsProps) {
  if (!relatedLocations || relatedLocations.length === 0) {
    return null
  }

  const sectionTitle = title || `More places in ${currentLocation.country}`

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-title-large font-semibold text-sleek-black">
          {sectionTitle}
        </h2>
        <Button
          asChild
          variant="outline"
          className="btn-secondary hidden md:flex items-center gap-2"
        >
          <Link href="/locations" className="flex items-center gap-2">
            Explore All Locations
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedLocations.slice(0, 4).map((location) => (
          <div
            key={location.id}
            className="group cursor-pointer"
          >
            <Card className="card-elevated overflow-hidden hover:shadow-sleek-xl transition-all duration-300 group-hover:scale-[1.02]">
              {/* Location Image */}
              <div className="relative h-48 overflow-hidden">
                <Link href={`/locations/${location.slug}`} className="block" aria-label={`${location.name} details`}>
                  <img
                    src={location.featured_image}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </Link>

                {/* Featured Badge */}
                {location.is_featured && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-rausch-500 text-white">
                      Featured
                    </Badge>
                  </div>
                )}

                {/* Rating Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/90 text-sleek-black flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-400" />
                    {location.rating}
                  </Badge>
                </div>
              </div>

              {/* Location Details */}
              <div className="p-4">
                <h3 className="text-body-large font-semibold text-sleek-black mb-1 group-hover:text-rausch-500 transition-colors">
                  <Link href={`/locations/${location.slug}`} className="hover:underline decoration-transparent hover:decoration-inherit">
                    {location.name}
                  </Link>
                </h3>
                
                <div className="flex items-center gap-1 text-sleek-gray text-body-medium mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {location.country}
                  </span>
                </div>

                <p className="text-body-small text-sleek-dark-gray mb-4 line-clamp-2">
                  {location.description}
                </p>

                {/* Location Stats */}
                <div className="flex items-center justify-between text-body-small text-sleek-gray">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{location.visit_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{location.posts.length}</span>
                    </div>
                  </div>

                  {/* Activity Count */}
                  {location.activities && location.activities.length > 0 && (
                    <Badge className="bg-blue-50 text-blue-700 text-xs">
                      {location.activities.length} activities
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Mobile View All Button */}
      <div className="mt-8 text-center md:hidden">
        <Button
          asChild
          variant="outline"
          className="btn-secondary"
        >
          <Link href="/locations" className="flex items-center gap-2">
            Explore All Locations
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>

      {/* CMS Integration Note */}
      <div className="mt-8 p-4 bg-gray-50 rounded-sleek-medium">
        <p className="text-body-small text-sleek-gray text-center">
          <strong>Info:</strong> Recommendations are automatically generated based on location similarity, user preferences, and content relationships.
        </p>
      </div>
    </div>
  )
}
