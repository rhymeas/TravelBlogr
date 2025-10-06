'use client'

import { Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LocationDidYouKnow } from '@/lib/data/locationsData'

interface LocationDidYouKnowProps {
  locationSlug?: string
  didYouKnow: LocationDidYouKnow[]
  locationName: string
}

const categoryLabels = {
  history: 'History',
  culture: 'Culture',
  nature: 'Nature',
  fun_fact: 'Fact',
  local_tip: 'Tip'
}

export function LocationDidYouKnow({ didYouKnow, locationName }: LocationDidYouKnowProps) {
  if (!didYouKnow || didYouKnow.length === 0) {
    return null
  }

  return (
    <Card className="card-elevated p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Info className="h-5 w-5 text-airbnb-gray" />
        <h3 className="text-title-medium font-semibold text-airbnb-black">
          Did You Know?
        </h3>
      </div>

      <div className="space-y-4">
        {didYouKnow.map((fact) => (
          <div
            key={fact.id}
            className="border-l-2 border-airbnb-border pl-4 py-2"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-body-medium font-semibold text-airbnb-black">
                {fact.title}
              </h4>
              <span className="text-body-small text-airbnb-gray font-medium ml-3 flex-shrink-0">
                {categoryLabels[fact.category]}
              </span>
            </div>
            <p className="text-body-small text-airbnb-dark-gray leading-relaxed">
              {fact.content}
            </p>
          </div>
        ))}
      </div>

      {/* CMS Edit Note */}
      <div className="mt-6 pt-4 border-t border-airbnb-border">
        <p className="text-body-small text-airbnb-gray italic">
          Facts are curated through the CMS.
          Local experts and community members can contribute insights about each location.
        </p>
      </div>
    </Card>
  )
}
