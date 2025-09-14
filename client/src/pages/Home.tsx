import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import LocationCard from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X } from "lucide-react";
import { Link } from "wouter";
import type { Location, TourSettings } from "@shared/schema";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: tourSettings } = useQuery<TourSettings>({
    queryKey: ["/api/tour-settings"],
  });

  if (locationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-border" data-testid="main-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">WT</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                {tourSettings?.tourName || "Weinberg Tour 2025"}
              </h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="nav-home"
              >
                Start
              </button>
              <button 
                onClick={() => scrollToSection('timeline')}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="nav-timeline"
              >
                Reiseverlauf
              </button>
              <button 
                onClick={() => scrollToSection('locations')}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="nav-locations"
              >
                Orte
              </button>
              <Link href="/live-feed">
                <Button variant="outline" data-testid="nav-live-feed">Live Reise-Feed</Button>
              </Link>
              <Link href="/admin">
                <Button data-testid="nav-admin">Editieren</Button>
              </Link>
            </div>

            <button 
              className="md:hidden" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" data-testid="mobile-menu">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="fixed right-0 top-0 h-full w-64 bg-background border-l border-border p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-semibold">Menü</h2>
              <button onClick={() => setMobileMenuOpen(false)} data-testid="mobile-menu-close">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-4">
              <button 
                onClick={() => scrollToSection('home')}
                className="block w-full text-left text-muted-foreground hover:text-primary transition-colors"
                data-testid="mobile-nav-home"
              >
                Start
              </button>
              <button 
                onClick={() => scrollToSection('timeline')}
                className="block w-full text-left text-muted-foreground hover:text-primary transition-colors"
                data-testid="mobile-nav-timeline"
              >
                Reiseverlauf
              </button>
              <button 
                onClick={() => scrollToSection('locations')}
                className="block w-full text-left text-muted-foreground hover:text-primary transition-colors"
                data-testid="mobile-nav-locations"
              >
                Orte
              </button>
              <Link href="/live-feed" className="block">
                <Button className="w-full" variant="outline" data-testid="mobile-nav-live-feed">Live Reise-Feed</Button>
              </Link>
              <Link href="/admin" className="block">
                <Button className="w-full" data-testid="mobile-nav-admin">Editieren</Button>
              </Link>
            </nav>
          </div>
        </div>
      )}

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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Spektakuläre Landschaften erwarten uns</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Von den türkisfarbenen Seen des Okanagan-Tals bis zu den majestätischen Gipfeln der Rocky Mountains - jeder Ort ist ein Fotomotiv
            </p>
          </div>

          {/* Scenic Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2 lg:row-span-2">
              <div className="relative h-80 lg:h-full rounded-xl overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800"
                  alt="Penticton Weinberge"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Penticton Wine Country</h3>
                  <p className="text-white/90">Okanagan Valley mit über 170 Weingütern</p>
                </div>
              </div>
            </div>

            <div className="relative h-40 lg:h-48 rounded-xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
                alt="Maligne Lake Jasper"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="text-lg font-semibold">Maligne Lake</h4>
                <p className="text-sm text-white/90">Spirit Island</p>
              </div>
            </div>

            <div className="relative h-40 lg:h-48 rounded-xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
                alt="Golden Rocky Mountains"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="text-lg font-semibold">Golden Rockies</h4>
                <p className="text-sm text-white/90">Kicking Horse River</p>
              </div>
            </div>

            <div className="relative h-40 lg:h-48 rounded-xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
                alt="Kalamalka Lake Vernon"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="text-lg font-semibold">Kalamalka Lake</h4>
                <p className="text-sm text-white/90">Türkisfarbenes Juwel</p>
              </div>
            </div>

            <div className="relative h-40 lg:h-48 rounded-xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
                alt="Sunshine Coast"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="text-lg font-semibold">Sunshine Coast</h4>
                <p className="text-sm text-white/90">Desolation Sound</p>
              </div>
            </div>

            <div className="relative h-40 lg:h-48 rounded-xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
                alt="Wells Gray Wasserfälle"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="text-lg font-semibold">Wells Gray Falls</h4>
                <p className="text-sm text-white/90">Helmcken Falls</p>
              </div>
            </div>
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
