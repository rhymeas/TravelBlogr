'use client'

import { Plane, Train, Car, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { trackAffiliateClick } from '@/lib/utils/affiliateLinks'

interface TransportOptionsProps {
  destination: string
}

export function TransportOptions({ destination }: TransportOptionsProps) {
  // Skyscanner affiliate link
  const skyscannerUrl = `https://www.skyscanner.com/transport/flights/anywhere/${encodeURIComponent(destination)}/?utm_source=travelblogr&utm_medium=affiliate`

  // Omio affiliate link (trains, buses)
  const omioUrl = `https://www.omio.com/search?utm_source=travelblogr&utm_medium=affiliate`

  // RentalCars affiliate link
  const rentalCarsUrl = `https://www.rentalcars.com/SearchResults.do?city=${encodeURIComponent(destination)}&utm_source=travelblogr&utm_medium=affiliate`

  const handleClick = (provider: string, url: string) => {
    trackAffiliateClick(provider, destination, 'trip_template_transport')
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Plane className="h-4 w-4 text-rausch-500" />
        <h4 className="font-semibold text-gray-900 text-sm">✈️ Getting There</h4>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-4">
        Find the best transportation options to {destination}
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
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
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
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer">
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

        {/* Car Rentals */}
        <a
          href={rentalCarsUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('rentalcars', rentalCarsUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Car className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Car Rentals</p>
                <p className="text-xs text-gray-600">RentalCars.com</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
          </div>
        </a>
      </div>

      {/* Disclosure */}
      <p className="text-xs text-gray-500 italic mt-3 leading-relaxed">
         
      </p>
    </Card>
  )
}

