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
    daysStay?: number  // Number of days staying at this location
  }
  position: 'left' | 'right'
  index?: number  // Card index to determine if it's the first card
  isLastCard?: boolean  // Whether this is the last card in the timeline
}

export function TripCard({ trip, position, index = 0, isLastCard = false }: TripCardProps) {
  const isLeft = position === 'left'
  const daysStay = trip.daysStay || 1 // Default to 1 day if not specified
  const isFirstCard = index === 0

  return (
    <>
      {/* Mobile Layout: Vertical timeline on left, cards on right */}
      <div className="flex lg:hidden items-start gap-3 relative">
        {/* Mobile Timeline - Vertical on left */}
        <div className="flex flex-col items-center flex-shrink-0">
          {/* Timeline Bubble */}
          <div className="w-10 h-10 bg-teal-400 rounded-full border-[3px] border-white shadow-lg z-10 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{daysStay}d</span>
          </div>

          {/* Vertical line extending down (hidden for last card) */}
          {!isLastCard && (
            <div className="w-0.5 bg-teal-300 flex-1 min-h-[120px]"></div>
          )}
        </div>

        {/* Mobile Card - On the right */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow -mt-1">
          {/* Horizontal dotted line connecting bubble to card */}
          <div className="absolute left-[40px] top-[20px] w-[12px] h-[2px] border-t-2 border-dotted border-gray-300 z-0"></div>

          <TripCardContent trip={trip} isMobile={true} />
        </div>
      </div>

      {/* Desktop/Tablet Layout: Keep existing alternating layout */}
      <div className="hidden lg:flex flex-row items-start gap-6">
        <div className={`lg:w-1/2 ${isLeft ? `lg:pr-6 flex justify-end ${!isFirstCard ? 'lg:-mt-48' : ''}` : 'lg:pr-6'}`}>
          {isLeft ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 relative hover:shadow-md transition-shadow w-[70%]">
              {/* Horizontal dotted line connecting to timeline */}
              <div className="absolute -right-[55px] top-[18px] w-[45px] h-[2px] border-t-2 border-dotted border-gray-300 z-0"></div>

              {/* Timeline Bubble - positioned closer to card, on the green line */}
              <div className="absolute w-12 h-12 bg-teal-400 rounded-full border-[3px] border-white shadow-lg -right-[61px] top-[6px] z-10">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{daysStay}d</span>
                </div>
              </div>

              <TripCardContent trip={trip} />
            </div>
          ) : (
            <div className="lg:w-full">
              {/* Empty space for alternating layout */}
            </div>
          )}
        </div>

        <div className={`lg:w-1/2 ${isLeft ? 'lg:pl-6' : `lg:pl-6 flex justify-start ${!isFirstCard ? 'lg:-mt-48' : ''}`}`}>
          {!isLeft ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 relative hover:shadow-md transition-shadow w-[70%]">
              {/* Horizontal dotted line connecting to timeline */}
              <div className="absolute -left-[55px] top-[18px] w-[45px] h-[2px] border-t-2 border-dotted border-gray-300 z-0"></div>

              {/* Timeline Bubble - positioned closer to card, on the green line */}
              <div className="absolute w-12 h-12 bg-teal-400 rounded-full border-[3px] border-white shadow-lg -left-[61px] top-[6px] z-10">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{daysStay}d</span>
                </div>
              </div>

              <TripCardContent trip={trip} />
            </div>
          ) : (
            <div className="lg:w-full">
              {/* Empty space for alternating layout */}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function TripCardContent({ trip, isMobile = false }: { trip: TripCardProps['trip'], isMobile?: boolean }) {
  // Try to find matching location for linking
  const matchingLocation = getLocationByName(trip.name)

  return (
    <>
      <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
        {matchingLocation ? (
          <Link
            href={`/locations/${matchingLocation.slug}`}
            className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-sleek-black hover:text-rausch-500 transition-colors cursor-pointer`}
          >
            {trip.name}
          </Link>
        ) : (
          <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-sleek-black`}>{trip.name}</h3>
        )}
        <div className={`flex items-center gap-1 text-teal-500 ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium`}>
          <Calendar className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
          {trip.dates}
        </div>
      </div>

      <div className={`relative w-full ${isMobile ? 'h-28' : 'h-40'} rounded-md overflow-hidden ${isMobile ? 'mb-2' : 'mb-3'}`}>
        <Image
          src={trip.image}
          alt={trip.imageAlt}
          fill
          className="object-cover"
        />
      </div>

      {trip.description && (
        <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-sleek-dark-gray ${isMobile ? 'mb-2' : 'mb-3'}`}>
          {trip.description}
        </p>
      )}

      <div className={`flex items-center gap-4 ${isMobile ? 'mb-2 text-[10px]' : 'mb-3 text-xs'}`}>
        {trip.restaurants && trip.restaurants.length > 0 && (
          <div className="flex items-center gap-1 text-teal-500">
            <MapPin className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
            <span>Restaurants</span>
          </div>
        )}
        {trip.activities && trip.activities.length > 0 && (
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
            <span>Activities</span>
          </div>
        )}
      </div>

      {((trip.restaurants && trip.restaurants.length > 0) || (trip.activities && trip.activities.length > 0)) && (
        <div className={`grid grid-cols-2 gap-3 ${isMobile ? 'mb-2 text-[10px]' : 'mb-3 text-xs'}`}>
          {trip.restaurants && trip.restaurants.length > 0 && (
            <div>
              <p className="font-medium text-sleek-black mb-1">Restaurants</p>
              <ul className="text-sleek-gray space-y-1">
                {trip.restaurants.map((restaurant, index) => (
                  <li key={index}>• {restaurant.name}</li>
                ))}
              </ul>
            </div>
          )}
          {trip.activities && trip.activities.length > 0 && (
            <div>
              <p className="font-medium text-sleek-black mb-1">Activities</p>
              <ul className="text-sleek-gray space-y-1">
                {trip.activities.map((activity, index) => (
                  <li key={index}>• {activity.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className={`${isMobile ? 'text-[10px] mb-2' : 'text-xs mb-3'} text-sleek-gray`}>
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

      <div className={`bg-yellow-50 border border-yellow-100 rounded-md ${isMobile ? 'p-1.5 mb-2' : 'p-2 mb-3'}`}>
        <div className="flex items-start gap-2">
          <div className={`text-orange-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>💡</div>
          <div>
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-orange-700 mb-1`}>Did you know?</p>
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-orange-600`}>
              {trip.didYouKnow}
            </p>
          </div>
        </div>
      </div>

      <Button variant="outline" size="sm" className={`${isMobile ? 'text-[10px] h-6' : 'text-xs h-7'} text-sleek-gray hover:text-sleek-black`}>
        View Details
        <ChevronRight className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} ml-1`} />
      </Button>
    </>
  )
}
