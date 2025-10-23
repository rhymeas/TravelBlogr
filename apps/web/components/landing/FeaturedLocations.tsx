'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ArrowRight, MapPin, Star, Eye } from 'lucide-react'
import { locations } from '@/lib/data/locationsData'

export function FeaturedLocations() {
  // Get featured locations for the landing page
  const featuredLocations = locations.filter(location => location.is_featured).slice(0, 6)

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-sleek-black mb-4">
            Discover Amazing Destinations
          </h2>
          <p className="text-lg text-sleek-dark-gray max-w-2xl mx-auto">
            Explore breathtaking locations shared by our community of travelers. Each destination comes with authentic stories and detailed travel guides.
          </p>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredLocations.map((location, index) => (
            <Link 
              key={location.id}
              href={`/locations/${location.slug}`}
              className="group block"
            >
              <Card className="overflow-hidden hover:shadow-sleek-large transition-all duration-300 group-hover:scale-[1.02]">
                {/* Location Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={location.featured_image}
                    alt={location.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Featured Badge */}
                  {location.is_featured && (
                    <Badge className="absolute top-3 left-3 bg-rausch-500 text-white">
                      Featured
                    </Badge>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Hover Content */}
                  <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowRight className="h-4 w-4" />
                      <span>Explore {location.name}</span>
                    </div>
                  </div>
                </div>

                {/* Location Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-sleek-black mb-1 group-hover:text-rausch-500 transition-colors">
                        {location.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sleek-gray text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>{location.region}, {location.country}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span className="font-semibold">{location.rating}</span>
                    </div>
                  </div>

                  <p className="text-sleek-dark-gray text-sm mb-4 line-clamp-2">
                    {location.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-sleek-gray">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{location.visit_count.toLocaleString()} visits</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{location.posts.length} stories</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link 
            href="/locations"
            className="inline-flex items-center gap-2 text-rausch-500 hover:text-rausch-600 font-semibold transition-colors"
          >
            View All Destinations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
