import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveTripFeed } from "@/components/LiveTripFeed";
import type { Location } from "@shared/schema";

export default function LiveFeedPage() {
  const { data: locations, isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="live-feed-page">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8" data-testid="live-feed-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" data-testid="back-button">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zur Tour
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="live-feed-title">
            🚗 Live Reise-Feed
          </h1>
          <p className="text-primary-foreground/90 text-lg">
            Aktuelle Fotos und Updates direkt von der Weinberg Tour 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!locations || locations.length === 0 ? (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Keine Locations gefunden</h2>
              <p className="text-muted-foreground mb-4">Es sind noch keine Reiseziele verfügbar.</p>
              <Link href="/">
                <Button>Zurück zur Startseite</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {/* Overview */}
            <Card data-testid="live-feed-overview">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">📸</span>
                  Live Updates von allen Stationen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locations.map((location) => (
                    <Link key={location.id} href={`/location/${location.slug}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`location-preview-${location.slug}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-3 mb-3">
                            {location.imageUrl && (
                              <img 
                                src={location.imageUrl} 
                                alt={location.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground">{location.name}</h3>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3 mr-1" />
                                {location.startDate} - {location.endDate}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Live Fotos und Updates ansehen →
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Individual Location Feeds */}
            <div className="space-y-12">
              {locations.map((location) => (
                <Card key={location.id} className="overflow-hidden" data-testid={`location-feed-${location.slug}`}>
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {location.imageUrl && (
                          <img 
                            src={location.imageUrl} 
                            alt={location.name}
                            className="w-16 h-16 object-cover rounded-xl"
                          />
                        )}
                        <div>
                          <CardTitle className="text-2xl mb-2">{location.name}</CardTitle>
                          <div className="flex flex-wrap gap-4 text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{location.startDate} - {location.endDate}</span>
                            </div>
                            {location.distance && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                <span>{location.distance} km</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link href={`/location/${location.slug}`}>
                        <Button variant="outline" size="sm" data-testid={`view-location-${location.slug}`}>
                          Details ansehen →
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <LiveTripFeed 
                      locationId={location.id} 
                      locationName={location.name}
                      showUpload={true}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}