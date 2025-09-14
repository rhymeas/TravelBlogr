import { Link } from "wouter";
import { Calendar, ChevronRight, MapPin, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CarIcon from "@/components/CarIcon";
import geolocationService from "@/lib/geolocationService";
import { getCurrentCarPosition, getPositionMessage, calculateTimelinePosition } from "@/lib/positionCalculator";
import type { Location, LocationPing, TourSettings } from "@shared/schema";

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
  const { toast } = useToast();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [carPosition, setCarPosition] = useState<any>(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Fetch tour settings to check if GPS is activated by admin
  const { data: tourSettings } = useQuery<TourSettings>({
    queryKey: ["/api/tour-settings"],
  });

  // Fetch latest location ping for car positioning
  const { data: latestPing, refetch: refetchPing } = useQuery<LocationPing>({
    queryKey: ["/api/location-ping/latest"],
    enabled: Boolean(isTrackingEnabled || tourSettings?.gpsActivatedByAdmin), // Ensure strict boolean type
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes for updates
  });

  // Calculate car position when latest ping changes
  useEffect(() => {
    if (latestPing && locations.length > 0) {
      // Ensure latestPing has all required properties before processing
      if (latestPing.id && latestPing.latitude && latestPing.longitude) {
        const newCarPosition = getCurrentCarPosition(latestPing, locations);
        setCarPosition(newCarPosition);
      }
    }
  }, [latestPing, locations]);

  // Handle GPS permission request
  const handleEnableTracking = async () => {
    setIsRequestingPermission(true);
    
    try {
      const result = await geolocationService.requestLocationTracking();
      
      toast({
        title: result.success ? "🚗 Live-Tracking aktiviert!" : "ℹ️ GPS optional",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      if (result.success) {
        setIsTrackingEnabled(true);
        // Immediately fetch the first ping
        setTimeout(() => refetchPing(), 1000);
      }
    } catch (error) {
      toast({
        title: "GPS-Fehler",
        description: "Das Live-Auto ist optional. Die App funktioniert trotzdem!",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Calculate car visual position on timeline
  const carTimelinePosition = carPosition && timelineRef.current
    ? calculateTimelinePosition(carPosition, timelineRef.current)
    : null;

  return (
    <div className="relative py-8 min-h-full" data-testid="timeline" ref={timelineRef}>
      {/* Timeline line - extends full height with strong visibility on desktop */}
      <div className="hidden md:block absolute left-1/2 top-0 h-full w-1 bg-primary transform -translate-x-1/2 shadow-md"></div>
      
      {/* Car Icon positioned on timeline - now visible on mobile too */}
      {carTimelinePosition && carTimelinePosition.isVisible && (
        <div 
          className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 z-30"
          style={{ top: `${carTimelinePosition.top}px` }}
        >
          <CarIcon
            isVisible={true}
            position="middle"
            isMoving={carPosition?.isMoving || false}
          />
        </div>
      )}

      {/* GPS activation is only available in Admin Panel - no frontend prompts */}

      {/* Car Position Status - shown when tracking is enabled */}
      {isTrackingEnabled && carPosition && (
        <div className="mb-8 text-center">
          <Card className="inline-block p-4 bg-green-50 border-green-200">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🚗</div>
              <div>
                <div className="text-sm font-medium text-green-800">
                  Live-Tracking aktiv
                </div>
                <div className="text-xs text-green-600">
                  {getPositionMessage(carPosition, locations)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      <div>
        {locations.map((location, index) => (
          <div 
            key={location.id} 
            className={`relative ${
              index === 0 ? 'mt-0' : 'mt-6 md:-mt-[234px]'
            }`}
            data-testid={`timeline-item-${location.slug}`}>
            {/* Connector line between cards - only on desktop */}
            {index > 0 && (
              <div className="hidden md:block absolute left-1/2 -top-20 w-px h-24 bg-gray-300 transform -translate-x-1/2 z-0"></div>
            )}
            
            {/* Timeline marker */}
            <div className="hidden md:block absolute left-1/2 top-8 w-8 h-8 bg-primary rounded-full transform -translate-x-1/2 z-10 border-4 border-white shadow-lg"></div>
            
            {/* Mobile timeline dot - removed to avoid clutter */}
            
            {/* Card positioned alternating left/right with proper spacing from center */}
            <div className={`flex ${index % 2 === 0 ? 'md:justify-start md:pr-6 lg:pr-8 xl:pr-10' : 'md:justify-end md:pl-6 lg:pl-8 xl:pl-10'}`}>
              <Link href={`/location/${location.slug}`} className="w-full md:w-[calc(50%-1.5rem)] lg:w-[calc(50%-2rem)] xl:w-[calc(50%-2.5rem)]">
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
                    <div className="space-y-3">
                      {location.restaurants?.slice(0, 2).map((restaurant, idx) => (
                        <div key={idx} className="flex items-center gap-3" data-testid={`restaurant-item-${idx}`}>
                          {(restaurant as any).imageUrl && (
                            <img 
                              src={(restaurant as any).imageUrl} 
                              alt={typeof restaurant === 'string' ? restaurant : restaurant.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              data-testid={`restaurant-image-${idx}`}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-700">
                              • {(restaurant as any).websiteUrl ? (
                                <a href={(restaurant as any).websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline" data-testid={`restaurant-link-${idx}`}>
                                  {typeof restaurant === 'string' ? restaurant : restaurant.name}
                                </a>
                              ) : (
                                <span data-testid={`restaurant-name-${idx}`}>
                                  {typeof restaurant === 'string' ? restaurant : restaurant.name}
                                </span>
                              )}
                            </div>
                            {(restaurant as any).cuisine && (
                              <div className="text-xs text-gray-500 mt-1">
                                {(restaurant as any).cuisine}
                              </div>
                            )}
                          </div>
                        </div>
                      )) || (
                        <div className="text-sm text-gray-500">• Lokale Spezialitäten entdecken</div>
                      )}
                    </div>
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
                      <span className="font-medium">Unterkunft:</span> {(location as any).accommodationWebsite ? (
                        <a href={(location as any).accommodationWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline ml-1">
                          {location.accommodation || 'Komfortable Unterkunft'}
                        </a>
                      ) : (
                        <span className="ml-1">{location.accommodation || 'Komfortable Unterkunft'}</span>
                      )} • 2 Nächte
                    </p>
                  </div>
                </div>

                {/* Fun Facts Preview */}
                <div className="px-6 pb-4">
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">🎯</span>
                      <h4 className="font-semibold text-amber-800">Wussten Sie schon?</h4>
                    </div>
                    <p className="text-sm text-amber-700">
                      {(() => {
                        // Show first fun fact or default based on location
                        if ((location as any).funFacts?.length > 0) {
                          return (location as any).funFacts[0];
                        }
                        switch (location.slug) {
                          case 'penticton':
                            return '"Penticton" bedeutet "ein Ort, um für immer zu bleiben" auf der ursprünglichen Okanagan-Sprache.';
                          case 'vernon':
                            return 'Vernon veranstaltet Westkanadas größten Winterkarneval - den zweitgrößten in ganz Nordamerika!';
                          case 'jasper':
                            return 'Jasper ist ein Dark Sky Reserve - einer der besten Orte für Sterne und Nordlichter in Kanada.';
                          case 'golden':
                            return 'Golden bietet Zugang zu über 300 Kilometern Mountainbike-Strecken in den Rocky Mountains.';
                          case 'wells-gray':
                            return 'Wells Gray ist als "Kanadas Wasserfall-Park" bekannt mit über 40 spektakulären Wasserfällen.';
                          case 'sunshine-coast':
                            return 'Die Sunshine Coast ist nur mit der Fähre erreichbar, obwohl sie auf dem Festland liegt.';
                          default:
                            return 'Entdecken Sie faszinierende Fakten über diese einzigartige kanadische Destination!';
                        }
                      })()}
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