import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MapPin, Calendar, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
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

  // State for fun facts toggle
  const [showAllFunFacts, setShowAllFunFacts] = useState(false);

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

      {/* Hero-Level Accommodation Spotlight */}
      {location.accommodation && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-b border-amber-200 dark:border-amber-800 lg:sticky lg:top-0 lg:z-40" data-testid="hero-accommodation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left side - Accommodation Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl text-white text-2xl shadow-lg">
                    🏨
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-foreground dark:text-foreground">Ihre Unterkunft</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                        ⭐ Premium-Auswahl
                      </div>
                      {(location as any).accommodationPrice && (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                          ab ${(location as any).accommodationPrice} {(location as any).accommodationCurrency || 'CAD'}/Nacht
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-amber-200 dark:border-amber-700">
                  <h3 className="text-xl lg:text-2xl font-bold text-foreground dark:text-foreground mb-3">{location.accommodation}</h3>
                  <p className="text-muted-foreground dark:text-gray-300 mb-4 lg:text-lg">Zentral gelegene Unterkunft mit modernen Annehmlichkeiten und erstklassigem Service</p>
                  
                  {/* Key amenities in a compact row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground dark:text-gray-300">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Frühstück inkl.
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground dark:text-gray-300">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Kostenloses WLAN
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground dark:text-gray-300">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Klimaanlage
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground dark:text-gray-300">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Concierge
                    </div>
                  </div>
                  
                  {/* Check-in times */}
                  <div className="flex gap-4 text-sm text-muted-foreground dark:text-gray-300 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Check-in: 15:00 Uhr
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Check-out: 11:00 Uhr
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Call to Action */}
              <div className="lg:w-80">
                {(location as any).accommodationWebsite ? (
                  <a 
                    href={(location as any).accommodationWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                    data-testid="hero-accommodation-website-link"
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl p-6 text-center shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105">
                      <div className="text-3xl mb-3">🌐</div>
                      <h3 className="text-xl font-bold mb-2">Website besuchen</h3>
                      <p className="text-blue-100 text-sm mb-4">Zimmer anschauen, Verfügbarkeit prüfen & direkt buchen</p>
                      <div className="bg-white/20 rounded-lg py-2 px-4 text-sm font-medium">
                        Zur offiziellen Website →
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl p-6 text-center shadow-xl">
                    <div className="text-3xl mb-3">🏨</div>
                    <h3 className="text-xl font-bold mb-2">Unterkunft</h3>
                    <p className="text-gray-100 text-sm">Details zur Buchung erhalten Sie in Kürze</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Map Screenshot */}
            {(location as any).mapImageUrl && (
              <Card data-testid="location-map">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
                    📍 <span className="ml-2">Lage & Karte</span>
                  </h2>
                  <div className="aspect-video rounded-xl overflow-hidden border border-border">
                    <img 
                      src={(location as any).mapImageUrl} 
                      alt={`Karte von ${location.name}`}
                      className="w-full h-full object-cover"
                      data-testid="location-map-image"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    📍 Genaue Lage und Umgebung von {location.name}
                  </p>
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

            {/* Enhanced Restaurants */}
            {location.restaurants && location.restaurants.length > 0 && (
              <Card data-testid="location-restaurants">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-4">🍽️ Restaurants & Kulinarik</h3>
                  <div className="space-y-4">
                    {location.restaurants.map((restaurant, index) => (
                      <div key={index} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`restaurant-${index}`}>
                        {/* Restaurant Image */}
                        {restaurant.imageUrl && (
                          <div className="mb-3">
                            <img 
                              src={restaurant.imageUrl} 
                              alt={restaurant.name}
                              className="w-full h-32 object-cover rounded-lg"
                              data-testid={`restaurant-image-${index}`}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground text-base mb-1">{restaurant.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{restaurant.description}</p>
                            
                            <div className="flex items-center gap-2 mb-2">
                              {restaurant.cuisine && (
                                <Badge variant="secondary" className="text-xs">
                                  {restaurant.cuisine}
                                </Badge>
                              )}
                            </div>
                            
                            {restaurant.websiteUrl && (
                              <a 
                                href={restaurant.websiteUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                                data-testid={`restaurant-website-${index}`}
                              >
                                🌐 Website & Reservierung
                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
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

            {/* Fun Facts Section - Now for ALL locations */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200" data-testid="location-fun-facts">
              <CardContent className="pt-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center">
                  🎯 <span className="ml-2">Wussten Sie schon?</span>
                </h3>
                <div className="space-y-3">
                  {(() => {
                    // Get fun facts - either from database or researched content
                    const getResearchedFunFacts = (slug: string) => {
                      switch (slug) {
                        case 'penticton':
                          return [
                            'Der Name "Penticton" kommt vom Okanagan-Wort "snpintktn", was "ganzjähriger Fluss zwischen den Seen" bedeutet.',
                            'Penticton ist eine von nur zwei Städten weltweit, die zwischen zwei Seen liegt - dem Okanagan Lake und dem Skaha Lake.',
                            'Die Stadt gilt als "Craft Beer Capital of Canada" mit der höchsten Brauereidichte pro Kopf.',
                            'Der historische Raddampfer S.S. Sicamous, bekannt als "Queen of the Lake", verkehrte von 1914-1951 auf dem Okanagan Lake.',
                            'Penticton hält den Temperaturrekord von British Columbia mit 44,2°C, gemessen im Jahr 2021.'
                          ];
                        case 'vernon':
                          return [
                            'Der ursprüngliche indigene Name war "Nintle-Moos-Chin", was "über den Bach springen" bedeutet - früher konnte man buchstäblich über den BX Creek springen.',
                            'Lord Aberdeen ließ 1892 über 25.000 Obstbäume pflanzen und begründete damit Vernons kommerzielle Obstindustrie.',
                            'Die Vernon Canadians gewannen 1956 den Allan Cup als Kanadas Amateur-Eishockey-Champions.',
                            'Vernon veranstaltet Westkanadas größten Winterkarneval - den zweitgrößten in ganz Nordamerika.',
                            'Die Stadtflagge von Vernon wurde von kanadischen Soldaten in Afghanistan gehisst, bevor sie 2010 offiziell angenommen wurde.'
                          ];
                        case 'jasper':
                          return [
                            'Jasper ist das zweitgrößte Dark Sky Preserve der Welt - Nordlichter erscheinen hier wöchentlich im Winter.',
                            'Der Park beherbergt 53 Säugetierarten, darunter über 1.300 Wapiti-Hirsche.',
                            'Das größte Teleskop der kanadischen Rocky Mountains steht im Jasper Planetarium.',
                            'Murmeltiere und Bären halten hier bis zu 7 Monate Winterschlaf.',
                            'Der Park ist UNESCO-Weltkulturerbe und Teil des größten Schutzgebiets der Rocky Mountains.'
                          ];
                        case 'golden':
                          return [
                            'Der Kicking Horse River wurde 1858 nach James Hector benannt, der hier von seinem Pferd getreten wurde.',
                            'Golden bietet Wildwasser-Rafting der Klasse V - zu den weltweit anspruchsvollsten Rapids.',
                            'Die Stadt hat die längste freistehende Holzbrücke Kanadas.',
                            'Der Kicking Horse River hat den Status eines Canadian Heritage River.',
                            'Golden liegt strategisch zwischen sechs Nationalparks der Rocky Mountains.'
                          ];
                        case 'wells-gray':
                          return [
                            'Wells Gray wird "Kanadas Wasserfall-Park" genannt und hat 41 benannte Wasserfälle.',
                            'Die Helmcken Falls sind der vierthöchste Wasserfall Kanadas und bilden im Winter einen 50 Meter hohen Eiskegel.',
                            'Der Park beherbergt über 1.050 Pflanzenarten - mehr als jeder andere Park in BC.',
                            'Vulkanische Aktivität vor 6.000 Jahren formte die einzigartige Landschaft.',
                            'Der Park ist so abgelegen, dass neue Arten regelmäßig entdeckt werden.'
                          ];
                        case 'sunshine-coast':
                          return [
                            'Die Sunshine Coast ist seit 1951 nur per Fähre erreichbar - was ihr ein einzigartiges Inselgefühl verleiht.',
                            'Hier wurde 18 Jahre lang "The Beachcombers" gedreht - Kanadas längste TV-Serie mit 387 Episoden.',
                            'Die Sunshine Coast ist Mile 0 des Highway 101-Netzwerks, das bis nach Chile führt.',
                            'Die 180 Kilometer Küstenlinie bietet über 10.000 Jahre indigener Kulturgeschichte.',
                            'Powell River gilt als "Dive Capital of Canada" mit über 40 betauchbaren Schiffswracks.'
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

                    const funFacts = (location as any).funFacts?.length > 0 ? (location as any).funFacts : getResearchedFunFacts(location.slug);
                    const shouldShowToggle = funFacts.length > 4;
                    const factsToShow = shouldShowToggle ? (showAllFunFacts ? funFacts : funFacts.slice(0, 4)) : funFacts;

                    return (
                      <>
                        {factsToShow.map((fact: string, index: number) => (
                          <div key={index} className="flex items-start bg-white/60 dark:bg-white/10 rounded-lg p-3 border border-amber-100 dark:border-amber-800" data-testid={`fun-fact-${index}`}>
                            <span className="text-amber-600 dark:text-amber-400 font-bold mr-3 mt-0.5">•</span>
                            <p className="text-sm text-foreground dark:text-foreground leading-relaxed">{fact}</p>
                          </div>
                        ))}
                        {shouldShowToggle && (
                          <button
                            onClick={() => setShowAllFunFacts(!showAllFunFacts)}
                            className="flex items-center justify-center w-full mt-4 py-3 px-4 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg font-medium transition-colors"
                            data-testid="fun-facts-toggle"
                          >
                            {showAllFunFacts ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-2" />
                                Weniger anzeigen
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                Mehr anzeigen ({funFacts.length - 4} weitere)
                              </>
                            )}
                          </button>
                        )}
                      </>
                    );
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
