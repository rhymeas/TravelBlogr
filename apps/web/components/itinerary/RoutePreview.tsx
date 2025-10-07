'use client'

/**
 * Route Preview - Shows what locations were actually resolved
 * Provides transparency about geocoding results
 */

import { ArrowRight, MapPin, Info } from 'lucide-react'

interface ResolvedLocation {
  userInput: string
  resolvedName: string
  country?: string
  region?: string
}

interface RoutePreviewProps {
  locations: ResolvedLocation[]
}

export function RoutePreview({ locations }: RoutePreviewProps) {
  if (locations.length === 0) return null

  // Check if any location was resolved to something different
  const hasResolutions = locations.some(
    loc => loc.userInput.toLowerCase() !== loc.resolvedName.toLowerCase()
  )

  if (!hasResolutions) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Route Confirmation
          </h4>
          <p className="text-xs text-blue-700 mb-3">
            We've resolved your locations to specific places:
          </p>
          
          <div className="space-y-2">
            {locations.map((loc, index) => {
              const isDifferent = loc.userInput.toLowerCase() !== loc.resolvedName.toLowerCase()
              
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  
                  {isDifferent ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-blue-700 font-medium">
                        {loc.userInput}
                      </span>
                      <ArrowRight className="h-3 w-3 text-blue-400" />
                      <span className="text-blue-900 font-semibold">
                        {loc.resolvedName}
                      </span>
                      {loc.region && (
                        <span className="text-xs text-blue-600">
                          ({loc.region})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-blue-900 font-medium">
                      {loc.resolvedName}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

