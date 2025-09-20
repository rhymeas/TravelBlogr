import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import LocationCard from "@/components/LocationCard";
import Header from "@/components/Header";
import { Lightbox } from "@/components/Lightbox";
import { Link } from "wouter";
import type { Location, TourSettings, ScenicContent } from "@shared/schema";

export default function Home() {
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: tourSettings } = useQuery<TourSettings>({
    queryKey: ["/api/tour-settings"],
  });

  const { data: scenicContent } = useQuery<ScenicContent>({
    queryKey: ["/api/scenic-content"],
  });

  // Prevent cache mutation by creating a new sorted array
  const sortedGalleries = useMemo(() => {
    return [...(scenicContent?.galleries ?? [])].sort((a, b) => a.order - b.order);
  }, [scenicContent?.galleries]);

  // Convert scenic gallery to lightbox format (only non-linked images for consistent UX)
  const lightboxImages = useMemo(() => {
    return sortedGalleries
      .filter(gallery => !gallery.linkUrl) // Exclude linked galleries from lightbox
      .map(gallery => ({
        id: gallery.id,
        imageUrl: gallery.imageUrl,
        caption: `${gallery.title} - ${gallery.description}`
      }));
  }, [sortedGalleries]);

  // Lightbox handlers with proper index clamping (no wrap-around to match Lightbox UI)
  const openLightbox = (index: number) => {
    // Map from sortedGalleries index to lightboxImages index
    const galleryItemsUpToIndex = sortedGalleries.slice(0, index + 1);
    const lightboxIndex = galleryItemsUpToIndex.filter(g => !g.linkUrl).length - 1;
    setLightboxIndex(Math.max(0, lightboxIndex));
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => Math.min(prev + 1, lightboxImages.length - 1));
  };

  const previousImage = () => {
    setLightboxIndex((prev) => Math.max(prev - 1, 0));
  };

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
            {sortedGalleries.map((gallery, index) => {
                const GalleryContent = (
                  <div className={`relative ${gallery.isLarge ? 'h-80 lg:h-full' : 'h-40 lg:h-48'} rounded-xl overflow-hidden group cursor-pointer`}>
                    <img 
                      src={gallery.imageUrl}
                      alt={gallery.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      data-testid={`gallery-image-${index}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className={`absolute ${gallery.isLarge ? 'bottom-6 left-6' : 'bottom-4 left-4'} text-white`}>
                      <h3 className={`${gallery.isLarge ? 'text-2xl font-bold mb-2' : 'text-lg font-semibold'}`}>{gallery.title}</h3>
                      <p className={`text-white/90 ${gallery.isLarge ? 'text-base' : 'text-sm'}`}>{gallery.description}</p>
                    </div>
                    {/* Click to expand indicator */}
                    <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
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
                      <div 
                        onClick={() => openLightbox(index)}
                        data-testid={`gallery-item-${index}`}
                      >
                        {GalleryContent}
                      </div>
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

      {/* Lightbox for scenic gallery images */}
      <Lightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={nextImage}
        onPrevious={previousImage}
      />
    </div>
  );
}
