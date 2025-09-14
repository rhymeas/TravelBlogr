import { Link } from "wouter";
import { CalendarDays, Utensils, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Location } from "@shared/schema";

interface LocationCardProps {
  location: Location;
  variant?: "default" | "timeline";
}

export default function LocationCard({ location, variant = "default" }: LocationCardProps) {
  // Format date range for header
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = startDate.split('.').slice(0, 2).join('/');
    const end = endDate.split('.').slice(0, 2).join('/');
    return `${start}-${end}`;
  };

  return (
    <Link href={`/location/${location.slug}`}>
      <Card 
        className="group hover:shadow-xl transition-shadow cursor-pointer border border-border max-w-lg"
        data-testid={`location-card-${location.slug}`}
      >
        <CardContent className="p-0">
          {/* Header with location name and date */}
          <div className="flex justify-between items-center p-6 pb-4">
            <h3 className="text-2xl font-bold text-foreground" data-testid={`location-name-${location.slug}`}>
              {location.name}
            </h3>
            <div className="flex items-center text-teal-600 text-sm font-medium">
              <CalendarDays className="w-4 h-4 mr-2" />
              <span data-testid={`location-dates-${location.slug}`}>
                {formatDateRange(location.startDate, location.endDate)}
              </span>
            </div>
          </div>

          {/* Image */}
          {location.imageUrl && (
            <div className="aspect-[4/3] w-full overflow-hidden mx-6 rounded-lg mb-4">
              <img 
                src={location.imageUrl} 
                alt={location.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                data-testid={`location-image-${location.slug}`}
              />
            </div>
          )}
          
          {/* Description */}
          <div className="px-6 mb-6">
            <p className="text-muted-foreground text-base leading-relaxed" data-testid={`location-description-${location.slug}`}>
              {location.description}
            </p>
          </div>

          {/* Dining and Activities sections */}
          <div className="grid grid-cols-2 gap-4 px-6 mb-6">
            {/* Dining Section */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Utensils className="w-4 h-4 mr-2 text-teal-600" />
                <h4 className="font-medium text-teal-600">Dining</h4>
              </div>
              <div className="space-y-2">
                {location.restaurants && location.restaurants.length > 0 ? (
                  location.restaurants.slice(0, 2).map((restaurant, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {restaurant.name}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Empfehlungen verfügbar</div>
                )}
              </div>
            </div>

            {/* Activities Section */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Star className="w-4 h-4 mr-2 text-teal-600" />
                <h4 className="font-medium text-teal-600">Activities</h4>
              </div>
              <div className="space-y-2">
                {location.activities && location.activities.length > 0 ? (
                  location.activities.slice(0, 2).map((activity, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {activity}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Aktivitäten verfügbar</div>
                )}
              </div>
            </div>
          </div>

          {/* Accommodation information */}
          {location.accommodation && (
            <div className="px-6 pb-6">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Accommodation:</span> {location.accommodation}
                {location.accommodationPrice && (
                  <span> • {location.accommodationPrice} {location.accommodationCurrency}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}