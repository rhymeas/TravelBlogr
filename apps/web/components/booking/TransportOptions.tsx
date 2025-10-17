'use client'

/**
 * Transport Options Component
 * 
 * Displays transport options with affiliate links for trip templates
 */

import { Plane, Train, Car, Bus, ExternalLink, Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { trackAffiliateClick } from '@/lib/utils/affiliateLinks'

interface TransportOptionsProps {
  destination: string
  className?: string
}

export function TransportOptions({
  destination,
  className = '',
}: TransportOptionsProps) {
  // Generate affiliate links for transport booking platforms
  const skyscannerUrl = `https://www.skyscanner.com/transport/flights/anywhere/${encodeURIComponent(destination)}/?adultsv2=1&cabinclass=economy&childrenv2=&inboundaltsenabled=false&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=0`
  
  const omioUrl = `https://www.omio.com/search?departureDate=&arrivalStationName=${encodeURIComponent(destination)}&departureStationName=`
  
  const rentalcarsUrl = `https://www.rentalcars.com/SearchResults.do?city=${encodeURIComponent(destination)}`

  const handleClick = (provider: string, url: string) => {
    trackAffiliateClick(provider, destination, 'trip_template_transport')
  }

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Plane className="h-4 w-4 text-rausch-500" />
        <h3 className="text-sm font-semibold text-gray-900">Getting There</h3>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-4">
        Compare prices and book your transport to {destination}
      </p>

      {/* Transport Options */}
      <div className="space-y-2">
        {/* Flights - Skyscanner */}
        <a
          href={skyscannerUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('skyscanner', skyscannerUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plane className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Flights</p>
                <p className="text-xs text-gray-600">Skyscanner</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
          </div>
        </a>

        {/* Trains & Buses - Omio */}
        <a
          href={omioUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('omio', omioUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Train className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Trains & Buses</p>
                <p className="text-xs text-gray-600">Omio</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-green-500" />
          </div>
        </a>

        {/* Car Rentals - RentalCars.com */}
        <a
          href={rentalcarsUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('rentalcars', rentalcarsUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Car className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Car Rentals</p>
                <p className="text-xs text-gray-600">RentalCars.com</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-500" />
          </div>
        </a>
      </div>

      {/* Travel Tip */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-900 mb-1">Travel Tip</p>
            <p className="text-xs text-blue-800">
              Book flights on Tuesday/Wednesday for best deals. Use incognito mode to avoid price increases.
            </p>
          </div>
        </div>
      </div>

      {/* Disclosure */}
      <p className="text-xs text-gray-500 italic mt-3 leading-relaxed">
        We may earn a commission from bookings at no extra cost to you.
      </p>
    </Card>
  )
}

