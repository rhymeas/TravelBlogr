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
    <div className="relative py-8 min-h-full" data-testid="timeline">
      {/* Timeline line - extends full height with strong visibility */}
      <div className="hidden md:block absolute left-1/2 top-0 h-full w-1 bg-primary transform -translate-x-1/2 shadow-md"></div>
      
      <div className="space-y-0">
        {locations.map((location, index) => (
          <div key={location.id} className={`relative ${index > 0 ? '-mt-64' : ''}`} data-testid={`timeline-item-${location.slug}`}>
            {/* Timeline marker */}
            <div className="hidden md:block absolute left-1/2 top-8 w-8 h-8 bg-primary rounded-full transform -translate-x-1/2 z-10 border-4 border-white shadow-lg"></div>
            
            {/* Card positioned alternating left/right with proper spacing from center */}
            <div className={`flex ${index % 2 === 0 ? 'md:justify-start md:pr-16' : 'md:justify-end md:pl-16'}`}>
              <Link href={`/location/${location.slug}`} className="w-full md:w-5/12 lg:w-2/5">
                <Card className={`w-full bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}>
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

                {/* Restaurants and Activities grid - boxed in subtle gray */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-4">
                  {/* Restaurants */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
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
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
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

                {/* Accommodation - boxed in subtle gray */}
                <div className="px-6 pb-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Unterkunft:</span> {location.accommodation || 'Komfortable Unterkunft'} • 2 Nächte
                    </p>
                  </div>
                </div>

                {/* Clickable indicator */}
                <div className="px-6 pb-6">
                  <div className="flex justify-end">
                    <Button 
                      variant="ghost"
                      className="text-gray-700 hover:text-primary p-0 h-auto font-normal pointer-events-none"
                      data-testid={`details-button-${location.slug}`}
                    >
                      Details ansehen
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
                </Card>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}