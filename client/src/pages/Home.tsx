import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import LocationCard from "@/components/LocationCard";
import Header from "@/components/Header";
import { Link } from "wouter";
import type { Location, TourSettings, ScenicContent } from "@shared/schema";

export default function Home() {

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: tourSettings } = useQuery<TourSettings>({
    queryKey: ["/api/tour-settings"],
  });

  const { data: scenicContent } = useQuery<ScenicContent>({
    queryKey: ["/api/scenic-content"],
  });

  if (locationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      <Header />

      {/* Hero Section */}
      <section id="home">
        <Hero tourSettings={tourSettings} />
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-secondary" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in" data-testid="stat-days">
              <div className="text-3xl font-bold text-primary mb-2">17</div>
              <div className="text-muted-foreground">Reisetage</div>
            </div>
            <div className="animate-fade-in" data-testid="stat-destinations">
              <div className="text-3xl font-bold text-primary mb-2">{locations?.length || 7}</div>
              <div className="text-muted-foreground">Reiseziele</div>
            </div>
            <div className="animate-fade-in" data-testid="stat-distance">
              <div className="text-3xl font-bold text-primary mb-2">
                {tourSettings?.totalDistance?.toLocaleString('de-DE') || '2.130'}
              </div>
              <div className="text-muted-foreground">Kilometer</div>
            </div>
            <div className="animate-fade-in" data-testid="stat-memories">
              <div className="text-3xl font-bold text-primary mb-2">∞</div>
              <div className="text-muted-foreground">Erinnerungen</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Timeline */}
      <section id="timeline" className="py-20 bg-background" data-testid="timeline-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Unser Reiseverlauf</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Eine sorgfältig geplante Reise durch die schönsten Regionen Westkanadas
            </p>
          </div>
          <Timeline locations={locations || []} />
        </div>
      </section>

      {/* Featured Scenic Highlights */}
      <section id="locations" className="py-20 bg-secondary" data-testid="locations-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {scenicContent?.title || "Spektakuläre Landschaften erwarten uns"}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {scenicContent?.subtitle || "Von den türkisfarbenen Seen des Okanagan-Tals bis zu den majestätischen Gipfeln der Rocky Mountains - jeder Ort ist ein Fotomotiv"}
            </p>
          </div>

          {/* Scenic Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {scenicContent?.galleries
              ?.sort((a, b) => a.order - b.order)
              ?.map((gallery) => {
                const GalleryContent = (
                  <div className={`relative ${gallery.isLarge ? 'h-80 lg:h-full' : 'h-40 lg:h-48'} rounded-xl overflow-hidden group`}>
                    <img 
                      src={gallery.imageUrl}
                      alt={gallery.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className={`absolute ${gallery.isLarge ? 'bottom-6 left-6' : 'bottom-4 left-4'} text-white`}>
                      <h3 className={`${gallery.isLarge ? 'text-2xl font-bold mb-2' : 'text-lg font-semibold'}`}>{gallery.title}</h3>
                      <p className={`text-white/90 ${gallery.isLarge ? 'text-base' : 'text-sm'}`}>{gallery.description}</p>
                    </div>
                  </div>
                );

                return (
                  <div 
                    key={gallery.id} 
                    className={gallery.isLarge ? "lg:col-span-2 lg:row-span-2" : ""}
                  >
                    {gallery.linkUrl ? (
                      <Link href={gallery.linkUrl}>
                        <div className="cursor-pointer">
                          {GalleryContent}
                        </div>
                      </Link>
                    ) : (
                      GalleryContent
                    )}
                  </div>
                );
              })}
          </div>

          {/* Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {locations?.slice(0, 6).map((location) => (
              <Link key={location.id} href={`/location/${location.slug}`}>
                <LocationCard location={location} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">WT</span>
              </div>
              <h3 className="text-xl font-semibold">{tourSettings?.tourName || "Weinberg Tour 2025"}</h3>
            </div>
            <p className="text-background/80 mb-6">
              {tourSettings?.description || "Eine unvergessliche Reise durch Westkanada"}
            </p>
            <div className="text-background/60 text-sm">
              {tourSettings?.startDate} - {tourSettings?.endDate} • {locations?.length} Destinationen • {tourSettings?.totalDistance?.toLocaleString('de-DE')} km
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
