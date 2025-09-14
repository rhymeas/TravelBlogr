import { Link } from "wouter";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Location } from "@shared/schema";

interface LocationCardProps {
  location: Location;
  variant?: "default" | "timeline";
}

export default function LocationCard({ location, variant = "default" }: LocationCardProps) {
  return (
    <Link href={`/location/${location.slug}`}>
      <Card 
        className="group hover:shadow-xl transition-shadow cursor-pointer border border-border"
        data-testid={`location-card-${location.slug}`}
      >
        <CardContent className="p-0">
          {/* Image */}
          {location.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
              <img 
                src={location.imageUrl} 
                alt={location.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                data-testid={`location-image-${location.slug}`}
              />
            </div>
          )}
          
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors" data-testid={`location-name-${location.slug}`}>
                {location.name}
              </h3>
              <Badge variant="secondary" className="ml-2" data-testid={`location-dates-${location.slug}`}>
                {location.startDate.split('.').slice(0, 2).join('.')}-{location.endDate.split('.').slice(0, 2).join('.')}
              </Badge>
            </div>
            
            {/* Description */}
            <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`location-description-${location.slug}`}>
              {location.description}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span data-testid={`location-duration-${location.slug}`}>
                  {location.startDate} - {location.endDate}
                </span>
              </div>
              {location.distance && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span data-testid={`location-distance-${location.slug}`}>{location.distance} km</span>
                </div>
              )}
              {location.accommodationPrice && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span data-testid={`location-price-${location.slug}`}>
                    {location.accommodationPrice} {location.accommodationCurrency}
                  </span>
                </div>
              )}
            </div>
            
            {/* Highlights */}
            {location.highlights && location.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2" data-testid={`location-highlights-${location.slug}`}>
                {location.highlights.slice(0, 3).map((highlight, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {highlight}
                  </Badge>
                ))}
                {location.highlights.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{location.highlights.length - 3} mehr
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
