import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/ImageGallery";
import type { Location } from "@shared/schema";

export default function LocationDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: location, isLoading } = useQuery<Location>({
    queryKey: ["/api/locations", slug],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="location-not-found">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Ort nicht gefunden</h1>
            <p className="text-muted-foreground mb-4">Der angeforderte Ort konnte nicht gefunden werden.</p>
            <Link href="/">
              <Button>Zurück zur Startseite</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="location-detail">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8" data-testid="location-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" data-testid="back-button">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2" data-testid="location-title">{location.name}</h1>
          <div className="flex flex-wrap gap-4 text-primary-foreground/90">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span data-testid="location-dates">{location.startDate} - {location.endDate}</span>
            </div>
            {location.distance && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span data-testid="location-distance">{location.distance} km</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            {location.imageUrl && (
              <div className="aspect-video rounded-xl overflow-hidden" data-testid="location-hero-image">
                <img 
                  src={location.imageUrl} 
                  alt={location.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Image Gallery */}
            <ImageGallery 
              locationId={location.id} 
              isAdmin={false}
            />

            {/* Description */}
            <Card data-testid="location-description">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">Über {location.name}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {location.description}
                </p>
              </CardContent>
            </Card>

            {/* Activities */}
            {location.activities && location.activities.length > 0 && (
              <Card data-testid="location-activities">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4">🎯 Aktivitäten</h2>
                  <ul className="space-y-3">
                    {location.activities.map((activity, index) => (
                      <li key={index} className="flex items-start" data-testid={`activity-${index}`}>
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-muted-foreground">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Experiences */}
            {location.experiences && location.experiences.length > 0 && (
              <Card data-testid="location-experiences">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4">✨ Besondere Erlebnisse</h2>
                  <ul className="space-y-3">
                    {location.experiences.map((experience, index) => (
                      <li key={index} className="flex items-start" data-testid={`experience-${index}`}>
                        <span className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-muted-foreground">{experience}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Accommodation Details */}
            {location.accommodation && (
              <Card data-testid="location-accommodation">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4">🏨 Unterkunft</h3>
                  
                  {/* Accommodation Name */}
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground text-sm mb-1">{location.accommodation}</h4>
                    <p className="text-xs text-muted-foreground">Zentral gelegene Unterkunft mit modernen Annehmlichkeiten</p>
                  </div>

                  {/* Included Services */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="text-xs text-muted-foreground">
                      <div>• 2 Nächte Aufenthalt</div>
                      <div>• Inkl. Frühstück</div>
                      <div>• Kostenfreies WLAN</div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-foreground mb-2">Ausstattung</h5>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                        Klimaanlage
                      </div>
                      <div className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                        Privates Badezimmer
                      </div>
                      <div className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                        TV & Minibar
                      </div>
                      <div className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                        Concierge Service
                      </div>
                    </div>
                  </div>

                  {/* Check-in Information */}
                  <div className="border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-foreground">Check-in:</span>
                        <div className="text-muted-foreground">15:00 Uhr</div>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Check-out:</span>
                        <div className="text-muted-foreground">11:00 Uhr</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Restaurants */}
            {location.restaurants && location.restaurants.length > 0 && (
              <Card data-testid="location-restaurants">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4">🍽️ Restaurants</h3>
                  <div className="space-y-4">
                    {location.restaurants.map((restaurant, index) => (
                      <div key={index} className="border-b border-border last:border-b-0 pb-3 last:pb-0" data-testid={`restaurant-${index}`}>
                        <h4 className="font-medium text-foreground text-sm">{restaurant.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{restaurant.description}</p>
                        {restaurant.cuisine && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {restaurant.cuisine}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {location.highlights && location.highlights.length > 0 && (
              <Card data-testid="location-highlights">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4">🌟 Highlights</h3>
                  <div className="flex flex-wrap gap-2">
                    {location.highlights.map((highlight, index) => (
                      <Badge key={index} variant="outline" className="text-xs" data-testid={`highlight-${index}`}>
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Button */}
            <Link href="/admin">
              <Button className="w-full" variant="outline" data-testid="edit-location-button">
                📝 Ort bearbeiten
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
