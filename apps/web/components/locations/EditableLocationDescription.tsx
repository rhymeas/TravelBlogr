'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { InlineLocationEditor } from './InlineLocationEditor'

interface EditableLocationDescriptionProps {
  locationId: string
  locationSlug: string
  locationName: string
  description: string
  enabled?: boolean
}

export function EditableLocationDescription({
  locationId,
  locationSlug,
  locationName,
  description: initialDescription,
  enabled = false,
}: EditableLocationDescriptionProps) {
  const [description, setDescription] = useState(initialDescription)

  return (
    <Card className="card-elevated p-6 mb-8 relative group">
      <InlineLocationEditor
        locationId={locationId}
        locationSlug={locationSlug}
        field="description"
        value={description}
        onUpdate={setDescription}
        enabled={enabled}
      />

      <h2 className="text-title-medium font-semibold text-sleek-black mb-4">
        About {locationName}
      </h2>
      <p className="text-body-medium text-sleek-dark-gray leading-relaxed whitespace-pre-wrap">
        {description}
      </p>
    </Card>
  )
}

