'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  MapPin, Star, Eye, Heart, Share2, 
  Calendar, Users, Camera, Clock 
} from 'lucide-react'

interface Location {
  id: string
  name: string
  country: string
  region: string
  description: string
  featured_image: string
  rating: number
  visit_count: number
  is_featured: boolean
  created_at: string
  location_posts: any[]
}

interface LocationHeaderProps {
  location: Location
}

export function LocationHeader({ location }: LocationHeaderProps) {
  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="relative h-96 lg:h-[500px] overflow-hidden">
        <Image
          src={location.featured_image || '/placeholder-location.jpg'}
          alt={location.name}
          fill
          className="object-cover"
          priority
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
          <div className="container mx-auto">
            <div className="flex items-end justify-between">
              <div className="text-white">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                  {location.is_featured && (
                    <Badge className="bg-yellow-500 text-yellow-900">
                      Featured Destination
                    </Badge>
                  )}
                  {location.rating && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {location.rating}/5
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-4xl lg:text-6xl font-bold mb-2">
                  {location.name}
                </h1>
                
                {/* Location */}
                <div className="flex items-center gap-2 text-lg lg:text-xl text-white/90 mb-4">
                  <MapPin className="h-5 w-5" />
                  <span>
                    {location.region && `${location.region}, `}{location.country}
                  </span>
                </div>

                {/* Description */}
                <p className="text-lg text-white/90 max-w-2xl line-clamp-3">
                  {location.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-6 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{location.visit_count?.toLocaleString() || 0} visits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span>{location.location_posts?.length || 0} stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Community favorite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Updated recently</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="hidden lg:flex items-center gap-3">
                <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  <Heart className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan Visit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="lg:hidden bg-white border-b p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Heart className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Calendar className="h-4 w-4 mr-2" />
            Plan Visit
          </Button>
        </div>
      </div>
    </div>
  )
}
