import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Wine, Mountain, Network } from "lucide-react";
import type { Location } from "@shared/schema";

interface LocationCardProps {
  location: Location;
  variant?: "default" | "timeline";
}

export default function LocationCard({ location, variant = "default" }: LocationCardProps) {
  const getIcon = (highlights: string[] | null) => {
    if (!highlights || highlights.length === 0) return <Mountain className="mr-2 h-4 w-4" />;
    
    const firstHighlight = highlights[0].toLowerCase();
    if (firstHighlight.includes('wein') || firstHighlight.includes('wine')) {
      return <Wine className="mr-2 h-4 w-4" />;
    }
    if (firstHighlight.includes('berg') || firstHighlight.includes('mountain') || firstHighlight.includes('alpine')) {
      return <Mountain className="mr-2 h-4 w-4" />;
    }
    if (firstHighlight.includes('wild') || firstHighlight.includes('natur')) {
      return <Network className="mr-2 h-4 w-4" />;
    }
    return <Mountain className="mr-2 h-4 w-4" />;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    // Parse German date format (DD.MM.YYYY)
    const [startDay, startMonth] = startDate.split('.');
    const [endDay, endMonth] = endDate.split('.');
    
    const monthNames = {
      '01': 'Jan', '02': 'Feb', '03': 'Mär', '04': 'Apr',
      '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aug',
      '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Dez'
    };
    
    const startMonthName = monthNames[startMonth as keyof typeof monthNames] || startMonth;
    const endMonthName = monthNames[endMonth as keyof typeof monthNames] || endMonth;
    
    if (startMonth === endMonth) {
      return `${startMonthName} ${startDay}-${endDay}`;
    }
    return `${startMonthName} ${startDay} - ${endMonthName} ${endDay}`;
  };

  const getCategoryName = (highlights: string[] | null) => {
    if (!highlights || highlights.length === 0) return "Abenteuer";
    
    const firstHighlight = highlights[0].toLowerCase();
    if (firstHighlight.includes('wein') || firstHighlight.includes('wine')) {
      return "Weinregion";
    }
    if (firstHighlight.includes('berg') || firstHighlight.includes('mountain') || firstHighlight.includes('alpine')) {
      return "Bergabenteuer";
    }
    if (firstHighlight.includes('wild') || firstHighlight.includes('natur')) {
      return "Wildnis";
    }
    return "Entdeckung";
  };

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-shadow animate-fade-in" data-testid={`location-card-${location.slug}`}>
      <div className="relative overflow-hidden">
        <img 
          src={location.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"}
          alt={location.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          data-testid={`location-image-${location.slug}`}
        />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold" data-testid={`location-name-${location.slug}`}>
            {location.name}
          </h3>
          <span className="text-sm text-muted-foreground" data-testid={`location-dates-${location.slug}`}>
            {formatDateRange(location.startDate, location.endDate)}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-3" data-testid={`location-description-${location.slug}`}>
          {location.description}
        </p>
        <div className="flex items-center text-primary text-sm">
          {getIcon(location.highlights)}
          <span>{getCategoryName(location.highlights)}</span>
        </div>
      </CardContent>
    </Card>
  );
}