import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Star, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { getLocationByName } from '@/lib/data/locationsData'

interface TripCardProps {
  trip: {
    id: string
    name: string
    dates: string
    image: string
    imageAlt: string
    description?: string
    accommodation: {
      name: string
      nights: number
      link?: string
    }
    restaurants?: {
      name: string
      type?: string
    }[]
    activities?: {
      name: string
      description?: string
    }[]
    didYouKnow: string
    highlights?: string[]
  }
  position: 'left' | 'right'
}

export function TripCard({ trip, position }: TripCardProps) {
  const isLeft = position === 'left'
  
  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className={`lg:w-1/2 ${isLeft ? 'lg:pr-6 flex justify-end' : 'lg:pr-6'}`}>
        {isLeft ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 relative hover:shadow-md transition-shadow w-[70%]">
            {/* Timeline Dot */}
            <div className="absolute w-6 h-6 bg-teal-400 rounded-full border-3 border-white shadow-sm hidden lg:block -right-3 top-6"></div>
            
            <TripCardContent trip={trip} />
          </div>
        ) : (
          <div className="lg:w-full">
            {/* Empty space for alternating layout */}
          </div>
        )}
      </div>
      
      <div className={`lg:w-1/2 ${isLeft ? 'lg:pl-6' : 'lg:pl-6 flex justify-start'}`}>
        {!isLeft ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 relative hover:shadow-md transition-shadow w-[70%]">
            {/* Timeline Dot */}
            <div className="absolute w-6 h-6 bg-teal-400 rounded-full border-3 border-white shadow-sm hidden lg:block -left-3 top-6"></div>
            
            <TripCardContent trip={trip} />
          </div>
        ) : (
          <div className="lg:w-full">
            {/* Empty space for alternating layout */}
          </div>
        )}
      </div>
    </div>
  )
}

function TripCardContent({ trip }: { trip: TripCardProps['trip'] }) {
  // Try to find matching location for linking
  const matchingLocation = getLocationByName(trip.name)

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        {matchingLocation ? (
          <Link
            href={`/locations/${matchingLocation.slug}`}
            className="text-lg font-semibold text-airbnb-black hover:text-rausch-500 transition-colors cursor-pointer"
          >
            {trip.name}
          </Link>
        ) : (
          <h3 className="text-lg font-semibold text-airbnb-black">{trip.name}</h3>
        )}
        <div className="flex items-center gap-1 text-teal-500 text-xs font-medium">
          <Calendar className="h-3 w-3" />
          {trip.dates}
        </div>
      </div>
      
      <div className="relative w-full h-40 rounded-md overflow-hidden mb-3">
        <Image
          src={trip.image}
          alt={trip.imageAlt}
          fill
          className="object-cover"
        />
      </div>
      
      {trip.description && (
        <p className="text-xs text-airbnb-dark-gray mb-3">
          {trip.description}
        </p>
      )}
      
      <div className="flex items-center gap-4 mb-3 text-xs">
        {trip.restaurants && trip.restaurants.length > 0 && (
          <div className="flex items-center gap-1 text-teal-500">
            <MapPin className="h-3 w-3" />
            <span>Restaurants</span>
          </div>
        )}
        {trip.activities && trip.activities.length > 0 && (
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-3 w-3" />
            <span>Activities</span>
          </div>
        )}
      </div>

      {((trip.restaurants && trip.restaurants.length > 0) || (trip.activities && trip.activities.length > 0)) && (
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
          {trip.restaurants && trip.restaurants.length > 0 && (
            <div>
              <p className="font-medium text-airbnb-black mb-1">Restaurants</p>
              <ul className="text-airbnb-gray space-y-1">
                {trip.restaurants.map((restaurant, index) => (
                  <li key={index}>• {restaurant.name}</li>
                ))}
              </ul>
            </div>
          )}
          {trip.activities && trip.activities.length > 0 && (
            <div>
              <p className="font-medium text-airbnb-black mb-1">Activities</p>
              <ul className="text-airbnb-gray space-y-1">
                {trip.activities.map((activity, index) => (
                  <li key={index}>• {activity.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-airbnb-gray mb-3">
        <strong>Stay:</strong>{' '}
        {trip.accommodation.link ? (
          <Link href={trip.accommodation.link} className="text-teal-500 hover:underline">
            {trip.accommodation.name}
          </Link>
        ) : (
          trip.accommodation.name
        )}{' '}
        • {trip.accommodation.nights} night{trip.accommodation.nights > 1 ? 's' : ''}
      </p>
      
      <div className="bg-yellow-50 border border-yellow-100 rounded-md p-2 mb-3">
        <div className="flex items-start gap-2">
          <div className="text-orange-500 text-sm">💡</div>
          <div>
            <p className="text-xs font-medium text-orange-700 mb-1">Did you know?</p>
            <p className="text-xs text-orange-600">
              {trip.didYouKnow}
            </p>
          </div>
        </div>
      </div>
      
      <Button variant="outline" size="sm" className="text-xs text-airbnb-gray hover:text-airbnb-black h-7">
        View Details
        <ChevronRight className="h-3 w-3 ml-1" />
      </Button>
    </>
  )
}
