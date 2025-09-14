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
              <Link href="/admin">
                <Button data-testid="nav-admin">Admin</Button>
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
              <Link href="/admin" className="block">
                <Button className="w-full" data-testid="mobile-nav-admin">Admin</Button>
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

      {/* Featured Locations */}
      <section id="locations" className="py-20 bg-secondary" data-testid="locations-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Highlights unserer Reise</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Entdecke die besonderen Orte und Erlebnisse, die unsere Tour unvergesslich machen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {locations?.slice(0, 6).map((location) => (
              <LocationCard key={location.id} location={location} />
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
