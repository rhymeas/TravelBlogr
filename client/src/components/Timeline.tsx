import { Link } from "wouter";
import { Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Location } from "@shared/schema";

interface TimelineProps {
  locations: Location[];
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate.split('.').reverse().join('-'));
  const end = new Date(endDate.split('.').reverse().join('-'));
  
  const startMonth = start.toLocaleDateString('de-DE', { month: 'short' });
  const endMonth = end.toLocaleDateString('de-DE', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

export default function Timeline({ locations }: TimelineProps) {
  return (
    <div className="relative max-w-4xl mx-auto" data-testid="timeline">
      {/* Timeline line */}
      <div className="hidden md:block absolute right-8 top-0 bottom-0 w-0.5 bg-primary/20"></div>
      
      <div className="space-y-12">
        {locations.map((location, index) => (
          <div key={location.id} className="relative" data-testid={`timeline-item-${location.slug}`}>
            {/* Timeline marker */}
            <div className="hidden md:block absolute right-4 top-8 w-8 h-8 bg-primary rounded-full z-10 shadow-lg"></div>
            
            {/* Card */}
            <Card className="w-full md:w-5/6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {/* Header with location name and date */}
              <div className="flex items-center justify-between p-6 pb-4">
                <h3 className="text-2xl font-bold text-gray-900" data-testid={`location-name-${location.slug}`}>
                  {location.name}
                </h3>
                <div className="flex items-center text-primary font-medium">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">{formatDateRange(location.startDate, location.endDate)}</span>
                </div>
              </div>

              {/* Image */}
              <div className="px-6 pb-4">
                <img 
                  src={location.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"}
                  alt={location.name}
                  className="w-full h-64 object-cover rounded-lg"
                  data-testid={`location-image-${location.slug}`}
                />
              </div>

              {/* Description */}
              <div className="px-6 pb-4">
                <p className="text-gray-600 text-base leading-relaxed" data-testid={`location-description-${location.slug}`}>
                  {location.description}
                </p>
              </div>

              {/* Restaurants and Activities grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-4">
                {/* Restaurants */}
                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">🍽️</span>
                    <h4 className="font-semibold text-primary">Restaurants</h4>
                  </div>
                  <ul className="space-y-2">
                    {location.restaurants?.slice(0, 2).map((restaurant, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        • {typeof restaurant === 'string' ? restaurant : restaurant.name}
                      </li>
                    )) || (
                      <li className="text-sm text-gray-500">• Lokale Spezialitäten entdecken</li>
                    )}
                  </ul>
                </div>

                {/* Activities */}
                <div>
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">⭐</span>
                    <h4 className="font-semibold text-primary">Aktivitäten</h4>
                  </div>
                  <ul className="space-y-2">
                    {location.activities?.slice(0, 2).map((activity, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        • {activity}
                      </li>
                    )) || (
                      <li className="text-sm text-gray-500">• Entdeckungstouren vor Ort</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Accommodation */}
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Unterkunft:</span> {location.accommodation || 'Komfortable Unterkunft'} • 2 Nächte
                </p>
              </div>

              {/* Details button */}
              <div className="px-6 pb-6">
                <div className="flex justify-end">
                  <Link href={`/location/${location.slug}`}>
                    <Button 
                      variant="ghost"
                      className="text-gray-700 hover:text-primary p-0 h-auto font-normal"
                      data-testid={`details-button-${location.slug}`}
                    >
                      Details ansehen
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}