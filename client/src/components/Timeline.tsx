import { Link } from "wouter";
import { Wine, Mountain, MapPin, Utensils, Calendar, Home, ChevronRight } from "lucide-react";
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

function getCategoryIcon(highlights: string[]) {
  const highlightStr = highlights.join(' ').toLowerCase();
  if (highlightStr.includes('wein') || highlightStr.includes('wine')) {
    return <Wine className="w-4 h-4 text-white" />;
  }
  if (highlightStr.includes('berg') || highlightStr.includes('mountain') || highlightStr.includes('rocky')) {
    return <Mountain className="w-4 h-4 text-white" />;
  }
  return <MapPin className="w-4 h-4 text-white" />;
}

export default function Timeline({ locations }: TimelineProps) {
  return (
    <div className="relative" data-testid="timeline">
      {/* Timeline line */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 transform -translate-x-1/2"></div>
      
      <div className="space-y-20">
        {locations.map((location, index) => (
          <div key={location.id} className="relative" data-testid={`timeline-item-${location.slug}`}>
            {/* Timeline marker */}
            <div className="hidden md:block absolute left-1/2 top-8 w-8 h-8 bg-primary rounded-full transform -translate-x-1/2 z-10 border-4 border-background shadow-lg flex items-center justify-center">
              {getCategoryIcon(location.highlights || [])}
            </div>
            
            {/* Card positioned alternating left/right */}
            <div className={`flex ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
              <Card className={`w-full md:w-5/12 lg:w-2/5 bg-white shadow-lg hover:shadow-xl transition-shadow animate-fade-in ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}>
                {/* Header with date */}
                <div className="relative">
                  <img 
                    src={location.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"}
                    alt={location.name}
                    className="w-full h-56 object-cover rounded-t-lg"
                    data-testid={`location-image-${location.slug}`}
                  />
                  <div className="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDateRange(location.startDate, location.endDate)}
                  </div>
                </div>

                <div className="p-6">
                  {/* Location name and description */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2" data-testid={`location-name-${location.slug}`}>
                      {location.name}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed" data-testid={`location-description-${location.slug}`}>
                      {location.description}
                    </p>
                  </div>

                  {/* Restaurants and Activities grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Restaurants */}
                    <div>
                      <div className="flex items-center mb-3">
                        <Utensils className="w-4 h-4 text-primary mr-2" />
                        <h4 className="font-semibold text-primary">Restaurants</h4>
                      </div>
                      <ul className="space-y-2">
                        {location.restaurants?.slice(0, 2).map((restaurant, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">• {restaurant.name}</span>
                            {restaurant.description && (
                              <p className="text-muted-foreground text-xs mt-1 ml-3">
                                {restaurant.description}
                              </p>
                            )}
                          </li>
                        )) || (
                          <li className="text-sm text-muted-foreground">• Lokale Spezialitäten entdecken</li>
                        )}
                      </ul>
                    </div>

                    {/* Activities */}
                    <div>
                      <div className="flex items-center mb-3">
                        <Mountain className="w-4 h-4 text-primary mr-2" />
                        <h4 className="font-semibold text-primary">Aktivitäten</h4>
                      </div>
                      <ul className="space-y-2">
                        {location.activities?.slice(0, 3).map((activity, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="text-foreground">• {activity}</span>
                          </li>
                        )) || (
                          <li className="text-sm text-muted-foreground">• Entdeckungstouren vor Ort</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex items-center mb-2">
                      <Home className="w-4 h-4 text-muted-foreground mr-2" />
                      <span className="text-sm font-medium text-muted-foreground">Unterkunft:</span>
                    </div>
                    <p className="text-sm text-foreground ml-6">
                      {location.accommodation}
                      {location.accommodationPrice && (
                        <span className="text-muted-foreground ml-2">
                          • {location.accommodationPrice}€ pro Nacht
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Details button */}
                  <Link href={`/location/${location.slug}`}>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
                      data-testid={`details-button-${location.slug}`}
                    >
                      Details ansehen
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
