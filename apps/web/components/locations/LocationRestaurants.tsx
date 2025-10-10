'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, ExternalLink, Phone, MapPin, Utensils } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LocationRestaurant } from '@/lib/data/locationsData'
import { useEffect, useState } from 'react'

interface LocationRestaurantsProps {
  locationSlug?: string
  restaurants?: LocationRestaurant[]
  locationName: string
}

interface DBRestaurant {
  id: string
  name: string
  description?: string
  cuisine: string
  price_range?: string
  rating?: number
  image_url?: string
  website?: string
  address?: string
  phone?: string
  specialties?: string[]
}

const priceRangeColors: Record<string, string> = {
  '$': 'bg-green-100 text-green-800',
  '$$': 'bg-blue-100 text-blue-800',
  '$$$': 'bg-yellow-100 text-yellow-800',
  '$$$$': 'bg-red-100 text-red-800'
}

export function LocationRestaurants({ locationSlug, restaurants: initialRestaurants, locationName }: LocationRestaurantsProps) {
  const [restaurants, setRestaurants] = useState<any[]>(initialRestaurants || [])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Show only 6 restaurants by default
  const INITIAL_DISPLAY_COUNT = 6
  const displayedRestaurants = showAll ? restaurants : restaurants.slice(0, INITIAL_DISPLAY_COUNT)
  const hasMore = restaurants.length > INITIAL_DISPLAY_COUNT

  // Fetch real restaurant data if locationSlug is provided
  useEffect(() => {
    if (locationSlug && !initialRestaurants) {
      setLoading(true)
      fetch(`/api/locations/${locationSlug}/restaurants`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // Transform DB format to component format
            const transformed = data.data.map((r: DBRestaurant, idx: number) => {
              // Handle image URL - use from DB or generate placeholder
              let imageUrl = r.image_url
              if (!imageUrl || imageUrl === '') {
                // Use Unsplash food images as fallback
                const foodImages = [
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
                  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
                  'https://images.unsplash.com/photo-1552566626-52f8b828add9',
                  'https://images.unsplash.com/photo-1559339352-11d035aa65de'
                ]
                imageUrl = foodImages[idx % foodImages.length] + '?w=800&q=80'
              }

              return {
                id: r.id,
                name: r.name,
                description: r.description || 'Delicious dining experience',
                cuisine: r.cuisine,
                price_range: r.price_range || '$$',
                rating: r.rating || 4.0,
                image: imageUrl,
                website: r.website,
                address: r.address || 'Address not available',
                phone: r.phone,
                specialties: r.specialties || []
              }
            })
            setRestaurants(transformed)
          }
        })
        .catch(err => console.error('Error fetching restaurants:', err))
        .finally(() => setLoading(false))
    }
  }, [locationSlug, initialRestaurants])

  if (loading) {
    return (
      <Card className="card-elevated p-6 mb-8">
        <div className="text-center py-8 text-airbnb-gray">
          Loading restaurants...
        </div>
      </Card>
    )
  }

  if (!restaurants || restaurants.length === 0) {
    return null
  }

  return (
    <Card className="card-elevated p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-100 rounded-airbnb-small flex items-center justify-center">
          <Utensils className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-title-medium font-semibold text-airbnb-black">
            Restaurants & Culinary Experiences
          </h3>
          <p className="text-body-medium text-airbnb-gray">
            Discover the best dining spots in {locationName}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="bg-white border border-airbnb-border rounded-airbnb-medium overflow-hidden hover:shadow-airbnb-medium transition-all duration-300"
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

            {/* Restaurant Details */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-body-large font-semibold text-airbnb-black">
                  {restaurant.name}
                </h4>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-body-small font-semibold text-airbnb-black">
                    {restaurant.rating}
                  </span>
                </div>
              </div>

              <p className="text-body-medium text-airbnb-dark-gray mb-3">
                {restaurant.description}
              </p>

              {/* Cuisine & Address */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-body-small text-airbnb-gray">
                  <Utensils className="h-4 w-4" />
                  <span>{restaurant.cuisine} Cuisine</span>
                </div>
                <div className="flex items-center gap-2 text-body-small text-airbnb-gray">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.address}</span>
                </div>
              </div>

              {/* Specialties */}
              {restaurant.specialties && restaurant.specialties.length > 0 && (
                <div className="mb-4">
                  <p className="text-body-small font-medium text-airbnb-black mb-2">
                    Specialties:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {restaurant.specialties.slice(0, 3).map((specialty: string, index: number) => (
                      <Badge
                        key={index}
                        className="bg-gray-100 text-gray-700 text-xs"
                      >
                        {specialty}
                      </Badge>
                    ))}
                    {restaurant.specialties.length > 3 && (
                      <Badge className="bg-gray-100 text-gray-700 text-xs">
                        +{restaurant.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {restaurant.website && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 btn-secondary"
                  >
                    <Link
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </Link>
                  </Button>
                )}
                {restaurant.phone && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 btn-secondary"
                  >
                    <Link
                      href={`tel:${restaurant.phone}`}
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && !showAll && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => setShowAll(true)}
            variant="outline"
            className="btn-secondary"
          >
            Load More Restaurants ({restaurants.length - INITIAL_DISPLAY_COUNT} more)
          </Button>
        </div>
      )}

      {/* Show Less Button */}
      {showAll && hasMore && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => setShowAll(false)}
            variant="outline"
            className="btn-secondary"
          >
            Show Less
          </Button>
        </div>
      )}

      {/* CMS Edit Note */}
      <div className="mt-6 pt-4 border-t border-airbnb-border">
        <p className="text-body-small text-airbnb-gray italic">
          Restaurant information can be easily updated through the CMS.
          Add new restaurants, update menus, or modify contact details without code changes.
        </p>
      </div>
    </Card>
  )
}
