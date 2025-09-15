import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/ImageGallery";
import Header from "@/components/Header";
import { calculateNights, formatNights } from "@/lib/utils";
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
      <Header />
      {/* Location Header */}
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2 pr-8" data-testid="location-title">{location.name}</h1>
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

            {/* Map Snippet */}
            {(location as any).mapImageUrl && (
              <Card data-testid="location-map">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
                    🗺️ <span className="ml-2">Lage & Karte</span>
                  </h2>
                  <div className="rounded-xl overflow-hidden border border-border">
                    <img 
                      src={(location as any).mapImageUrl} 
                      alt={`Karte von ${location.name}`}
                      className="w-full h-64 object-cover"
                      data-testid="location-map-image"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Restaurants & Kulinarik */}
            {location.restaurants && location.restaurants.length > 0 && (
              <Card data-testid="location-restaurants">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">🍽️ Restaurants & Kulinarik</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {location.restaurants.map((restaurant, index) => (
                      <div key={index} className="border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50" data-testid={`restaurant-${index}`}>
                        {/* Restaurant Image */}
                        {restaurant.imageUrl && (
                          <div className="mb-4 aspect-video rounded-lg overflow-hidden">
                            <img 
                              src={restaurant.imageUrl} 
                              alt={restaurant.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              data-testid={`restaurant-image-${index}`}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-foreground text-xl mb-2">{restaurant.name}</h3>
                            <p className="text-muted-foreground leading-relaxed">{restaurant.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {restaurant.cuisine && (
                              <Badge variant="secondary" className="text-sm px-3 py-1">
                                {restaurant.cuisine}
                              </Badge>
                            )}
                          </div>
                          
                          {restaurant.websiteUrl && (
                            <div className="pt-2">
                              <a 
                                href={restaurant.websiteUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                                data-testid={`restaurant-website-${index}`}
                              >
                                🌐 Website & Reservierung
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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

            {/* Live Trip Feed - Link to Centralized Feed */}
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200" data-testid="location-live-feed-link">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="text-4xl mb-2">📸</div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Reise-Fotos teilen
                  </h2>
                  <p className="text-muted-foreground">
                    Teile deine besten Momente von {location.name} im zentralen Live-Feed
                  </p>
                  <Link href="/live-feed">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white" data-testid="button-go-to-live-feed">
                      🚗 Zum Live-Feed gehen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Accommodation Details */}
            {location.accommodation && (
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10" data-testid="location-accommodation">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center">
                      🏨 <span className="ml-2">Ihre Unterkunft</span>
                    </h3>
                    <div className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-medium">
                      Premium
                    </div>
                  </div>
                  
                  {/* Accommodation Name with Image and Link */}
                  <div className="mb-6 p-4 bg-white rounded-lg border border-primary/10 shadow-sm">
                    <div className="flex items-start gap-4">
                      {/* Accommodation Image */}
                      {(location as any).accommodationImageUrl && (
                        <img 
                          src={(location as any).accommodationImageUrl} 
                          alt={location.accommodation}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          data-testid="accommodation-image"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground text-base mb-2">{location.accommodation}</h4>
                        <p className="text-sm text-muted-foreground mb-3">Zentral gelegene Unterkunft mit modernen Annehmlichkeiten</p>
                        {(location as any).accommodationWebsite && (
                          <a 
                            href={(location as any).accommodationWebsite} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                            data-testid="accommodation-website-link"
                          >
                            🌐 Website & Reservierung
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Included Services */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-primary/10">
                    <h5 className="text-sm font-bold text-foreground mb-3 flex items-center">
                      ✨ <span className="ml-2">Inklusiv-Leistungen</span>
                    </h5>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {/* Always show the nights calculation first */}
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        {formatNights(calculateNights(location.startDate, location.endDate))} Aufenthalt
                      </div>
                      {/* Dynamic inclusive services */}
                      {location.accommodationInclusiveServices && location.accommodationInclusiveServices.length > 0 ? (
                        location.accommodationInclusiveServices.map((service, index) => (
                          <div key={index} className="flex items-center" data-testid={`inclusive-service-${index}`}>
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            {service}
                          </div>
                        ))
                      ) : (
                        // Fallback services if no data exists
                        <>
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            Inkl. Frühstück
                          </div>
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            Kostenfreies WLAN
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mb-4">
                    <h5 className="text-sm font-bold text-foreground mb-3 flex items-center">
                      🛏️ <span className="ml-2">Ausstattung</span>
                    </h5>
                    {location.accommodationAmenities && location.accommodationAmenities.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {location.accommodationAmenities.map((amenity, index) => (
                          <div key={index} className="flex items-center" data-testid={`amenity-${index}`}>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                            {amenity}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Fallback amenities if no data exists
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                          Klimaanlage
                        </div>
                        <div className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                          Privates Bad
                        </div>
                        <div className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                          TV & Minibar
                        </div>
                        <div className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                          Concierge
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Check-in Information */}
                  <div className="border-t border-primary/20 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-white rounded border border-primary/10" data-testid="check-in-info">
                        <span className="font-bold text-foreground block">Check-in</span>
                        <div className="text-primary font-medium">
                          {location.accommodationCheckinTime || "15:00 Uhr"}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border border-primary/10" data-testid="check-out-info">
                        <span className="font-bold text-foreground block">Check-out</span>
                        <div className="text-primary font-medium">
                          {location.accommodationCheckoutTime || "11:00 Uhr"}
                        </div>
                      </div>
                    </div>
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

            {/* Fun Facts Section - Now for ALL locations */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200" data-testid="location-fun-facts">
              <CardContent className="pt-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center">
                  🎯 <span className="ml-2">Wussten Sie schon?</span>
                </h3>
                <div className="space-y-3">
                  {(location as any).funFacts?.length > 0 ? (location as any).funFacts.map((fact: string, index: number) => (
                    <div key={index} className="flex items-start bg-white/60 rounded-lg p-3 border border-amber-100" data-testid={`fun-fact-${index}`}>
                      <span className="text-amber-600 font-bold mr-3 mt-0.5">•</span>
                      <p className="text-sm text-foreground leading-relaxed">{fact}</p>
                    </div>
                  )) : (() => {
                    // Default fun facts based on location slug
                    const getDefaultFunFacts = (slug: string) => {
                      switch (slug) {
                        case 'penticton':
                          return [
                            '"Penticton" bedeutet auf der ursprünglichen Okanagan-Sprache "ein Ort, um für immer zu bleiben" - bezogen auf die Wasserwege zwischen Okanagan und Skaha Lake.',
                            'Das südliche Okanagan ist Teil der nördlichsten Spitze der Sonoran-Wüste, die sich 3.000 Meilen bis nach Mexiko erstreckt.',
                            'Die Region erhält bis zu 2.000 Sonnenstunden pro Jahr und 14 Stunden direktes Sonnenlicht täglich im Sommer - mehr als die Weinberge in Kalifornien.',
                            'Der erste Weinberg wurde 1859 von einem französischen katholischen Priester namens Charles Pandosy angelegt - ausschließlich für Messwein.',
                            'Bären sind ein großes Problem in den Weinbergen - sie essen nicht nur die Trauben, sondern reißen ganze Rebstöcke mitsamt den Wurzeln heraus!'
                          ];
                        case 'vernon':
                          return [
                            'Vernons ursprünglicher indigener Name war "Nintle-Moos-Chin", was "über den Bach springen" bedeutet - die Ufer des BX Creek waren so nah, dass Menschen wortwörtlich darüber springen konnten.',
                            'Vernon veranstaltet Westkanadas größten Winterkarneval und ist der zweitgrößte in ganz Nordamerika!',
                            'Die Vernon Vipers gewannen den Royal Bank Cup sechs Mal, einschließlich aufeinanderfolgender Siege 2009 und 2010.',
                            'Vernons Flagge wurde von kanadischen Soldaten in Afghanistan gehisst, bevor sie 2010 offiziell angenommen wurde.',
                            'Die Stadt hat 28 historische Wandgemälde im Stadtzentrum, die ihre Geschichte darstellen.'
                          ];
                        case 'jasper':
                          return [
                            'Jasper ist der größte Nationalpark in den kanadischen Rocky Mountains und gehört zum UNESCO-Weltkulturerbe.',
                            'Der Park ist ein Dark Sky Reserve - einer der besten Orte, um Sterne und Nordlichter in den kanadischen Rockies zu sehen.',
                            'Jasper beherbergt Tausende von einheimischen Tieren, darunter Maultierhirsche, Dickhornschafe, Karibus, Luchse und Pumas.',
                            'Die berühmte Maligne Lake und Spirit Island gehören zu den meistfotografierten Orten Kanadas.',
                            'Der Park bietet ganzjährig Outdoor-Aktivitäten von Rafting und Wandern bis hin zu Skifahren und Camping.'
                          ];
                        case 'golden':
                          return [
                            'Golden ist berühmt für Wildwasser-Rafting am Kicking Horse River - einer der Top-Rafting-Destinationen in den kanadischen Rockies.',
                            'Die strategische Lage macht es zum perfekten Stopp auf dem Trans-Canada Highway zwischen den Rockies und dem Inneren von BC.',
                            'Golden ist ein beliebter Ausgangspunkt für die Erkundung sowohl des Yoho National Parks als auch des Glacier National Parks.',
                            'Die Stadt liegt auf 1.024 Metern über dem Meeresspiegel im Columbia River Valley.',
                            'Golden bietet Zugang zu über 300 Kilometern Mountainbike-Strecken und gilt als Mekka für Outdoor-Enthusiasten.'
                          ];
                        case 'wells-gray':
                          return [
                            'Wells Gray ist als "Kanadas Wasserfall-Park" bekannt - der berühmteste Park für Wasserfälle in der Region.',
                            'Die Helmcken Falls stürzen beeindruckende 140 Meter in einen Abgrund und frieren im Winter zu einem Eisturm.',
                            'Der Park wurde 1939 über 541.000 Hektar gegründet und ist der viertgrößte Provinzpark in BC.',
                            'Schwarzbären werden häufig im Mai und Juni beim Fressen neuer Triebe gesehen.',
                            'Clearwater Lake Touren bietet Wildtier-Kreuzfahrten, bei denen man Karibus und Hirsche beim Schwimmen über den See sehen kann!'
                          ];
                        case 'sunshine-coast':
                          return [
                            'Obwohl sie auf dem Festland liegt, ist die Sunshine Coast nur mit der Fähre erreichbar - was ihr ein Inselgefühl verleiht.',
                            'Die Region ist eine weniger touristische Alternative zu anderen Küstenzielen und bietet ein authentischeres Küsten-BC-Erlebnis.',
                            'Die Sunshine Coast erstreckt sich über 180 Kilometer entlang der Pazifikküste nordwestlich von Vancouver.',
                            'Powell River ist bekannt als "Dive Capital of Canada" mit über 40 Schiffswracks zum Erkunden.',
                            'Das Gebiet bietet perfekte Outdoor-Abenteuer ohne die Menschenmengen berühmterer Ziele.'
                          ];
                        default:
                          return [
                            'Diese wunderschöne kanadische Destination bietet atemberaubende Landschaften und einzigartige Erlebnisse.',
                            'British Columbia ist bekannt für seine vielfältige Natur von Weinregionen bis zu alpinen Gipfeln.',
                            'Die Region ist ein Paradies für Outdoor-Enthusiasten und Naturliebhaber.',
                            'Jede Destination auf unserer Reise wurde sorgfältig für ihre besonderen Eigenschaften ausgewählt.',
                            'Kanada bietet einige der spektakulärsten Landschaften der Welt.'
                          ];
                      }
                    };
                    
                    return getDefaultFunFacts(location.slug).map((fact, index) => (
                      <div key={index} className="flex items-start bg-white/60 rounded-lg p-3 border border-amber-100" data-testid={`fun-fact-${index}`}>
                        <span className="text-amber-600 font-bold mr-3 mt-0.5">•</span>
                        <p className="text-sm text-foreground leading-relaxed">{fact}</p>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

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
