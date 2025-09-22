import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wine, Mountain, Network, MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Location } from "@shared/schema";

interface LocationCardProps {
  location: Location;
}

export default function LocationCard({ location }: LocationCardProps) {
  const getCategoryFromHighlights = (highlights: string[] | null): string => {
    if (!highlights || highlights.length === 0) return "Alpine Adventure";
    
    const highlightStr = highlights.join(' ').toLowerCase();
    if (highlightStr.includes('wein') || highlightStr.includes('wine')) {
      return "Wine Country";
    }
    if (highlightStr.includes('berg') || highlightStr.includes('mountain') || highlightStr.includes('alpine')) {
      return "Alpine Adventure";
    }
    if (highlightStr.includes('wild') || highlightStr.includes('natur') || highlightStr.includes('wilderness')) {
      return "Wilderness";
    }
    return "Alpine Adventure";
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "Wine Country":
        return <Wine className="mr-2 h-4 w-4" />;
      case "Alpine Adventure":
        return <Mountain className="mr-2 h-4 w-4" />;
      case "Wilderness":
        return <Network className="mr-2 h-4 w-4" />;
      default:
        return <Mountain className="mr-2 h-4 w-4" />;
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    // Handle German date format (DD.MM.YYYY)
    const start = new Date(startDate.split('.').reverse().join('-'));
    const end = new Date(endDate.split('.').reverse().join('-'));
    const startMonth = start.toLocaleDateString('de-DE', { month: 'short' });
    const endMonth = end.toLocaleDateString('de-DE', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  };

  const category = getCategoryFromHighlights(location.highlights);

  return (
    <Link href={`/locations/${location.slug}`}>
      <Card className="group cursor-pointer hover:shadow-lg transition-shadow" data-testid={`location-card-${location.slug}`}>
        <div className="relative overflow-hidden">
          {location.imageUrl ? (
            <img 
              src={location.imageUrl}
              alt={location.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Bild wird hinzugefügt</p>
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">{location.name}</h3>
            <span className="text-sm text-muted-foreground">
              {formatDateRange(location.startDate, location.endDate)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mb-3">{location.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-primary text-sm">
              {getIcon(category)}
              <span>{category}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`view-details-button-${location.slug}`}
            >
              Details <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}