import { Card, CardContent } from "@/components/ui/card";
import { Wine, Mountain, Network } from "lucide-react";
import type { Location } from "@shared/schema";

interface LocationCardProps {
  location: Location;
}

export default function LocationCard({ location }: LocationCardProps) {
  const getIcon = (category: string | null) => {
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  };

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-shadow" data-testid={`location-card-${location.id}`}>
      <div className="relative overflow-hidden">
        <img 
          src={location.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"}
          alt={location.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">{location.name}</h3>
          <span className="text-sm text-muted-foreground">
            {formatDateRange(location.startDate, location.endDate)}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mb-3">{location.description}</p>
        <div className="flex items-center text-primary text-sm">
          {getIcon(location.category)}
          <span>{location.category}</span>
        </div>
      </CardContent>
    </Card>
  );
}
