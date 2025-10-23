'use client'

import { Calendar, Clock, Star, Users, Mountain, Palette, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LocationExperience } from '@/lib/data/locationsData'

interface LocationExperiencesProps {
  locationSlug?: string
  experiences: LocationExperience[]
  locationName: string
}

const categoryIcons = {
  unique: Star,
  seasonal: Calendar,
  local: Users,
  adventure: Mountain,
  cultural: Palette
}

const categoryColors = {
  unique: 'bg-purple-100 text-purple-800',
  seasonal: 'bg-blue-100 text-blue-800',
  local: 'bg-green-100 text-green-800',
  adventure: 'bg-red-100 text-red-800',
  cultural: 'bg-yellow-100 text-yellow-800'
}

export function LocationExperiences({ experiences, locationName }: LocationExperiencesProps) {
  if (!experiences || experiences.length === 0) {
    return null
  }

  return (
    <Card className="card-elevated p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-sleek-small flex items-center justify-center">
          <Zap className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-title-medium font-semibold text-sleek-black">
            Special Experiences
          </h3>
          <p className="text-body-medium text-sleek-gray">
            Unique activities and memorable moments in {locationName}
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        {experiences.map((experience) => {
          const IconComponent = categoryIcons[experience.category] || Star
          
          return (
            <div
              key={experience.id}
              className="flex gap-4 p-4 bg-white border border-sleek-border rounded-sleek-medium hover:shadow-sleek-medium transition-all duration-300"
            >
              {/* Experience Image */}
              <div className="flex-shrink-0 w-24 h-24 rounded-sleek-small overflow-hidden">
                <img
                  src={experience.image}
                  alt={experience.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Experience Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-body-large font-semibold text-sleek-black">
                    {experience.title}
                  </h4>
                  <Badge className={`${categoryColors[experience.category]} flex items-center gap-1`}>
                    <IconComponent className="h-3 w-3" />
                    {experience.category}
                  </Badge>
                </div>

                <p className="text-body-medium text-sleek-dark-gray mb-3">
                  {experience.description}
                </p>

                {/* Experience Metadata */}
                <div className="flex flex-wrap gap-3 mb-3 text-body-small text-sleek-gray">
                  {experience.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{experience.duration}</span>
                    </div>
                  )}
                  {experience.best_time && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Best: {experience.best_time}</span>
                    </div>
                  )}
                  {experience.booking_required && (
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      Booking Required
                    </Badge>
                  )}
                </div>

                {/* Contact Information */}
                {experience.contact_info && (
                  <div className="flex items-center justify-between">
                    <p className="text-body-small text-sleek-gray">
                      <strong>Contact:</strong> {experience.contact_info}
                    </p>
                    {experience.booking_required && (
                      <Button
                        size="sm"
                        className="btn-primary"
                        onClick={() => {
                          // In a real app, this would open a booking modal or redirect
                          alert(`Booking for "${experience.title}" - Contact: ${experience.contact_info}`)
                        }}
                      >
                        Book Now
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* CMS Edit Note */}
      <div className="mt-6 pt-4 border-t border-sleek-border">
        <p className="text-body-small text-sleek-gray italic">
          Special experiences are managed through the CMS. 
          Tour operators and local businesses can submit new experiences for approval.
        </p>
      </div>
    </Card>
  )
}
