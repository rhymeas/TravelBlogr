'use client'

import { useState } from 'react'
import { Star, MapPin, Phone, ExternalLink, Utensils } from 'lucide-react'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LocationRestaurant } from '@/lib/data/locationsData'
import { InlineLocationEditor } from './InlineLocationEditor'

interface EditableLocationRestaurantsProps {
  locationId: string
  locationSlug: string
  restaurants: LocationRestaurant[]
  locationName: string
  enabled?: boolean
}

const priceRangeColors: Record<string, string> = {
  '$': 'bg-green-100 text-green-800',
  '$$': 'bg-blue-100 text-blue-800',
  '$$$': 'bg-yellow-100 text-yellow-800',
  '$$$$': 'bg-red-100 text-red-800'
}

export function EditableLocationRestaurants({
  locationId,
  locationSlug,
  restaurants: initialRestaurants,
  locationName,
  enabled = false,
}: EditableLocationRestaurantsProps) {
  const [restaurants, setRestaurants] = useState(initialRestaurants)
  const [showAll, setShowAll] = useState(false)

  // Show only 6 restaurants by default
  const INITIAL_DISPLAY_COUNT = 6
  const displayedRestaurants = showAll ? restaurants : restaurants.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMore = restaurants.length > INITIAL_DISPLAY_COUNT

  if (!restaurants || restaurants.length === 0) {
    return null
  }

  return (
    <Card className="card-elevated p-6 mb-8 relative group">
      <InlineLocationEditor
        locationId={locationId}
        locationSlug={locationSlug}
        field="restaurants"
        value={restaurants}
        onUpdate={setRestaurants}
        enabled={enabled}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-100 rounded-sleek-small flex items-center justify-center">
          <Utensils className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-title-medium font-semibold text-sleek-black">
            Restaurants & Culinary Experiences
          </h3>
          <p className="text-body-medium text-sleek-gray">
            Discover the best dining spots in {locationName}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="bg-white border border-sleek-border rounded-sleek-medium overflow-hidden hover:shadow-sleek-medium transition-all duration-300"
          >
            {/* Restaurant Image */}
            <div className="relative h-48 overflow-hidden">
              <Image
                src={restaurant.image || '/placeholder-restaurant.jpg'}
                alt={restaurant.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute top-3 right-3">
                <Badge className={`${priceRangeColors[restaurant.price_range]} font-semibold`}>
                  {restaurant.price_range}
                </Badge>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-body-large font-semibold text-sleek-black">
                  {restaurant.name}
                </h4>
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-sleek-small">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-body-small font-semibold text-yellow-700">
                    {restaurant.rating}
                  </span>
                </div>
              </div>

              <p className="text-body-medium text-sleek-dark-gray mb-3">
                {restaurant.description}
              </p>

              {/* Cuisine Badge */}
              <Badge variant="secondary" className="mb-3">
                {restaurant.cuisine}
              </Badge>

              {/* Specialties */}
              {restaurant.specialties && restaurant.specialties.length > 0 && (
                <div className="mb-3">
                  <p className="text-body-small font-medium text-sleek-black mb-1">
                    Specialties:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="text-body-small text-sleek-gray bg-gray-100 px-2 py-0.5 rounded-sleek-small"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 text-body-small text-sleek-gray">
                {restaurant.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{restaurant.address}</span>
                  </div>
                )}
                {restaurant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="hover:text-sleek-black transition-colors"
                    >
                      {restaurant.phone}
                    </a>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-sleek-black transition-colors truncate"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-6 w-full py-3 text-body-medium font-semibold text-sleek-black border border-sleek-border rounded-sleek-medium hover:bg-gray-50 transition-colors"
        >
          {showAll ? 'Show Less' : `Show All ${restaurants.length} Restaurants`}
        </button>
      )}
    </Card>
  )
}

