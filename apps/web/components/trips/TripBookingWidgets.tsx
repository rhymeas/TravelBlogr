'use client'

import { useState } from 'react'
import { Hotel, Plane, Car, Ticket, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  generateHotelLink,
  generateFlightLink,
  generateCarRentalLink,
  generateActivityLink,
  generateAirbnbLink,
  extractCityName,
  getCityIATA,
  calculateNights
} from '@/lib/services/travelpayouts'

interface TripBookingWidgetsProps {
  location: string  // "Paris, France"
  checkIn?: Date
  checkOut?: Date
  previousLocation?: string  // For flight origin
  nextLocation?: string  // For flight destination
}

export function TripBookingWidgets({
  location,
  checkIn,
  checkOut,
  previousLocation,
  nextLocation
}: TripBookingWidgetsProps) {
  const cityName = extractCityName(location)
  const cityIATA = getCityIATA(cityName)

  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : null

  return (
    <div className="space-y-3">
      {/* Hotels */}
      <BookingButton
        icon={<Hotel className="w-4 h-4" />}
        label="Book Hotels"
        sublabel={nights ? `${nights} night${nights > 1 ? 's' : ''}` : undefined}
        href={generateHotelLink({
          city: cityName,
          checkIn,
          checkOut,
          adults: 2
        })}
        color="emerald"
      />

      {/* Airbnb */}
      <BookingButton
        icon={<Hotel className="w-4 h-4" />}
        label="Find Airbnb"
        sublabel={nights ? `${nights} night${nights > 1 ? 's' : ''}` : undefined}
        href={generateAirbnbLink({
          location: cityName,
          checkIn,
          checkOut,
          adults: 2
        })}
        color="rose"
      />

      {/* Flights - To this location */}
      {previousLocation && (
        <BookingButton
          icon={<Plane className="w-4 h-4" />}
          label="Find Flights"
          sublabel={`${extractCityName(previousLocation)} → ${cityName}`}
          href={generateFlightLink({
            origin: getCityIATA(extractCityName(previousLocation)),
            destination: cityIATA,
            departDate: checkIn,
            adults: 1
          })}
          color="blue"
        />
      )}

      {/* Flights - From this location */}
      {nextLocation && (
        <BookingButton
          icon={<Plane className="w-4 h-4" />}
          label="Find Flights"
          sublabel={`${cityName} → ${extractCityName(nextLocation)}`}
          href={generateFlightLink({
            origin: cityIATA,
            destination: getCityIATA(extractCityName(nextLocation)),
            departDate: checkOut,
            adults: 1
          })}
          color="blue"
        />
      )}

      {/* Car Rental */}
      <BookingButton
        icon={<Car className="w-4 h-4" />}
        label="Rent a Car"
        sublabel={cityName}
        href={generateCarRentalLink({
          location: cityName,
          pickupDate: checkIn,
          dropoffDate: checkOut
        })}
        color="purple"
      />

      {/* Activities */}
      <BookingButton
        icon={<Ticket className="w-4 h-4" />}
        label="Book Activities"
        sublabel="Tours & experiences"
        href={generateActivityLink({
          city: cityName
        })}
        color="amber"
      />
    </div>
  )
}

interface BookingButtonProps {
  icon: React.ReactNode
  label: string
  sublabel?: string
  href: string
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose'
}

function BookingButton({ icon, label, sublabel, href, color }: BookingButtonProps) {
  const colorClasses = {
    emerald: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${colorClasses[color]} group`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm">{label}</div>
          {sublabel && (
            <div className="text-xs opacity-75 mt-0.5">{sublabel}</div>
          )}
        </div>
      </div>
      <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition" />
    </a>
  )
}

/**
 * Minimalistic Bubbly version for sidebar - TravelBlogr style
 * Sleek gray, all in one line, native look
 */
export function TripBookingWidgetsCompact({
  location,
  checkIn,
  checkOut
}: Omit<TripBookingWidgetsProps, 'previousLocation' | 'nextLocation'>) {
  const cityName = extractCityName(location)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-gray-900 mr-1">Book Your Trip to {cityName}</span>

      {/* Hotels */}
      <a
        href={generateHotelLink({ city: cityName, checkIn, checkOut, adults: 2 })}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all"
      >
        <Hotel className="w-3 h-3" />
        <span className="font-medium">Hotels</span>
      </a>

      {/* Airbnb */}
      <a
        href={generateAirbnbLink({ location: cityName, checkIn, checkOut, adults: 2 })}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all"
      >
        <Hotel className="w-3 h-3" />
        <span className="font-medium">Airbnb</span>
      </a>

      {/* Car Rental */}
      <a
        href={generateCarRentalLink({ location: cityName, pickupDate: checkIn, dropoffDate: checkOut })}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all"
      >
        <Car className="w-3 h-3" />
        <span className="font-medium">Car Rental</span>
      </a>

      {/* Activities */}
      <a
        href={generateActivityLink({ city: cityName })}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all"
      >
        <Ticket className="w-3 h-3" />
        <span className="font-medium">Activities</span>
      </a>
    </div>
  )
}

